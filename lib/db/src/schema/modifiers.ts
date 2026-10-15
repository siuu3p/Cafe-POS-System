import { createInsertSchema } from "drizzle-zod";
import { boolean, numeric, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const modifiersTable = pgTable("modifiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  additionalCost: numeric("additional_cost", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertModifierSchema = createInsertSchema(modifiersTable).omit({ id: true });
export type InsertModifier = z.infer<typeof insertModifierSchema>;
export type Modifier = typeof modifiersTable.$inferSelect;
