import crypto from "node:crypto";

function config() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key || key.startsWith("REPLACE_WITH_")) throw new Error("Server-side Supabase service key is not configured.");
  return { url, key };
}

async function db(path: string, init: RequestInit = {}) {
  const { url, key } = config();
  return fetch(url + "/rest/v1/" + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

function verifyQuote(token: string, delivery: any, secret: string) {
  const [encoded, supplied] = token.split(".");
  if (!encoded || !supplied) throw new Error("Shipping quote expired or invalid. Calculate shipping again.");
  const expected = crypto.createHmac("sha256", secret).update(encoded).digest("hex");
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) throw new Error("Shipping quote expired or invalid. Calculate shipping again.");
  const quote = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  const address = [
    String(delivery.street_address || "").trim().toLowerCase(),
    String(delivery.city || "").trim().toLowerCase(),
    String(delivery.zone || "").trim().toLowerCase(),
    String(delivery.code || "").trim().toLowerCase(),
    String(delivery.country || "").trim().toLowerCase(),
  ].join("|");
  if (!Number.isFinite(Number(quote.amount)) || Number(quote.expires) < Date.now() || quote.address !== address) {
    throw new Error("Shipping quote expired or no longer matches the delivery address. Calculate shipping again.");
  }
  return Number(quote.amount);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { url, key } = config();
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const customerName = String(body.customerName || "").trim();
    const customerEmail = String(body.customerEmail || "").trim().toLowerCase();
    const customerPhone = String(body.customerPhone || "").trim();
    const street = String(body.shippingStreet || "").trim();
    const apartment = String(body.shippingApartment || "").trim();
    const city = String(body.shippingCity || "").trim();
    const zone = String(body.shippingState || "").trim();
    const postalCode = String(body.shippingPostalCode || "").trim();
    const country = String(body.shippingCountry || "South Africa").trim();
    const notes = String(body.notes || "").trim();

    if (!customerName || !customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) || !customerPhone) {
      return res.status(400).json({ error: "Enter your name, valid email and contact number." });
    }
    if (!street || !city || !zone || !postalCode || country.toLowerCase() !== "south africa") {
      return res.status(400).json({ error: "Complete the South African delivery address." });
    }
    if (!items.length || items.length > 50) return res.status(400).json({ error: "The shopping cart is empty or invalid." });
    if (body.discountCode) return res.status(400).json({ error: "Discount codes are not available at checkout yet. Remove the code and try again." });

    const delivery = { street_address: street, city, zone, code: postalCode, country: "ZA" };
    const shippingCost = verifyQuote(String(body.shippingQuoteToken || ""), delivery, key);

    const productsResponse = await db("products?select=id,name,price,stock,status,variants,image_url,images&status=eq.active");
    if (!productsResponse.ok) throw new Error("Could not verify product prices and stock.");
    const products = await productsResponse.json() as any[];

    const lineItems: any[] = [];
    for (const item of items) {
      const variantId = String(item.variantId || "");
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return res.status(400).json({ error: "One of the product quantities is invalid." });
      }
      const productId = variantId.split("::")[0];
      const product = products.find((p) => p.id === productId);
      if (!product) return res.status(400).json({ error: "A product in your cart is no longer available. Refresh the catalogue." });

      const variants = Array.isArray(product.variants) ? product.variants : [];
      let variant: any = null;
      let size: string | null = null;
      let color: string | null = null;
      let unitPrice = Number(product.price);
      let availableStock = Number(product.stock || 0);

      if (variantId.includes("::variant::")) {
        const encodedKey = variantId.split("::variant::")[1] || "";
        let keyValue = encodedKey;
        try { keyValue = decodeURIComponent(encodedKey); } catch {}
        const index = Number(keyValue);
        variant = variants.find((v: any, i: number) => String(v.sku || v.id || i) === keyValue || (Number.isInteger(index) && i === index));
        if (!variant) return res.status(400).json({ error: "A selected size or colour is no longer available. Refresh the product page." });
        size = variant.size || null;
        color = variant.color || null;
        unitPrice = Number(variant.price ?? product.price);
        availableStock = Number(variant.stock || 0);
      } else if (variantId.includes("::")) {
        const parts = variantId.split("::");
        try { size = decodeURIComponent(parts[1] || "") || null; color = decodeURIComponent(parts[2] || "") || null; } catch {}
        if (size === "One Size") size = null;
        if (color === "Default") color = null;
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(availableStock) || availableStock < quantity) {
        return res.status(400).json({ error: "A product is out of stock or has an invalid price." });
      }
      lineItems.push({
        product_id: product.id,
        product_name: product.name,
        size,
        color,
        quantity,
        unit_price: unitPrice,
        image_url: product.image_url || (Array.isArray(product.images) ? product.images[0] : null),
        line_total: unitPrice * quantity,
      });
    }

    const subtotal = Number(lineItems.reduce((sum, item) => sum + item.line_total, 0).toFixed(2));
    const total = Number((subtotal + shippingCost).toFixed(2));
    if (!Number.isFinite(total) || total < 5) return res.status(400).json({ error: "The order total must be at least R5.00 for Debitopay PayFast." });

    const customerResponse = await db("customers", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ name: customerName, email: customerEmail, phone: customerPhone }),
    });
    if (!customerResponse.ok) throw new Error("Could not save customer details.");
    const customerRows = await customerResponse.json() as any[];
    const customer = customerRows[0];
    if (!customer?.id) throw new Error("Could not create customer record.");

    const orderResponse = await db("orders", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        customer_id: customer.id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        shipping_address: {
          street,
          apartment,
          city,
          province: zone,
          postal_code: postalCode,
          country,
        },
        currency: "ZAR",
        subtotal,
        shipping_cost: shippingCost,
        total,
        payment_provider: "debito_pay",
        payment_status: "pending",
        fulfillment_status: "pending",
        notes,
      }),
    });
    if (!orderResponse.ok) throw new Error("Could not create the order. Please try again.");
    const orderRows = await orderResponse.json() as any[];
    const order = orderRows[0];
    if (!order?.id) throw new Error("Order was not created.");

    const itemResponse = await db("order_items", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(lineItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))),
    });
    if (!itemResponse.ok) {
      await db("orders?id=eq." + encodeURIComponent(order.id), { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ fulfillment_status: "cancelled" }) });
      throw new Error("Could not save the order items. Please contact support before retrying.");
    }

    return res.status(201).json({
      order: {
        ...order,
        total_amount: total,
        shipping_amount: shippingCost,
        payment_status: "unpaid",
        status: "pending_payment",
        items: lineItems,
      },
    });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || "Could not create order." });
  }
}
