# Café POS

A full-stack café point-of-sale app for staff checkout, customer loyalty records, catalog management, and reliable order-completion webhook delivery.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/cafe-pos run dev` — run the POS web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`
- Optional env: `ORDER_COMPLETED_WEBHOOK_URL` — HTTPS endpoint for order-completion POSTs; pending events remain in PostgreSQL until delivery succeeds

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/cafe-pos` — React POS interface
- `artifacts/api-server` — Express API, staff PIN sessions, orders, and webhook dispatch
- `lib/db/src/schema` — PostgreSQL/Drizzle schema
- `lib/api-spec/openapi.yaml` — API contract source of truth

## Architecture decisions

- Store staff PINs as salted scrypt hashes; use signed, HTTP-only session cookies.
- Create completed orders and their `order.completed` automation event in the same database transaction; deliver the webhook immediately after commit and retry pending events.
- Calculate prices on the server from current product and modifier prices, never from client-supplied totals.

## Product

Staff can sign in with a four-digit PIN, build and complete orders, attach customers and payment methods, and review/refund orders. Administrators can manage employees, the product catalog, modifiers, and webhook delivery.

## User preferences

- Keep the interface polished and minimalist; build the layout, palette, and components natively, without external image uploads. A simple Canva logo may be added later.

## Gotchas

- First use requires creating the initial administrator in the app.
- Set `ORDER_COMPLETED_WEBHOOK_URL` through Replit Secrets to enable n8n/Zapier or another HTTPS webhook. Events are stored even when delivery is unavailable.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
