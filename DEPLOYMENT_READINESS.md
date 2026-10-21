# AVEART deployment readiness audit

Audit date: 2026-10-21

## Current repository roles

- `AveartSouth-Africa` is a Vite + React storefront project. Its build command is `vite build`.
- The package scripts also start `tsx server.ts`, but the root `server.ts` currently has no content. The app also contains server-only code under `src/server/`.
- `src/server/db.ts` uses Node's `node:sqlite` and a local `data/aveart.db` file. This is not a durable database setup for a serverless deployment and is not Neon/PostgreSQL integration.
- `src/server/payment.ts` implements a sandbox payment simulator and uses USD. It is not a production DebitoPay integration and must never be represented as a real payment processor.
- `SHIPPING_SETUP.md` correctly requires a real ShipLogic token and verified supplier collection addresses and parcel measurements before live quotes can work.
- `medusa-v2-railway` is a separate Medusa 2.20.1 server + worker template with PostgreSQL, Redis, and a DebitoPay provider module. Its current Docker/start configuration is designed for Railway, not a drop-in Vercel deployment.
- The connected Vercel account currently has no projects available to this integration. A Neon project named AVEART exists, but this audit does not verify its connection string, schema, or application connectivity.

## Important architecture decision

Do not point the existing Vite app at a Vercel deployment and assume the whole commerce system is ready. A production Medusa deployment normally needs a persistent Node server, a worker, PostgreSQL, and Redis-backed coordination. Vercel Functions are not a drop-in replacement for the full server/worker topology.

Keep the current storefront unchanged while a preview environment is built. The next safe architecture step is to decide whether the existing frontend will become a static storefront that calls Medusa's Store API, or whether its Express/server features will be migrated to a separate supported runtime. Do not expose provider keys or database credentials in the browser.

## Required before real orders

1. Create a separate backend staging deployment with PostgreSQL and Redis; verify `/health` and the Medusa Admin at `/app`.
2. Configure strong, unique server-side secrets and exact CORS origins.
3. Configure a Medusa region and publishable API key for the South African storefront.
4. Verify DebitoPay merchant access, ZAR wallet/method availability, webhook signing secret, and sandbox checkout end-to-end.
5. Replace the frontend's sandbox payment flow and SQLite-backed order data with the verified backend APIs; do not collect or store card details in the storefront.
6. Configure ShipLogic only after real supplier origin addresses and packed parcel dimensions/weights are available for each product.
7. Test failed payments, duplicate webhooks, order status reconciliation, shipping quote expiry, mixed-supplier baskets, and mobile checkout.
8. Confirm all service costs remain within the intended US$5/month limit before enabling production services. Do not assume this budget can support the full Medusa server/worker architecture without verifying current plans and usage.

## Safe deployment rule

Use feature branches and preview deployments first. Do not replace the live GitHub Pages site, run production database migrations, activate real payments, or publish a production domain until the acceptance tests above pass.
