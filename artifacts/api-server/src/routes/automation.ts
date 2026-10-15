import { Router, type IRouter } from "express";
import { count, desc, eq } from "drizzle-orm";
import { automationEventsTable, db } from "@workspace/db";
import {
  GetAutomationStatusResponse,
  ListAutomationEventsQueryParams,
  ListAutomationEventsResponse,
  RetryAutomationEventParams,
  RetryAutomationEventResponse,
} from "@workspace/api-zod";
import { requireAdmin, requireEmployee } from "../middlewares/pos-auth";
import { dispatchWebhookEvent, isOrderWebhookConfigured } from "../lib/webhooks";

const router: IRouter = Router();
router.use(requireEmployee, requireAdmin);

function eventDto(event: typeof automationEventsTable.$inferSelect) {
  return {
    id: event.id,
    eventType: event.eventType,
    payload: event.payload,
    syncStatus: event.syncStatus,
    attempts: event.attempts,
    lastError: event.lastError,
    createdAt: event.createdAt.toISOString(),
    processedAt: event.processedAt?.toISOString() ?? null,
  };
}

router.get("/automation/status", async (_req, res): Promise<void> => {
  const [pending] = await db
    .select({ value: count() })
    .from(automationEventsTable)
    .where(eq(automationEventsTable.syncStatus, "Pending"));
  const [processed] = await db
    .select({ value: count() })
    .from(automationEventsTable)
    .where(eq(automationEventsTable.syncStatus, "Processed"));
  res.json(
    GetAutomationStatusResponse.parse({
      configured: isOrderWebhookConfigured(),
      pendingCount: pending.value,
      processedCount: processed.value,
    }),
  );
});

router.get("/automation/events", async (req, res): Promise<void> => {
  const params = ListAutomationEventsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const events = await db
    .select()
    .from(automationEventsTable)
    .orderBy(desc(automationEventsTable.createdAt))
    .limit(params.data.limit ?? 30);
  res.json(ListAutomationEventsResponse.parse(events.map(eventDto)));
});

router.post("/automation/events/:id/retry", async (req, res): Promise<void> => {
  const params = RetryAutomationEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [event] = await db
    .select()
    .from(automationEventsTable)
    .where(eq(automationEventsTable.id, params.data.id))
    .limit(1);
  if (!event) {
    res.status(404).json({ error: "Automation event not found." });
    return;
  }
  if (event.syncStatus === "Pending") {
    await dispatchWebhookEvent(event.id);
  }
  const [updated] = await db
    .select()
    .from(automationEventsTable)
    .where(eq(automationEventsTable.id, event.id))
    .limit(1);
  res.json(RetryAutomationEventResponse.parse(eventDto(updated ?? event)));
});

export default router;
