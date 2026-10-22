# Supabase catalog integration (draft)

This branch changes the storefront product and category API routes to read active products from Supabase instead of Medusa.

## Vercel environment variables

Set these in the `aveart-south-africa` Vercel project for Preview first:

- `SUPABASE_URL` = the Supabase project URL
- `SUPABASE_ANON_KEY` = the Supabase publishable/anon key (never a secret/service-role key)

Redeploy the Preview deployment after setting the variables.

## Important limitations

- The admin panel must sync its product records to `public.products` for products to appear in the storefront. The panel currently stores product state in `public.admin_state`; this branch alone does not change that behavior.
- `api/cart/calculate.ts` currently validates cart items and computes item totals only. Shipping, tax, discounts and final order creation are not implemented here.
- The checkout UI calls `/api/orders`, `/api/shipping/quote`, and `/api/payments/charge`. Those endpoints must be implemented and tested before accepting real orders or payments.
- Do not enable production traffic until product syncing, currency, inventory/variants, shipping, and payment processing have been tested.
