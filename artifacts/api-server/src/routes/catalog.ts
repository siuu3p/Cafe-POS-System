import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, modifiersTable, productsTable } from "@workspace/db";
import {
  CreateModifierBody,
  CreateModifierResponse,
  CreateProductBody,
  CreateProductResponse,
  ListModifiersQueryParams,
  ListModifiersResponse,
  ListProductsQueryParams,
  ListProductsResponse,
  UpdateModifierBody,
  UpdateModifierParams,
  UpdateModifierResponse,
  UpdateProductBody,
  UpdateProductParams,
  UpdateProductResponse,
} from "@workspace/api-zod";
import { requireAdmin, requireEmployee } from "../middlewares/pos-auth";

const router: IRouter = Router();
router.use(requireEmployee);

function productDto(product: typeof productsTable.$inferSelect) {
  return {
    ...product,
    basePrice: Number(product.basePrice),
  };
}

function modifierDto(modifier: typeof modifiersTable.$inferSelect) {
  return {
    ...modifier,
    additionalCost: Number(modifier.additionalCost),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const conditions = [];
  if (params.data.category) conditions.push(eq(productsTable.category, params.data.category));
  if (!params.data.includeInactive) conditions.push(eq(productsTable.isActive, true));
  const products = conditions.length
    ? await db.select().from(productsTable).where(and(...conditions)).orderBy(asc(productsTable.name))
    : await db.select().from(productsTable).orderBy(asc(productsTable.name));
  res.json(ListProductsResponse.parse(products.map(productDto)));
});

router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db
    .insert(productsTable)
    .values({ ...parsed.data, name: parsed.data.name.trim(), basePrice: parsed.data.basePrice.toFixed(2) })
    .returning();
  res.status(201).json(CreateProductResponse.parse(productDto(product)));
});

router.patch("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const values: Partial<typeof productsTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) values.name = parsed.data.name.trim();
  if (parsed.data.category !== undefined) values.category = parsed.data.category;
  if (parsed.data.basePrice !== undefined) values.basePrice = parsed.data.basePrice.toFixed(2);
  if (parsed.data.trackInventory !== undefined) values.trackInventory = parsed.data.trackInventory;
  if (parsed.data.isActive !== undefined) values.isActive = parsed.data.isActive;
  const [product] = await db
    .update(productsTable)
    .set(values)
    .where(eq(productsTable.id, params.data.id))
    .returning();
  if (!product) {
    res.status(404).json({ error: "Product not found." });
    return;
  }
  res.json(UpdateProductResponse.parse(productDto(product)));
});

router.get("/modifiers", async (req, res): Promise<void> => {
  const params = ListModifiersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const modifiers = params.data.includeInactive
    ? await db.select().from(modifiersTable).orderBy(asc(modifiersTable.name))
    : await db.select().from(modifiersTable).where(eq(modifiersTable.isActive, true)).orderBy(asc(modifiersTable.name));
  res.json(ListModifiersResponse.parse(modifiers.map(modifierDto)));
});

router.post("/modifiers", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateModifierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [modifier] = await db
    .insert(modifiersTable)
    .values({ ...parsed.data, name: parsed.data.name.trim(), additionalCost: parsed.data.additionalCost.toFixed(2) })
    .returning();
  res.status(201).json(CreateModifierResponse.parse(modifierDto(modifier)));
});

router.patch("/modifiers/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateModifierParams.safeParse(req.params);
  const parsed = UpdateModifierBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const values: Partial<typeof modifiersTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) values.name = parsed.data.name.trim();
  if (parsed.data.additionalCost !== undefined) values.additionalCost = parsed.data.additionalCost.toFixed(2);
  if (parsed.data.isActive !== undefined) values.isActive = parsed.data.isActive;
  const [modifier] = await db
    .update(modifiersTable)
    .set(values)
    .where(eq(modifiersTable.id, params.data.id))
    .returning();
  if (!modifier) {
    res.status(404).json({ error: "Modifier not found." });
    return;
  }
  res.json(UpdateModifierResponse.parse(modifierDto(modifier)));
});

export default router;
