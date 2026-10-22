# Debito Pay integration (Preview only)

This integration is being prepared on branch `integration/supabase-catalog`. It does not change the production storefront.

## Vercel Preview environment variables

Add these as **server-side environment variables** on the `aveart-south-africa` project, targeting only the `integration/supabase-catalog` Preview branch:

- `DEBITOPAY_API_KEY`: the Debito Pay API key (keep secret; never use a `VITE_` or `NEXT_PUBLIC_` prefix)
- `DEBITOPAY_MERCHANT_ID`: merchant UUID
- `DEBITOPAY_WALLET_CODE`: the public 5-digit wallet code (not the internal Wallet ID)
- `DEBITOPAY_WEBHOOK_SECRET`: secret used to sign Debito Pay webhook deliveries
- `DEBITOPAY_RETURN_URL`: public HTTPS URL to which the hosted checkout returns the customer
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role/secret key, server-side only
- `SUPABASE_URL`: existing Supabase project URL

Do not paste these secrets into GitHub, chat, or frontend code. Save them directly in Vercel's Environment Variables UI. Do not target Production yet.

## Routes created

- `POST /api/payments/charge`: reads an existing pending ZAR order, requests a PayFast hosted checkout session from Debito Pay and saves its payment ID to `orders.payment_reference`.
- `POST /api/payments/webhook`: verifies `x-webhook-signature` using HMAC-SHA256 and updates the order payment status for supported payment events.

Configure the webhook in Debito Pay's dashboard to this exact Preview URL:

`https://<your-current-preview-host>/api/payments/webhook`

Use the actual current Vercel Preview hostname, not a guessed hostname. Subscribe to payment completion, failure, refund and chargeback events. If the dashboard provides a signing secret, store that exact secret as `DEBITOPAY_WEBHOOK_SECRET`.

## Important blockers before real payments

- The current storefront branch does not yet contain `POST /api/orders` or `POST /api/shipping/quote`. The checkout cannot complete end-to-end until those routes are implemented and verified.
- The customer return page/status flow still needs to be connected to the saved order and webhook-confirmed status.
- Confirm the webhook signature format against a real Debito Pay test event before enabling live transactions.
- Test with sandbox credentials first. Never mark an order as paid based only on the customer's browser redirect; the signed webhook is the source of truth.
- Keep this branch in Preview and do not merge to production until order creation, shipping, inventory, payment and return handling pass end-to-end tests.

Official API reference: https://debitopay.com/developers/payments-api/
