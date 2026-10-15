import { Router, type IRouter } from "express";
import { and, eq, ne } from "drizzle-orm";
import { db, employeesTable } from "@workspace/db";
import {
  CreateEmployeeBody,
  CreateEmployeeResponse,
  ListEmployeesResponse,
  UpdateEmployeeBody,
  UpdateEmployeeParams,
  UpdateEmployeeResponse,
} from "@workspace/api-zod";
import { requireAdmin, requireEmployee } from "../middlewares/pos-auth";
import { hashPin } from "../lib/pin";

const router: IRouter = Router();
router.use(requireEmployee, requireAdmin);

function employeeDto(employee: typeof employeesTable.$inferSelect) {
  return {
    id: employee.id,
    fullName: employee.fullName,
    role: employee.role,
    isActive: employee.isActive,
    createdAt: employee.createdAt.toISOString(),
  };
}

router.get("/employees", async (_req, res): Promise<void> => {
  const employees = await db
    .select()
    .from(employeesTable)
    .orderBy(employeesTable.fullName);
  res.json(ListEmployeesResponse.parse(employees.map(employeeDto)));
});

router.post("/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [employee] = await db
    .insert(employeesTable)
    .values({
      fullName: parsed.data.fullName.trim(),
      role: parsed.data.role,
      posPinHash: hashPin(parsed.data.posPin),
    })
    .returning();

  res.status(201).json(CreateEmployeeResponse.parse(employeeDto(employee)));
});

router.patch("/employees/:id", async (req, res): Promise<void> => {
  const params = UpdateEmployeeParams.safeParse(req.params);
  const parsed = UpdateEmployeeBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [target] = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.id, params.data.id))
    .limit(1);
  if (!target) {
    res.status(404).json({ error: "Employee not found." });
    return;
  }

  const isRemovingActiveAdmin =
    target.role === "Admin" &&
    target.isActive &&
    ((parsed.data.role && parsed.data.role !== "Admin") || parsed.data.isActive === false);
  if (isRemovingActiveAdmin) {
    const [otherAdmin] = await db
      .select({ id: employeesTable.id })
      .from(employeesTable)
      .where(and(eq(employeesTable.role, "Admin"), eq(employeesTable.isActive, true), ne(employeesTable.id, target.id)))
      .limit(1);
    if (!otherAdmin) {
      res.status(409).json({ error: "Keep at least one active administrator." });
      return;
    }
  }

  const values: Partial<typeof employeesTable.$inferInsert> = {};
  if (parsed.data.fullName !== undefined) values.fullName = parsed.data.fullName.trim();
  if (parsed.data.role !== undefined) values.role = parsed.data.role;
  if (parsed.data.isActive !== undefined) values.isActive = parsed.data.isActive;
  if (parsed.data.posPin !== undefined) values.posPinHash = hashPin(parsed.data.posPin);

  const [updated] = await db
    .update(employeesTable)
    .set(values)
    .where(eq(employeesTable.id, target.id))
    .returning();

  res.json(UpdateEmployeeResponse.parse(employeeDto(updated)));
});

export default router;
