const API_BASE = "https://gyqoaningqhurhvdugne.supabase.co/functions/v1";

function env() {
  const names = ["DEBITOPAY_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = names.filter((name) => !process.env[name] || process.env[name]!.startsWith("REPLACE_WITH_"));
  if (missing.length) throw new Error("Payment status is not configured.");
  return {
    apiKey: process.env.DEBITOPAY_API_KEY!,
    supabaseUrl: process.env.SUPABASE_URL!.replace(/\/$/, ""),
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  };
}

async function db(path: string, init: RequestInit = {}) {
  const c = env();
  return fetch(c.supabaseUrl + "/rest/v1/" + path, {
    ...init,
    headers: {
      apikey: c.serviceKey,
      Authorization: "Bearer " + c.serviceKey,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const orderId = String(req.query?.order_id || "");
    if (!orderId) return res.status(400).json({ error: "order_id is required." });
    const lookup = await db("orders?select=id,order_number,payment_status,payment_reference,fulfillment_status&id=eq." + encodeURIComponent(orderId) + "&limit=1");
    if (!lookup.ok) throw new Error("Could not read order payment status.");
    const rows = await lookup.json() as any[];
    const order = rows[0];
    if (!order) return res.status(404).json({ error: "Order not found." });

    let status = String(order.payment_status || "pending");
    if (status === "pending" && order.payment_reference) {
      const c = env();
      const gatewayResponse = await fetch(API_BASE + "/payment-orchestrator", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + c.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ action: "check-status", payment_id: order.payment_reference }),
      });
      const gateway = await gatewayResponse.json().catch(() => ({})) as any;
      const gatewayStatus = String(gateway?.payment?.status || "").toLowerCase();
      const mapped = gatewayStatus === "success" ? "paid"
        : (gatewayStatus === "failed" || gatewayStatus === "expired") ? "failed"
        : gatewayStatus === "refunded" ? "refunded" : "pending";
      if (mapped !== "pending") {
        const patchBody: any = { payment_status: mapped };
        if (mapped === "paid") patchBody.fulfillment_status = "processing";
        const update = await db("orders?id=eq." + encodeURIComponent(order.id), {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(patchBody),
        });
        if (!update.ok) throw new Error("Could not update order payment status.");
        status = mapped;
      }
    }

    return res.status(200).json({
      order_number: order.order_number,
      payment_status: status,
      fulfillment_status: order.fulfillment_status,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Could not verify payment status." });
  }
}
