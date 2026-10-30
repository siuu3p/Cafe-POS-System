# Deploying Café POS outside Replit

The API server also serves the built web app, so one service and one URL cover everything. The only other piece is a PostgreSQL database.

Tested here: install, schema push, production build, and a smoke test (health check, web app, SPA routes, first-admin setup, product, order, dashboard) on Node 22 with PostgreSQL 16. Not tested here: the Render and Neon dashboards themselves. Their screens and free-tier limits change, so check their current docs.

## 1. Create a database

Any PostgreSQL works. Neon and Supabase both have free tiers. Copy the connection string. Most hosted databases need SSL, so it usually ends in `?sslmode=require`.

## 2. Create the tables (once, from your own computer)

```bash
pnpm install
DATABASE_URL="<your connection string>" pnpm db:push
```

## 3. Deploy the web service

On Render, create a new Blueprint from this repo. It reads `render.yaml`. Then set these in the dashboard:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your connection string from step 1 |
| `SESSION_SECRET` | Generated automatically by the blueprint |
| `ORDER_COMPLETED_WEBHOOK_URL` | Optional, an HTTPS endpoint such as n8n |

Other hosts work the same way. Use these commands:

- Build: `pnpm install --frozen-lockfile --prod=false && pnpm run build:deploy`
- Start: `pnpm start`
- Health check: `/api/healthz`

## 4. Create your admin right away

**Do this the moment the service is live.** Until the first administrator exists, `/auth/setup` is open to anyone who finds the URL, and whoever submits it first becomes admin. Open the site and create your admin account before sharing the link.

## Running locally

```bash
cp .env.example .env        # fill in DATABASE_URL and SESSION_SECRET
set -a; . ./.env; set +a    # load the variables into your shell
pnpm install
pnpm db:push
pnpm run build:deploy
pnpm start
```

Open http://localhost:8080 (or the `PORT` you set).

## Notes on free hosting

- Free web services on some hosts sleep after a period of no traffic, so the first visit can take around a minute to load. Check your host's current terms.
- Keep screenshots or a short demo video in the README so the project still shows well while the service is asleep.
- Free databases may pause, expire or have storage caps. Check before you rely on one.
