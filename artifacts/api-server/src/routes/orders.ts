import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import {
  automationEventsTable,
  customersTable,
  db,
  employeesTable,
  modifiersTable,
  orderItemModifiersTable,
  orderItemsTable,
  ordersTable,
  productsTable,
} from "@workspace/db";
import {
  CreateOrderBody,
  CreateOrderResponse,
  ListOrdersQueryParams,
  ListOrdersResponse,
  RefundOrderParams,
  RefundOrderResponse,
} from "@workspace/api-zod";
import { requireEmployee } from "../middlewares/pos-auth";
import { dispatchWebhookEvent } from "../lib/webhooks";

const router: IRouter = Router();
router.use(requireEmployee);

export type OrderRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  customerId: string | null;
  customerName: string | null;
  totalAmount: string;
  paymentMethod: "Cash" | "Card" | "E-Wallet";
  status: "Completed" | "Refunded";
  createdAt: Date;
};

export async function hydrateOrders(rows: OrderRow[]) {
  if (rows.length === 0) return [];
  const orderIds = rows.map((row) => row.id);
  const lines = await db
    .select({
      id: orderItemsTable.id,
      orderId: orderItemsTable.orderId,
      productId: orderItemsTable.productId,
      productName: productsTable.name,
      quantity: orderItemsTable.quantity,
      unitPrice: orderItemsTable.unitPrice,
      subtotal: orderItemsTable.subtotal,
      baristaNotes: orderItemsTable.baristaNotes,
    })
    .from(orderItemsTable)
    .innerJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .where(inArray(orderItemsTable.orderId, orderIds));

  const lineIds = lines.map((line) => line.id);
  const modifierLinks = lineIds.length
    ? await db
        .select({
          orderItemId: orderItemModifiersTable.orderItemId,
          id: modifiersTable.id,
          name: modifiersTable.name,
          additionalCost: modifiersTable.additionalCost,
        })
        .from(orderItemModifiersTable)
        .innerJoin(modifiersTable, eq(orderItemModifiersTable.modifierId, modifiersTable.id))
        .where(inArray(orderItemModifiersTable.orderItemId, lineIds))
    : [];

  const modifierMap = new Map<string, typeof modifierLinks>();
  for (const modifier of modifierLinks) {
    const existing = modifierMap.get(modifier.orderItemId) ?? [];
    existing.push(modifier);
    modifierMap.set(modifier.orderItemId, existing);
  }

  const linesByOrder = new Map<string, typeof lines>();
  for (const line of lines) {
    const existing = linesByOrder.get(line.orderId) ?? [];
    existing.push(line);
    linesByOrder.set(line.orderId, existing);
  }

  return rows.map((row) => ({
    id: row.id,
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    customerId: row.customerId,
    customerName: row.customerName,
    totalAmount: Number(row.totalAmount),
    paymentMethod: row.paymentMethod,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    items: (linesByOrder.get(row.id) ?? []).map((line) => ({
      id: line.id,
      productId: line.productId,
      productName: line.productName,
      quantity: line.quantity,
      unitPrice: Number(line.unitPrice),
      subtotal: Number(line.subtotal),
      baristaNotes: line.baristaNotes,
      modifiers: (modifierMap.get(line.id) ?? []).map((modifier) => ({
        id: modifier.id,
        name: modifier.name,
        additionalCost: Number(modifier.additionalCost),
      })),
    })),
  }));
}

async function loadOrder(id: string) {
  const rows = await db
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
    .where(eq(ordersTable.id, id))
    .limit(1);
  return (await hydrateOrders(rows))[0];
}

