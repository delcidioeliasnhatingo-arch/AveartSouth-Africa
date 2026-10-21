# AVEART implementation roadmap

Updated: 2026-10-21

## Phase 1 — storefront and backend foundation (current priority)

Goal: make the existing AVEART storefront work against Medusa in a preview/staging environment, without live payment or shipping integrations.

- [x] Inspect the existing storefront and Medusa repository.
- [x] Add a typed client for Medusa Store API operations.
- [x] Add automated storefront type-check and production build CI.
- [x] Document current architecture risks and deployment gates.
- [ ] Select and validate a persistent runtime for Medusa API + worker.
- [ ] Verify PostgreSQL connectivity from Medusa to Neon.
- [ ] Configure Redis for Medusa's required background/cache/event workloads.
- [ ] Set server-side environment variables and secure CORS origins.
- [ ] Configure the Medusa admin, sales channel, South Africa region and ZAR currency.
- [ ] Seed a small test catalogue with products, variants, inventory and ZAR prices.
- [x] Wire visible AVEART product listing and product details to Medusa Store API when the public Medusa settings are configured (end-to-end runtime test still pending).
- [x] Wire cart add/update/remove to Medusa Store API and persist the Medusa cart ID in browser storage (runtime/inventory verification still pending).
- [ ] Verify loading, empty, error, mobile and refresh states against a live staging backend.
- [ ] Confirm preview URL and automated CI are green; do not change the production site yet.

## Latest implementation status

- The storefront now uses the Medusa catalogue/category API for listing and product detail only when `VITE_MEDUSA_BACKEND_URL` and `VITE_MEDUSA_PUBLISHABLE_KEY` are set; otherwise it retains the existing legacy API path.
- Cart add/update/remove now attempts to sync with Medusa when configured. The drawer shows an error if a sync fails.
- GitHub Actions type-check and production build passed on the commit that added cart synchronization. A later run for the cart-drawer warning is queued/in progress and must be checked before treating the latest branch as green.
- This is not yet an end-to-end live integration: the backend URL, publishable key, South Africa/ZAR region, sales channel, catalogue, inventory and Redis/runtime are not verified. No credentials or product data have been fabricated.

## Phase 2 — checkout, payments and order lifecycle (deferred by user)

Do not start until Phase 1 is stable and explicitly requested.

- DebitoPay sandbox/provider setup and webhook verification.
- Checkout completion, order status reconciliation, refunds and failure handling.
- ZAR payment-method availability and production credentials.

## Phase 3 — suppliers and fulfilment (deferred by user)

Do not start until Phase 1 is stable and explicitly requested.

- Choose and verify dropshipping suppliers.
- Catalogue/price/stock sync strategy.
- Supplier dispatch locations, parcel dimensions, shipping API and returns policy.

## Phase 4 — launch readiness (later)

- End-to-end tests for all approved flows.
- Security review, monitoring, domain/HTTPS and backups.
- Verify current service prices against the target budget of US$5/month.
- Production release only after explicit approval.

## Safety and constraints

- Keep the current `main` branch and live storefront unchanged until preview acceptance.
- Never commit secrets or expose database/payment credentials as `VITE_` variables.
- Do not process real payments in Phase 1.
- A successful frontend build does not prove the Medusa backend, database, Redis, or checkout are working.
- The current Vercel preview deployment confirms the frontend can be previewed; it does not mean the Medusa server/worker has been deployed there.
- Do not assume the entire Medusa server/worker topology fits Vercel Functions or the US$5/month target without verifying runtime compatibility and actual service costs.
