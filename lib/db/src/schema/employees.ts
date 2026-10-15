import { createInsertSchema } from "drizzle-zod";
import { pgEnum, pgTable, timestamp, uuid, varchar, boolean, text } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const employeeRoleEnum = pgEnum("employee_role", ["Admin", "Barista"]);

export const employeesTable = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 120 }).notNull(),
  role: employeeRoleEnum("role").notNull(),
  posPinHash: text("pos_pin_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;
