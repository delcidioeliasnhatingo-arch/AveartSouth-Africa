# AVEART deployment readiness audit

Audit date: 2026-10-21

## Current state verified

- `AveartSouth-Africa` is a Vite + React storefront. A Medusa Store API client has been added on the `medusa-integration-prep` branch, but the visible catalogue/cart/checkout flow has not yet been fully switched over or verified end-to-end.
- The root `server.ts` on the base branch is empty, although package scripts start it with `tsx server.ts`. The repository also contains server-only code under `src/server/`.
- `src/server/db.ts` uses Node's `node:sqlite` and a local `data/aveart.db` file. That is not a durable database setup for serverless hosting and is not Neon/PostgreSQL integration.
- `src/server/payment.ts` implements a sandbox payment simulator and uses USD. It is not a production DebitoPay integration and must never be represented as a real payment processor.
- `SHIPPING_SETUP.md` requires a valid ShipLogic token and verified supplier origins and parcel dimensions/weights before live shipping quotes can work.
- `medusa-v2-railway` is a separate Medusa 2.20.1 server + worker template with PostgreSQL, Redis, and a DebitoPay provider module. Its Docker/start configuration is designed for Railway, not a drop-in Vercel deployment.
- The connected Vercel account currently has no projects available to this integration. A Neon project named AVEART exists, with a ready production branch, but its connection string, schema, and application connectivity have not been verified.

## Architecture decision

Do not assume that deploying the whole Medusa backend to Vercel will work by importing the repository. The current Medusa template expects a persistent API/admin server, a worker, PostgreSQL, and Redis-backed coordination. Vercel Functions are not a drop-in replacement for that topology.

Keep the current site unchanged while staging the backend. The storefront can be static only after its browser code calls Medusa's Store API and all required server-only features have moved behind the backend. Never expose database credentials, DebitoPay keys, webhook secrets, JWT secrets, or cookie secrets in `VITE_` variables.

## Required before real orders

1. Create a separate staging backend with PostgreSQL and Redis; verify `/health` and the Medusa Admin at `/app`.
2. Configure strong server-side secrets and exact storefront/admin/auth CORS origins.
3. Create a South Africa region using ZAR, publishable API key, sales channel, and valid catalogue in Medusa.
4. Verify DebitoPay merchant access, ZAR wallet/method availability, webhook signing secret, and sandbox checkout end-to-end.
5. Switch catalogue/cart/checkout to the Medusa client; remove the sandbox payment simulator from any production checkout path.
6. Configure ShipLogic only after real supplier collection addresses and packed parcel dimensions/weights are available for each product.
7. Test failed payments, duplicate webhooks, payment reconciliation, shipping quote expiry, mixed-supplier baskets, and mobile checkout.
8. Verify current provider plans and actual usage stay within the intended US$5/month limit before enabling services. Do not assume this budget supports a full Medusa server/worker deployment.

## Safe release rule

Use feature branches and preview environments. Do not replace the live GitHub Pages site, run production migrations, activate real payments, or publish a production domain until the acceptance tests above pass.
