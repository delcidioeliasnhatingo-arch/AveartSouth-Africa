import crypto from "node:crypto";

function requiredEnv() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const rate = process.env.AVEART_SHIPPING_ZAR;
  if (!url || !key || rate === undefined || rate === "" || !Number.isFinite(Number(rate)) || Number(rate) < 0) {
    throw new Error("Shipping is not configured. Set AVEART_SHIPPING_ZAR to the standard delivery fee in ZAR.");
  }
  return { secret: key, amount: Number(rate) };
}

function normalize(value: unknown) { return String(value || "").trim().toLowerCase(); }

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const { secret, amount } = requiredEnv();
    const delivery = req.body?.delivery || {};
    const street = normalize(delivery.street_address);
    const city = normalize(delivery.city);
    const zone = normalize(delivery.zone);
    const code = normalize(delivery.code);
    const country = normalize(delivery.country);
    if (!street || !city || !zone || !code || country !== "za") {
      return res.status(400).json({ error: "Complete a valid South African delivery address before calculating shipping." });
    }
    const payload = {
      amount,
      address: [street, city, zone, code, country].join("|"),
      expires: Date.now() + 20 * 60 * 1000,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto.createHmac("sha256", secret).update(encoded).digest("hex");
    const quoteToken = encoded + "." + signature;
    return res.status(200).json({
      rates: [{
        service_code: "aveart-standard",
        service_name: "Standard delivery",
        amount_zar: amount,
        estimated_delivery_from: null,
        estimated_delivery_to: null,
        quoteToken,
      }],
    });
  } catch (error: any) {
    return res.status(503).json({ error: error?.message || "Shipping quote is unavailable." });
  }
}
