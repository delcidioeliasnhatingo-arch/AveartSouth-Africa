# AVEART live shipping setup

The checkout requests live ShipLogic rates. It must not display fixed or invented prices. Configure these variables on the server runtime that actually runs `server.ts`:

- `SHIPLOGIC_API_TOKEN`: valid ShipLogic bearer token. Keep it server-side.
- `AVEART_SHIPPING_PROFILES_JSON`: JSON object keyed by each product's exact catalog slug (or product ID), with that product's supplier origin and packed parcel dimensions/weight.
- `SHIPPING_QUOTE_SECRET`: long random secret for signing short-lived quotes. If omitted, the server uses the ShipLogic token for signing.

Profile shape (replace every placeholder with verified supplier data; do not use this example as a real address):

```json
{
  "exact-product-slug": {
    "collection_address": {
      "street_address": "SUPPLIER STREET ADDRESS",
      "city": "SUPPLIER CITY",
      "zone": "SUPPLIER PROVINCE",
      "country": "ZA",
      "code": "SUPPLIER POSTAL CODE",
      "type": "business"
    },
    "parcel": {
      "submitted_length_cm": 30,
      "submitted_width_cm": 25,
      "submitted_height_cm": 5,
      "submitted_weight_kg": 0.5,
      "packaging": "parcel"
    }
  }
}
```

Measurements are examples only. Use the actual packed measurements and weight. Add a profile for every product; products from different suppliers must use their respective origins. For quantities greater than one, the endpoint currently sends one parcel per unit and sums matching services across origin groups.

`POST /api/shipping/quote` accepts `items: [{ variantId, quantity }]` and `delivery: { street_address, city, zone, code, suburb?, type? }`. It returns up to three available carrier services with ZAR prices and signed quote tokens valid for 15 minutes. Order creation validates that the selected token still matches the cart and destination.

Activation steps: (1) configure the valid carrier token, (2) add accurate profiles for every sellable product, (3) set the quote secret, (4) deploy the Express server containing the quote and order endpoints, and (5) test single-supplier and mixed-supplier baskets, quantity changes, changed destinations, and expired quotes. Until the server runtime, token, and supplier data are configured, the API deliberately reports a configuration error instead of inventing prices.
