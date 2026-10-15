import { Router, type IRouter } from "express";
import type { Response } from "express";
import { eq, sql } from "drizzle-orm";
import {
  db,
  employeesTable,
} from "@workspace/db";
import {
  GetCurrentSessionResponse,
  GetSetupStatusResponse,
  GetStaffOptionsResponse,
  LoginEmployeeBody,
  LoginEmployeeResponse,
  LogoutEmployeeResponse,
  SetupAdministratorBody,
  SetupAdministratorResponse,
} from "@workspace/api-zod";
import { requireEmployee } from "../middlewares/pos-auth";
import { hashPin, verifyPin } from "../lib/pin";

const router: IRouter = Router();
const COOKIE_NAME = "pos_session";
const COOKIE_PATH = "/api";
const SESSION_MAX_AGE = 12 * 60 * 60 * 1000;

function setSession(res: Response, id: string): void {
  res.cookie(COOKIE_NAME, id, {
    signed: true,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    maxAge: SESSION_MAX_AGE,
    path: COOKIE_PATH,
  });
}

router.get("/auth/setup-status", async (_req, res): Promise<void> => {
  const [firstEmployee] = await db
    .select({ id: employeesTable.id })
    .from(employeesTable)
    .limit(1);
  res.json(GetSetupStatusResponse.parse({ needsSetup: !firstEmployee }));
});

router.get("/auth/staff", async (_req, res): Promise<void> => {
  const staff = await db
    .select({ id: employeesTable.id, fullName: employeesTable.fullName })
    .from(employeesTable)
    .where(eq(employeesTable.isActive, true))
    .orderBy(employeesTable.fullName);
  res.json(GetStaffOptionsResponse.parse(staff));
});

router.post("/auth/setup", async (req, res): Promise<void> => {
  const parsed = SetupAdministratorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const created = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(4773103301)`);
    const [existing] = await tx
      .select({ id: employeesTable.id })
      .from(employeesTable)
      .limit(1);
    if (existing) return null;
    const [employee] = await tx
      .insert(employeesTable)
      .values({
        fullName: parsed.data.fullName.trim(),
        role: "Admin",
        posPinHash: hashPin(parsed.data.posPin),
      })
      .returning();
    return employee;
  });

  if (!created) {
    res.status(409).json({ error: "Initial administrator setup is already complete." });
    return;
  }

  setSession(res, created.id);
  res.status(201).json(
    SetupAdministratorResponse.parse({
      id: created.id,
      fullName: created.fullName,
      role: created.role,
    }),
  );
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [employee] = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.id, parsed.data.employeeId))
    .limit(1);

  if (
    !employee ||
    !employee.isActive ||
    !verifyPin(parsed.data.posPin, employee.posPinHash)
  ) {
    res.status(401).json({ error: "The employee or PIN is incorrect." });
    return;
  }

  setSession(res, employee.id);
  res.json(
    LoginEmployeeResponse.parse({
      id: employee.id,
      fullName: employee.fullName,
      role: employee.role,
    }),
  );
});

router.get("/auth/me", requireEmployee, (req, res): void => {
  res.json(
    GetCurrentSessionResponse.parse({
      id: req.employee!.id,
      fullName: req.employee!.fullName,
      role: req.employee!.role,
    }),
  );
});

router.post("/auth/logout", (_req, res): void => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: COOKIE_PATH,
  });
  res.json(LogoutEmployeeResponse.parse({ success: true }));
});

export default router;
