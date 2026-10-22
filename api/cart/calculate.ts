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
    const variantQty = new Map<string, number>();
    const productQty = new Map<string, number>();
    for (const raw of requested) {
      const id = String(raw?.variantId || "");
      const qty = Number(raw?.quantity);
      const match = byVariant.get(id);
      if (match && Number.isInteger(qty) && qty > 0) {
        variantQty.set(id, (variantQty.get(id) || 0) + qty);
        if (match.variant.stock_tracking !== "variant") productQty.set(match.product.id, (productQty.get(match.product.id) || 0) + qty);
      }
    }
    const errors: string[] = [];
    const lineItems: any[] = [];
    const stockErrors = new Set<string>();
    let subtotal = 0;
    for (const raw of requested) {
      const variantId = String(raw?.variantId || "");
      const quantity = Number(raw?.quantity);
      if (!variantId || !Number.isInteger(quantity) || quantity < 1) { errors.push("A cart item has an invalid variant or quantity."); continue; }
      const match = byVariant.get(variantId);
      if (!match) { errors.push("A product in your bag is no longer available. Remove it and try again."); continue; }
      const { product, variant } = match;
      const available = Math.max(0, Number(variant.stock_quantity || 0));
      const requestedQty = variant.stock_tracking === "variant" ? (variantQty.get(variantId) || quantity) : (productQty.get(product.id) || quantity);
      const stockKey = variant.stock_tracking === "variant" ? variantId : product.id;
      if (requestedQty > available && !stockErrors.has(stockKey)) {
        errors.push(variant.stock_tracking === "variant"
          ? product.title + " (" + variant.name + "): only " + available + " item(s) available for this size/colour."
          : product.title + ": only " + available + " item(s) available across all sizes and colours.");
        stockErrors.add(stockKey);
      }
      const unitPrice = Number(variant.calculated_price || 0);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) errors.push(product.title + ": price is not configured.");
      const lineTotal = Math.max(0, unitPrice) * quantity;
      subtotal += lineTotal;
      lineItems.push({ productId: product.id, variantId: variant.id, sku: variant.sku || "", productTitle: product.title, variantName: variant.name || "Default", size: variant.size, color: variant.color, productSlug: product.slug, unitPrice, quantity, lineTotal, imageUrl: variant.image_url || product.primary_image || "", stockAvailable: available });
    }
    const discountCode = String(body.discountCode || "").trim();
    if (discountCode) errors.push("Discount validation is not configured; remove the code to continue.");
    const shippingAmount = 0, taxAmount = 0, discountAmount = 0;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingAmount + taxAmount);
    return res.status(200).json({ lineItems, subtotal, discountAmount, appliedDiscount: null, shippingMethod: body.shippingMethod || "", shippingAmount, taxAmount, totalAmount, errors, isValid: errors.length === 0 });
  } catch (error) { return sendSupabaseError(res, error); }
}
