import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { ordersTable } from "./orders";

export const syncStatusEnum = pgEnum("sync_status", ["Pending", "Processed"]);

export const automationEventsTable = pgTable("automation_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => ordersTable.id, { onDelete: "set null" }),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  syncStatus: syncStatusEnum("sync_status").notNull().default("Pending"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export const automationEventsRelations = relations(automationEventsTable, ({ one }) => ({
  order: one(ordersTable, { fields: [automationEventsTable.orderId], references: [ordersTable.id] }),
}));

export const insertAutomationEventSchema = createInsertSchema(automationEventsTable).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});
export type InsertAutomationEvent = z.infer<typeof insertAutomationEventSchema>;
export type AutomationEvent = typeof automationEventsTable.$inferSelect;
