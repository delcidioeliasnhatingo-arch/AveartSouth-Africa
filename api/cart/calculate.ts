const PRODUCT_API = "https://aveart-api.delcidioeliasnhatingo.workers.dev/api/products";

function normalizeProduct(raw: any) {
  const product = { ...raw };
  const basePrice = Number(product.base_price ?? product.price ?? 0);
  let variants = (Array.isArray(product.variants) ? product.variants : []).map((v: any) => ({
    ...v,
    id: String(v.id ?? v.variantId ?? `${product.id}-variant`),
    name: v.name ?? v.variantName ?? v.size ?? v.color ?? "Default",
    size: v.size ?? "",
    color: v.color ?? v.colorName ?? "",
    sku: v.sku ?? "",
    price_offset: Number(v.price_offset ?? (v.price != null ? Number(v.price) - basePrice : 0)),
    unit_price: Number(v.price ?? (basePrice + Number(v.price_offset ?? 0))),
    stock_quantity: Number(v.stock_quantity ?? v.stock ?? 0),
    image_url: v.image_url ?? v.imageUrl ?? "",
  }));
  const variantStock = variants.reduce((sum: number, v: any) => sum + Math.max(0, Number(v.stock_quantity) || 0), 0);
  const stock = Number(product.total_stock ?? product.stock_quantity ?? product.stock ?? product.inventory_quantity ?? 0);
  if (variants.length === 0 && stock > 0) {
    variants = [{
      id: String(product.id),
      name: "Default",
      size: "",
      color: "",
      sku: product.sku ?? String(product.id),
      price_offset: 0,
      unit_price: basePrice,
      stock_quantity: stock,
      image_url: product.primary_image ?? product.imageUrl ?? product.image_url ?? "",
    }];
  }
  return {
    ...product,
    title: product.title ?? product.name ?? "",
    slug: product.slug ?? String(product.name ?? product.title ?? product.id ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    base_price: basePrice,
    primary_image: product.primary_image ?? product.imageUrl ?? product.image_url ?? "",
    total_stock: stock > 0 ? stock : variantStock,
    variants,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = req.body || {};
    const requested = Array.isArray(body.items) ? body.items : [];
    if (!requested.length) {
      return res.status(200).json({
        lineItems: [], subtotal: 0, discountAmount: 0, appliedDiscount: null,
        shippingMethod: body.shippingMethod || "", shippingAmount: 0,
        taxAmount: 0, totalAmount: 0, errors: [], isValid: true
      });
    }

    const response = await fetch(PRODUCT_API, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Cloudflare product API returned ${response.status}`);
    const data = await response.json();
    const products = (Array.isArray(data) ? data : []).map(normalizeProduct);
    const byVariant = new Map<string, any>();
    for (const product of products) {
      for (const variant of product.variants || []) {
        byVariant.set(String(variant.id), { product, variant });
      }
    }

    const errors: string[] = [];
    const lineItems = [];
    let subtotal = 0;

    for (const raw of requested) {
      const variantId = String(raw?.variantId || "");
      const quantity = Math.floor(Number(raw?.quantity || 0));
      if (!variantId || !Number.isFinite(quantity) || quantity < 1) {
        errors.push("A cart item has an invalid variant or quantity.");
        continue;
      }
      const match = byVariant.get(variantId);
      if (!match) {
        errors.push("A product in your bag is no longer available. Remove it and try again.");
        continue;
      }
      const { product, variant } = match;
      const stockAvailable = Math.max(0, Number(variant.stock_quantity ?? 0));
      if (quantity > stockAvailable) {
        errors.push(`${product.title}: only ${stockAvailable} item(s) currently available.`);
      }
      const unitPrice = Number(variant.unit_price ?? product.base_price + Number(variant.price_offset ?? 0));
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        errors.push(`${product.title}: price is not configured correctly.`);
      }
      const lineTotal = Math.max(0, unitPrice) * quantity;
      subtotal += lineTotal;
      lineItems.push({
        productId: product.id,
        variantId: variant.id,
        sku: variant.sku || "",
        productTitle: product.title,
        variantName: variant.name || "Default",
        size: variant.size || undefined,
        color: variant.color || undefined,
        productSlug: product.slug,
        unitPrice,
        quantity,
        lineTotal,
        imageUrl: variant.image_url || product.primary_image || "",
        stockAvailable
      });
    }

    const discountCode = String(body.discountCode || "").trim();
    if (discountCode) errors.push("Discount validation is not configured; remove the code to continue.");
    const taxAmount = 0;
    const shippingAmount = 0;
    const discountAmount = 0;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingAmount + taxAmount);
    return res.status(200).json({
      lineItems, subtotal, discountAmount, appliedDiscount: null,
      shippingMethod: body.shippingMethod || "", shippingAmount, taxAmount, totalAmount,
      errors, isValid: errors.length === 0
    });
  } catch (error: any) {
    return res.status(502).json({
      error: "Unable to calculate AVEART bag.",
      details: process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined
    });
  }
}
