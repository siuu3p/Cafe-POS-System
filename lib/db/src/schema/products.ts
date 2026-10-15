import { createInsertSchema } from "drizzle-zod";
import { boolean, numeric, pgEnum, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const productCategoryEnum = pgEnum("product_category", ["Beverage", "Retail", "Food"]);

export const productsTable = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 160 }).notNull(),
  category: productCategoryEnum("category").notNull(),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  trackInventory: boolean("track_inventory").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
