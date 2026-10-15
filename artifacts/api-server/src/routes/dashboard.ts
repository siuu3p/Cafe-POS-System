import { Router, type IRouter } from "express";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db, employeesTable, ordersTable, customersTable } from "@workspace/db";
import { GetDashboardResponse } from "@workspace/api-zod";
import { requireEmployee } from "../middlewares/pos-auth";
import { hydrateOrders } from "./orders";

const router: IRouter = Router();
router.use(requireEmployee);

router.get("/dashboard", async (_req, res): Promise<void> => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const [summary] = await db
    .select({
      todayOrders: sql<number>`count(*)::int`,
      todaySales: sql<string>`coalesce(sum(${ordersTable.totalAmount}), 0)::numeric`,
    })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.status, "Completed"),
        gte(ordersTable.createdAt, start),
        lt(ordersTable.createdAt, end),
      ),
    );

  const recentRows = await db
    .select({
      id: ordersTable.id,
      employeeId: ordersTable.employeeId,
      employeeName: employeesTable.fullName,
      customerId: ordersTable.customerId,
      customerName: customersTable.name,
      totalAmount: ordersTable.totalAmount,
      paymentMethod: ordersTable.paymentMethod,
      status: ordersTable.status,
      createdAt: ordersTable.createdAt,
    })
    .from(ordersTable)
    .innerJoin(employeesTable, eq(ordersTable.employeeId, employeesTable.id))
    .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .orderBy(desc(ordersTable.createdAt))
    .limit(5);

  const todayOrders = summary?.todayOrders ?? 0;
  const todaySales = Number(summary?.todaySales ?? 0);
  res.json(
    GetDashboardResponse.parse({
      todaySales,
      todayOrders,
      averageOrder: todayOrders ? todaySales / todayOrders : 0,
      recentOrders: await hydrateOrders(recentRows),
    }),
  );
});

export default router;
