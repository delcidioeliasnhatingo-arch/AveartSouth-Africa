import { getSupabaseProducts, mapSupabaseProduct, sendSupabaseError } from "../_supabase.ts";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const body = req.body || {};
    const requested = Array.isArray(body.items) ? body.items : [];
    if (!requested.length) return res.status(200).json({ lineItems: [], subtotal: 0, discountAmount: 0, appliedDiscount: null, shippingMethod: body.shippingMethod || "", shippingAmount: 0, taxAmount: 0, totalAmount: 0, errors: [], isValid: true });
    const products = (await getSupabaseProducts()).map(mapSupabaseProduct);
    const byVariant = new Map<string, any>();
    for (const product of products) for (const variant of product.variants || []) byVariant.set(variant.id, { product, variant });
    const errors: string[] = [];
    const lineItems: any[] = [];
    let subtotal = 0;
    for (const raw of requested) {
      const variantId = String(raw?.variantId || "");
      const quantity = Math.floor(Number(raw?.quantity || 0));
      if (!variantId || !Number.isFinite(quantity) || quantity < 1) { errors.push("A cart item has an invalid variant or quantity."); continue; }
      const match = byVariant.get(variantId);
      if (!match) { errors.push("A product in your bag is no longer available. Remove it and try again."); continue; }
      const { product, variant } = match;
      const stockAvailable = Number(variant.stock_quantity || 0);
      if (quantity > stockAvailable) errors.push(`${product.title}: only ${stockAvailable} item(s) currently available.`);
      const unitPrice = Number(variant.calculated_price || 0);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) errors.push(`${product.title}: price is not configured.`);
      const lineTotal = Math.max(0, unitPrice) * quantity;
      subtotal += lineTotal;
      lineItems.push({ productId: product.id, variantId: variant.id, sku: variant.sku || "", productTitle: product.title, variantName: variant.name || "Default", size: variant.size, color: variant.color, productSlug: product.slug, unitPrice, quantity, lineTotal, imageUrl: variant.image_url || product.primary_image || "", stockAvailable });
    }
    const discountCode = String(body.discountCode || "").trim();
    if (discountCode) errors.push("Discount validation is not configured; remove the code to continue.");
    const shippingAmount = 0, taxAmount = 0, discountAmount = 0;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingAmount + taxAmount);
    return res.status(200).json({ lineItems, subtotal, discountAmount, appliedDiscount: null, shippingMethod: body.shippingMethod || "", shippingAmount, taxAmount, totalAmount, errors, isValid: errors.length === 0 });
  } catch (error) { return sendSupabaseError(res, error); }
}
