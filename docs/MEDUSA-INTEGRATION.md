# AVEART storefront → Medusa integration

The current React/Vite storefront still calls same-origin routes such as `/api/products`, `/api/categories`, `/api/orders`, `/api/payments/charge`, and `/api/shipping/quote`. The root `server.ts` is empty, so those routes are not a production integration by themselves. The separate `src/server/*` modules contain legacy SQLite/demo logic and must not be treated as the Medusa production database or payment authority.

This branch adds `src/lib/medusa.ts`, a typed browser client for the Medusa Store API. It is a foundation only: existing screens have not yet been switched over, because the backend URL, publishable key, region and live Medusa catalogue are not yet confirmed.

## Public Vite settings

Set these in the frontend host's environment settings (they are public browser values, not secrets):

- `VITE_MEDUSA_BACKEND_URL`: deployed Medusa server origin, with no trailing slash.
- `VITE_MEDUSA_PUBLISHABLE_KEY`: publishable key created in Medusa Admin and linked to the AVEART sales channel.
- `VITE_MEDUSA_REGION_ID`: the Medusa region configured for South Africa and ZAR.
- `VITE_MEDUSA_SALES_CHANNEL_ID`: AVEART sales channel ID, if explicitly configured.

Do **not** use frontend variables for `DATABASE_URL`, `REDIS_URL`, `DEBITOPAY_API_KEY`, `DEBITOPAY_WEBHOOK_SECRET`, `JWT_SECRET`, or `COOKIE_SECRET`.

## Client operations

- `listMedusaProducts` / `listMedusaCategories`: catalogue data from Medusa Store API.
- `createMedusaCart`: starts a Medusa cart for the configured region.
- `addMedusaLineItem`, `updateMedusaLineItem`, `removeMedusaLineItem`: cart line-item operations.
- `initiateMedusaPaymentSession`: requests a session from the payment provider configured in Medusa.
- `completeMedusaCart`: submits the cart to Medusa's checkout completion endpoint.

## Required next steps before wiring checkout

1. Deploy the backend and set its CORS origins to the exact storefront origin.
2. In Medusa Admin, configure the South Africa/ZAR region, sales channel, product categories, product variants, prices and publishable API key.
3. Confirm the exact DebitoPay provider ID and the provider's expected payment-session data contract with a sandbox test.
4. Integrate the client into product listing/detail, then cart, then checkout; map Medusa product/variant fields to AVEART's existing UI types.
5. Replace demo order/payment flows only after shipping quote validation and payment webhooks are implemented and tested. Never mark an order paid from a browser redirect.
6. Run build/type checks and end-to-end sandbox tests before merging this branch.
