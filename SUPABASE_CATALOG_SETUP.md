# Supabase catalog integration (preview)

This branch reads the public catalog from Supabase. The admin panel syncs product data from `public.admin_state` to `public.products`.

## Vercel Preview environment

Set these variables on the Preview target for branch `integration/supabase-catalog`:

- `SUPABASE_URL` = the Supabase project URL
- `SUPABASE_ANON_KEY` = the Supabase publishable/anon key (never a secret/service-role key)

Redeploy Preview after changing environment variables. Do not add a service-role key to browser or public environment variables.

## Database migration required

Before deploying this branch for testing, apply `supabase/migrations/003_product_variants.sql` from the admin repository in the Supabase SQL Editor. It adds `products.variants` as a JSON array so each size/colour variant can retain its own price and stock.

If this migration is not applied, the catalog endpoint will return a database error because it selects the `variants` column.

## Current behavior and limitations

- Only products with `status = 'active'` are returned to the storefront.
- Admin sync maps product names, category, description, price, cost price, SKU, image, sizes, colors, variants and stock.
- Products are upserted by SKU. The panel does not automatically delete products absent from its local state, to avoid deleting catalog items imported from another source.
- If a product has no saved variants, the storefront generates fallback size/colour combinations and uses product-level stock; this cannot enforce per-size/per-colour inventory.
- The cart calculation endpoint validates stock and totals only. Shipping, taxes, discounts and final order creation are not implemented here.
- The checkout UI calls `/api/orders`, `/api/shipping/quote`, and `/api/payments/charge`; these must be implemented and tested before accepting real orders or payments.
- Do not merge into production until the admin login, catalog, variants, currency, inventory, checkout, shipping and payment processing have been tested end-to-end.
