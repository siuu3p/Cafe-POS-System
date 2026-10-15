import { Router, type IRouter } from "express";
import { asc, eq, ilike, or } from "drizzle-orm";
import { db, customersTable } from "@workspace/db";
import {
  CreateCustomerBody,
  CreateCustomerResponse,
  ListCustomersQueryParams,
  ListCustomersResponse,
  UpdateCustomerBody,
  UpdateCustomerParams,
  UpdateCustomerResponse,
} from "@workspace/api-zod";
import { requireEmployee } from "../middlewares/pos-auth";

const router: IRouter = Router();
router.use(requireEmployee);

function customerDto(customer: typeof customersTable.$inferSelect) {
  return { ...customer, createdAt: customer.createdAt.toISOString() };
}

router.get("/customers", async (req, res): Promise<void> => {
  const params = ListCustomersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const term = params.data.search?.trim();
  const customers = term
    ? await db
        .select()
        .from(customersTable)
        .where(or(ilike(customersTable.name, `%${term}%`), ilike(customersTable.phoneNumber, `%${term}%`)))
        .orderBy(asc(customersTable.name))
        .limit(100)
    : await db.select().from(customersTable).orderBy(asc(customersTable.name)).limit(100);
  res.json(ListCustomersResponse.parse(customers.map(customerDto)));
});

router.post("/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [customer] = await db
      .insert(customersTable)
      .values({
        name: parsed.data.name.trim(),
        phoneNumber: parsed.data.phoneNumber.trim(),
      })
      .returning();
    res.status(201).json(CreateCustomerResponse.parse(customerDto(customer)));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "That phone number is already attached to a customer." });
      return;
    }
    throw error;
  }
});

router.patch("/customers/:id", async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse(req.params);
  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const values: Partial<typeof customersTable.$inferInsert> = { ...parsed.data };
  if (parsed.data.name !== undefined) values.name = parsed.data.name.trim();
  if (parsed.data.phoneNumber !== undefined) values.phoneNumber = parsed.data.phoneNumber.trim();
  try {
    const [customer] = await db
      .update(customersTable)
      .set(values)
      .where(eq(customersTable.id, params.data.id))
      .returning();
    if (!customer) {
      res.status(404).json({ error: "Customer not found." });
      return;
    }
    res.json(UpdateCustomerResponse.parse(customerDto(customer)));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "That phone number is already attached to a customer." });
      return;
    }
    throw error;
  }
});

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export default router;
