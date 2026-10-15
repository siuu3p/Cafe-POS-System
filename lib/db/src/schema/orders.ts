import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { employeesTable } from "./employees";
import { modifiersTable } from "./modifiers";
import { productsTable } from "./products";

export const paymentMethodEnum = pgEnum("payment_method", ["Cash", "Card", "E-Wallet"]);
export const orderStatusEnum = pgEnum("order_status", ["Completed", "Refunded"]);

export const ordersTable = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").notNull().references(() => employeesTable.id),
  customerId: uuid("customer_id").references(() => customersTable.id, { onDelete: "set null" }),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: orderStatusEnum("status").notNull().default("Completed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => productsTable.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  baristaNotes: text("barista_notes").notNull().default(""),
});

export const orderItemModifiersTable = pgTable(
  "order_item_modifiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItemsTable.id, { onDelete: "cascade" }),
    modifierId: uuid("modifier_id").notNull().references(() => modifiersTable.id),
  },
  (table) => [uniqueIndex("order_item_modifiers_item_modifier_unique").on(table.orderItemId, table.modifierId)],
);

export const ordersRelations = relations(ordersTable, ({ one, many }) => ({
  employee: one(employeesTable, { fields: [ordersTable.employeeId], references: [employeesTable.id] }),
  customer: one(customersTable, { fields: [ordersTable.customerId], references: [customersTable.id] }),
  items: many(orderItemsTable),
}));
export const orderItemsRelations = relations(orderItemsTable, ({ one, many }) => ({
  order: one(ordersTable, { fields: [orderItemsTable.orderId], references: [ordersTable.id] }),
  product: one(productsTable, { fields: [orderItemsTable.productId], references: [productsTable.id] }),
  modifiers: many(orderItemModifiersTable),
}));

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
