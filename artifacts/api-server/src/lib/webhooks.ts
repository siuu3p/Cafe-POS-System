import { and, asc, eq } from "drizzle-orm";
import {
  automationEventsTable,
  db,
} from "@workspace/db";
import { logger } from "./logger";

const REQUEST_TIMEOUT_MS = 5_000;
const RETRY_INTERVAL_MS = 30_000;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;

export function isOrderWebhookConfigured(): boolean {
  return Boolean(process.env["ORDER_COMPLETED_WEBHOOK_URL"]?.trim());
}

export async function dispatchWebhookEvent(eventId: string): Promise<void> {
  const [event] = await db
    .select()
    .from(automationEventsTable)
    .where(eq(automationEventsTable.id, eventId))
    .limit(1);
  if (!event || event.syncStatus === "Processed") return;

  const configuredUrl = process.env["ORDER_COMPLETED_WEBHOOK_URL"]?.trim();
  const now = new Date();
  if (!configuredUrl) {
    await db
      .update(automationEventsTable)
      .set({ lastError: "ORDER_COMPLETED_WEBHOOK_URL is not configured.", lastAttemptAt: now })
      .where(eq(automationEventsTable.id, eventId));
    return;
  }

  let target: URL;
  try {
    target = new URL(configuredUrl);
    if (
      target.protocol !== "https:" &&
      !(process.env["NODE_ENV"] !== "production" && target.protocol === "http:")
    ) {
      throw new Error("Webhook URL must use HTTPS.");
    }
  } catch (error) {
    await db
      .update(automationEventsTable)
      .set({
        lastError: error instanceof Error ? error.message : "Webhook URL is invalid.",
        lastAttemptAt: now,
      })
      .where(eq(automationEventsTable.id, eventId));
    return;
  }

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-cafe-event-id": event.id,
        "x-cafe-event-type": event.eventType,
      },
      body: JSON.stringify(event.payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: "error",
    });
    const attemptedAt = new Date();
    if (!response.ok) {
      await db
        .update(automationEventsTable)
        .set({
          attempts: event.attempts + 1,
          lastError: `Webhook responded with HTTP ${response.status}.`,
          lastAttemptAt: attemptedAt,
        })
        .where(eq(automationEventsTable.id, eventId));
      return;
    }

    await db
      .update(automationEventsTable)
      .set({
        attempts: event.attempts + 1,
        syncStatus: "Processed",
        lastError: null,
        lastAttemptAt: attemptedAt,
        processedAt: attemptedAt,
      })
      .where(eq(automationEventsTable.id, eventId));
  } catch (error) {
    const attemptedAt = new Date();
    const message = error instanceof Error ? error.message : "Webhook delivery failed.";
    await db
      .update(automationEventsTable)
      .set({
        attempts: event.attempts + 1,
        lastError: message.slice(0, 1000),
        lastAttemptAt: attemptedAt,
      })
      .where(eq(automationEventsTable.id, eventId));
    logger.warn({ eventId, err: message }, "Order completion webhook delivery failed");
  }
}

export async function retryPendingWebhookEvents(): Promise<void> {
  if (!isOrderWebhookConfigured()) return;
  const pending = await db
    .select({
      id: automationEventsTable.id,
      attempts: automationEventsTable.attempts,
      lastAttemptAt: automationEventsTable.lastAttemptAt,
    })
    .from(automationEventsTable)
    .where(eq(automationEventsTable.syncStatus, "Pending"))
    .orderBy(asc(automationEventsTable.lastAttemptAt), asc(automationEventsTable.createdAt))
    .limit(50);

  const now = Date.now();
  for (const event of pending) {
    const backoff = Math.min(
      RETRY_INTERVAL_MS * 2 ** Math.max(0, event.attempts - 1),
      MAX_RETRY_DELAY_MS,
    );
    if (event.lastAttemptAt && now - event.lastAttemptAt.getTime() < backoff) continue;
    await dispatchWebhookEvent(event.id);
  }
}