router.get("/orders", async (req, res): Promise<void> => {
  const params = ListOrdersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const conditions = [];
  if (params.data.status) conditions.push(eq(ordersTable.status, params.data.status));
  const search = params.data.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(employeesTable.fullName, pattern),
        ilike(customersTable.name, pattern),
        sql`cast(${ordersTable.id} as text) ilike ${pattern}`,
      )!,
    );
  }
  const query = db
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
    .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id));
  const rows = conditions.length
    ? await query.where(and(...conditions)).orderBy(desc(ordersTable.createdAt)).limit(params.data.limit ?? 50)
    : await query.orderBy(desc(ordersTable.createdAt)).limit(params.data.limit ?? 50);
  res.json(ListOrdersResponse.parse(await hydrateOrders(rows)));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.items.some((item) => item.quantity > 99)) {
    res.status(400).json({ error: "An order line cannot exceed 99 units." });
    return;
  }
  if (parsed.data.items.some((item) => new Set(item.modifierIds).size !== item.modifierIds.length)) {
    res.status(400).json({ error: "Duplicate modifiers are not allowed on the same item." });
    return;
  }

  const productIds = [...new Set(parsed.data.items.map((item) => item.productId))];
  const modifierIds = [...new Set(parsed.data.items.flatMap((item) => item.modifierIds))];
  const products = await db.select().from(productsTable).where(inArray(productsTable.id, productIds));
  const modifiers = modifierIds.length
    ? await db.select().from(modifiersTable).where(inArray(modifiersTable.id, modifierIds))
    : [];
  const productMap = new Map(products.map((product) => [product.id, product]));
  const modifierMap = new Map(modifiers.map((modifier) => [modifier.id, modifier]));

  for (const item of parsed.data.items) {
    const product = productMap.get(item.productId);
    if (!product || !product.isActive) {
      res.status(400).json({ error: "One or more products are no longer available." });
      return;
    }
    if (item.modifierIds.some((id) => !modifierMap.get(id)?.isActive)) {
      res.status(400).json({ error: "One or more modifiers are no longer available." });
      return;
    }
  }

  let customer: typeof customersTable.$inferSelect | undefined;
  if (parsed.data.customerId) {
    [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, parsed.data.customerId))
      .limit(1);
    if (!customer) {
      res.status(400).json({ error: "The selected customer no longer exists." });
      return;
    }
  }

  const pricedItems = parsed.data.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const itemModifiers = item.modifierIds.map((id) => modifierMap.get(id)!);
    const unitCents =
      Math.round(Number(product.basePrice) * 100) +
      itemModifiers.reduce((sum, modifier) => sum + Math.round(Number(modifier.additionalCost) * 100), 0);
    return {
      ...item,
      product,
      modifiers: itemModifiers,
      unitCents,
      subtotalCents: unitCents * item.quantity,
    };
  });
  const totalCents = pricedItems.reduce((sum, item) => sum + item.subtotalCents, 0);
  const money = (cents: number) => (cents / 100).toFixed(2);
  const now = new Date();
  const employee = req.employee!;

  const { eventId, orderId } = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(ordersTable)
      .values({
        employeeId: employee.id,
        customerId: parsed.data.customerId ?? null,
        totalAmount: money(totalCents),
        paymentMethod: parsed.data.paymentMethod,
        status: "Completed",
        createdAt: now,
      })
      .returning();

    const orderLines: (typeof orderItemsTable.$inferSelect)[] = [];
    for (const item of pricedItems) {
      const [line] = await tx
        .insert(orderItemsTable)
        .values({
          orderId: order.id,
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: money(item.unitCents),
          subtotal: money(item.subtotalCents),
          baristaNotes: item.baristaNotes?.trim() ?? "",
        })
        .returning();
      orderLines.push(line);
      if (item.modifiers.length) {
        await tx.insert(orderItemModifiersTable).values(
          item.modifiers.map((modifier) => ({
            orderItemId: line.id,
            modifierId: modifier.id,
          })),
        );
      }
    }

    const payload = {
      event: "order.completed",
      occurredAt: now.toISOString(),
      order: {
        id: order.id,
        employee: { id: employee.id, name: employee.fullName },
        customer: customer
          ? { id: customer.id, name: customer.name, phoneNumber: customer.phoneNumber }
          : null,
        totalAmount: Number(money(totalCents)),
        paymentMethod: order.paymentMethod,
        status: order.status,
        createdAt: now.toISOString(),
        items: pricedItems.map((item, index) => ({
          id: orderLines[index]!.id,
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(money(item.unitCents)),
          subtotal: Number(money(item.subtotalCents)),
          baristaNotes: item.baristaNotes?.trim() ?? "",
          modifiers: item.modifiers.map((modifier) => ({
            id: modifier.id,
            name: modifier.name,
            additionalCost: Number(modifier.additionalCost),
          })),
        })),
      },
    };
    const [event] = await tx
      .insert(automationEventsTable)
      .values({
        orderId: order.id,
        eventType: "order.completed",
        payload,
        syncStatus: "Pending",
      })
      .returning({ id: automationEventsTable.id });
    return { eventId: event.id, orderId: order.id };
  });

  await dispatchWebhookEvent(eventId);
  const completedOrder = await loadOrder(orderId);
  if (!completedOrder) {
    res.status(500).json({ error: "The order was saved but could not be loaded." });
    return;
  }
  res.status(201).json(CreateOrderResponse.parse(completedOrder));
});

router.post("/orders/:id/refund", async (req, res): Promise<void> => {
  const params = RefundOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id))
    .limit(1);
  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  if (order.status === "Refunded") {
    res.status(409).json({ error: "This order has already been refunded." });
    return;
  }
  await db
    .update(ordersTable)
    .set({ status: "Refunded" })
    .where(eq(ordersTable.id, order.id));
  const updated = await loadOrder(order.id);
  res.json(RefundOrderResponse.parse(updated));
});

export default router;
