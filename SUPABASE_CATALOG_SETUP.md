# Supabase catalog integration (preview)

This branch reads the public catalog from Supabase. The admin panel syncs product data from `public.admin_state` to `public.products`.

## Vercel Preview environment

Set these variables on the Preview target for branch `integration/supabase-catalog`:

- `SUPABASE_URL` = the Supabase project URL
- `SUPABASE_ANON_KEY` = the Supabase publishable/anon key (never a secret/service-role key)

Redeploy Preview after changing environment variables. Do not add a service-role key to browser or public environment variables.

## Database migration required

Before testing, apply migrations `003_product_variants.sql` and `005_product_image_gallery.sql` from the admin repository to the same Supabase project. They add `products.variants` (JSON array) and `products.images` (text array) so variants retain their own price/stock and product image galleries are available to the storefront.

## Current behavior and limitations

- Only products with `status = 'active'` are returned to the storefront.
- Admin sync maps product names, category, description, price, cost price, SKU, primary image, image gallery, sizes, colors, variants and stock.
- Products are upserted by SKU. The panel only deactivates SKUs that it previously tracked and that disappear from the panel's saved product list; confirm the shared state is healthy before deleting products.
- If a product has no saved variants, the storefront generates fallback size/colour combinations and uses product-level stock; this cannot enforce per-size/per-colour inventory.
- The cart calculation endpoint validates stock and totals only. Shipping, taxes, discounts and final order creation are not implemented here.
- The checkout UI calls `/api/orders`, `/api/shipping/quote`, and `/api/payments/charge`; these must be implemented and tested before accepting real orders or payments.
- Do not merge into production until the admin login, catalog, variants, currency, inventory, checkout, shipping and payment processing have been tested end-to-end.
