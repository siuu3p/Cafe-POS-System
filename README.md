# Café POS

A full-stack point-of-sale app for small cafés: staff checkout, customer loyalty records, catalog management, a daily sales dashboard, and an order-completed webhook that connects the POS to automation tools like n8n or Zapier.

**Live demo:** [cafe-pos-7xli.onrender.com](https://cafe-pos-7xli.onrender.com/) (hosted on Render's free tier, so the first load can take up to a minute)

> Built by Dennis Dionisio with AI assistance in Replit. I planned the features, directed the build, worked on it locally, and tested and deployed the app.

<!-- Add 3-4 screenshots here: checkout screen, order history, catalog admin, dashboard -->
<!-- ![Checkout screen](docs/screenshots/checkout.png) -->

## What it does

**For staff**
- Sign in with a four-digit PIN
- Build orders from the product catalog, including modifiers (size, add-ons)
- Attach a customer and payment method, then complete the order
- Look up past orders and issue refunds

**For administrators**
- Manage employees and their PINs
- Manage the product catalog and modifiers
- See today's order count and sales on the dashboard
- Monitor webhook delivery for completed orders

**For customers**
- Customer records by phone number, with a loyalty points balance

## Automation: order-completed webhook

When an order is completed, the app sends an `order.completed` event to the HTTPS address in `ORDER_COMPLETED_WEBHOOK_URL`, for example an n8n or Zapier webhook. From there you can log sales to Google Sheets, notify the team in Slack, or send a receipt.

- The order and its event are saved in the same database transaction, so no completed order is missed
- If the webhook is down, the event stays in the database and is retried later with increasing wait times

## How it's built

| Part | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| API | Node.js, Express 5 |
| Database | PostgreSQL with Drizzle ORM |
| Validation | Zod, generated from an OpenAPI spec (Orval) |
| Workspace | pnpm monorepo |

**Security and data choices**
- Staff PINs are stored as salted scrypt hashes, never as plain text
- Sessions use signed, HTTP-only cookies
- Prices are calculated on the server from the current catalog, never taken from the browser

## Project structure

| Folder | Purpose |
|---|---|
| `artifacts/cafe-pos/` | POS web app (React) |
| `artifacts/api-server/` | Express API, staff sessions, orders, webhook delivery |
| `lib/db/src/schema/` | Database tables |
| `lib/api-spec/openapi.yaml` | API contract |

## Run it locally

Requirements: Node.js 22+, pnpm, and a PostgreSQL database.

```bash
pnpm install
cp .env.example .env        # then set DATABASE_URL and SESSION_SECRET
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/cafe-pos run dev
```

On first use, the app asks you to create the first administrator account.

## Deploy

The API server also serves the built web app, so one service and one PostgreSQL database cover everything. See [DEPLOY.md](DEPLOY.md) for step-by-step instructions using Render and a free Neon or Supabase database.

## Contact

Dennis Dionisio · [LinkedIn](https://www.linkedin.com/in/dldionisio) · dldionisio03@gmail.com
