# AVEART storefront → Medusa integration

The current React/Vite storefront still calls same-origin routes such as `/api/products`, `/api/categories`, `/api/orders`, `/api/payments/charge`, and `/api/shipping/quote`. The root `server.ts` is empty, so those routes are not a production integration by themselves. The separate `src/server/*` modules contain legacy SQLite/demo logic and must not be treated as the Medusa production database or payment authority.

This branch adds `src/lib/medusa.ts`, a typed browser client and mapping layer for the Medusa Store API. Catalogue listing, product detail, and cart add/update/remove now use Medusa when the public settings are configured. Until then, the existing same-origin API remains the fallback. The real backend URL, publishable key, region and catalogue are not yet confirmed, so this code has passed CI but is not yet verified end-to-end against a live Medusa service.

## Public Vite settings

Set these in the frontend host's environment settings (they are public browser values, not secrets):

- `VITE_MEDUSA_BACKEND_URL`: deployed Medusa server origin, with no trailing slash.
- `VITE_MEDUSA_PUBLISHABLE_KEY`: publishable key created in Medusa Admin and linked to the AVEART sales channel.
- `VITE_MEDUSA_REGION_ID`: required for catalogue prices and cart creation; use the Medusa region configured for South Africa and ZAR.
- `VITE_MEDUSA_SALES_CHANNEL_ID`: AVEART sales channel ID, if explicitly configured.

Do **not** use frontend variables for `DATABASE_URL`, `REDIS_URL`, `DEBITOPAY_API_KEY`, `DEBITOPAY_WEBHOOK_SECRET`, `JWT_SECRET`, or `COOKIE_SECRET`.

## Client operations

- `listMedusaProducts` / `listMedusaCategories`: catalogue data from Medusa Store API.
- `createMedusaCart`: starts a Medusa cart for the configured region.
- `addMedusaLineItem`, `updateMedusaLineItem`, `removeMedusaLineItem`: cart line-item operations.
- `initiateMedusaPaymentSession`: requests a session from the payment provider configured in Medusa.
- `completeMedusaCart`: submits the cart to Medusa's checkout completion endpoint.

## Remaining Phase 1 work (payments/shipping deferred)

1. Deploy Medusa API + worker on a compatible persistent container runtime with PostgreSQL and Redis; Vercel's frontend preview is not a backend deployment.
2. Use a separate staging database/branch, apply Medusa migrations, and configure exact Store/Admin/Auth CORS origins plus strong server-side secrets.
3. Configure the South Africa/ZAR region, AVEART sales channel, product variants, prices, inventory and publishable API key. A guarded staging seed is being prepared in the Medusa repository's `aveart/za-zar-staging-seed` branch.
4. Set the four public frontend variables and verify product listing/detail and cart add/update/remove against the real staging API, including inventory failures and refresh behavior.
5. Run the latest GitHub Actions type-check/build and a browser-level staging test before merging.

## Explicitly deferred

Do not wire checkout completion, payment sessions, DebitoPay, shipping rates, suppliers or fulfilment until Phase 1 is stable and the user asks to begin that phase. Never mark an order paid from a browser redirect.
