import crypto from "node:crypto";

const API_BASE = "https://gyqoaningqhurhvdugne.supabase.co/functions/v1";

function getEnv() {
  const names = ["DEBITOPAY_API_KEY", "DEBITOPAY_MERCHANT_ID", "DEBITOPAY_WALLET_CODE", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "DEBITOPAY_RETURN_URL"];
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length) throw new Error("Missing server configuration: " + missing.join(", "));
  return {
    apiKey: process.env.DEBITOPAY_API_KEY!,
    merchantId: process.env.DEBITOPAY_MERCHANT_ID!,
    walletCode: process.env.DEBITOPAY_WALLET_CODE!,
    supabaseUrl: process.env.SUPABASE_URL!.replace(/\/$/, ""),
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    returnUrl: process.env.DEBITOPAY_RETURN_URL!,
  };
}

async function supabaseRequest(path: string, init: RequestInit = {}) {
  const env = getEnv();
  return fetch(env.supabaseUrl + "/rest/v1/" + path, {
    ...init,
    headers: {
      apikey: env.serviceKey,
      Authorization: "Bearer " + env.serviceKey,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const env = getEnv();
    const orderId = String(req.body?.orderId || "");
    if (!orderId) return res.status(400).json({ success: false, error: "orderId is required." });
    if (req.body?.provider !== "debito_pay") {
      return res.status(400).json({ success: false, error: "Unsupported payment provider." });
    }

    const orderResponse = await supabaseRequest(
      "orders?select=id,order_number,customer_name,customer_email,customer_phone,total,currency,payment_status,payment_reference&id=eq." + encodeURIComponent(orderId) + "&limit=1",
    );
    if (!orderResponse.ok) throw new Error("Could not read the order from Supabase.");
    const orders = await orderResponse.json() as any[];
    const order = orders[0];
    if (!order) return res.status(404).json({ success: false, error: "Order not found." });
    if (order.payment_status === "paid") return res.status(409).json({ success: false, error: "This order is already paid." });
    if (order.payment_reference) return res.status(409).json({ success: false, error: "A payment session already exists for this order. Check its status before retrying." });
    if (String(order.currency).toUpperCase() !== "ZAR") {
      return res.status(400).json({ success: false, error: "The order currency must be ZAR." });
    }
    const amount = Number(order.total);
    if (!Number.isFinite(amount) || amount < 5) {
      return res.status(400).json({ success: false, error: "PayFast payments must be at least R5.00." });
    }

    const returnUrl = new URL(env.returnUrl);\n    returnUrl.searchParams.set("order_id", String(order.id));\n    returnUrl.searchParams.set("order_number", String(order.order_number || ""));\n\n    const gatewayResponse = await fetch(API_BASE + "/payment-orchestrator", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        action: "process",
        payment_method: "payfast",
        merchant_id: env.merchantId,
        wallet_code: env.walletCode,
        amount,
        currency: "ZAR",
        customer_email: order.customer_email || undefined,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone || undefined,
        return_url: returnUrl.toString(),
        source: "aveart",
        source_id: order.order_number,
      }),
    });
    const gateway = await gatewayResponse.json().catch(() => ({})) as any;
    if (!gatewayResponse.ok || gateway.success !== true || !gateway.payment_id || !gateway.checkout_url) {
      return res.status(502).json({ success: false, error: "Debito Pay could not create the hosted checkout session." });
    }

    const saveResponse = await supabaseRequest("orders?id=eq." + encodeURIComponent(orderId) + "&payment_status=eq.pending", {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ payment_reference: String(gateway.payment_id), payment_provider: "debito_pay" }),
    });
    if (!saveResponse.ok) throw new Error("Payment session was created but could not be linked to the order. Contact support before retrying.");
    return res.status(200).json({
      success: true,
      paymentStatus: "pending",
      checkout_url: gateway.checkout_url,
      payment_reference: gateway.payment_id,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || "Payment initialization failed." });
  }
}
