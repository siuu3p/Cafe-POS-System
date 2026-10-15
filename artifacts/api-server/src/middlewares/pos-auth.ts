import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db, employeesTable } from "@workspace/db";

export type EmployeeContext = {
  id: string;
  fullName: string;
  role: "Admin" | "Barista";
};

declare global {
  namespace Express {
    interface Request {
      employee?: EmployeeContext;
    }
  }
}

export async function requireEmployee(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const employeeId = req.signedCookies?.pos_session;
  if (typeof employeeId !== "string") {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }

  const [employee] = await db
    .select({
      id: employeesTable.id,
      fullName: employeesTable.fullName,
      role: employeesTable.role,
      isActive: employeesTable.isActive,
    })
    .from(employeesTable)
    .where(eq(employeesTable.id, employeeId))
    .limit(1);

  if (!employee || !employee.isActive) {
    res.clearCookie("pos_session", { path: "/api" });
    res.status(401).json({ error: "Your session is no longer active." });
    return;
  }

  req.employee = {
    id: employee.id,
    fullName: employee.fullName,
    role: employee.role,
  };
  next();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.employee) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  if (req.employee.role !== "Admin") {
    res.status(403).json({ error: "Administrator access is required." });
    return;
  }
  next();
}
