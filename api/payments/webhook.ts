import crypto from "node:crypto";

export const config = { api: { bodyParser: false } };

async function readRawBody(req: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function constantTimeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const secret = process.env.DEBITOPAY_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Webhook server configuration is incomplete." });
  }

  try {
    const rawBody = await readRawBody(req);
    const suppliedSignature = String(req.headers["x-webhook-signature"] || "").replace(/^sha256=/i, "").trim();
    const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (!suppliedSignature || !constantTimeEqual(suppliedSignature.toLowerCase(), expectedSignature)) {
      return res.status(401).json({ error: "Invalid webhook signature." });
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    const paymentId = String(event?.data?.payment_id || "");
    const eventName = String(event?.event || "");
    if (!paymentId || !["payment.completed", "payment.failed", "payment.refunded", "payment.chargeback"].includes(eventName)) {
      return res.status(400).json({ error: "Unsupported or incomplete payment event." });
    }

    const headers = {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    };
    const lookup = await fetch(
      supabaseUrl + "/rest/v1/orders?select=id,payment_status&payment_reference=eq." + encodeURIComponent(paymentId) + "&limit=1",
      { headers },
    );
    if (!lookup.ok) return res.status(502).json({ error: "Could not look up the order." });
    const rows = await lookup.json() as any[];
    if (!rows.length) {
      // Acknowledge unknown/duplicate notifications so the gateway does not retry indefinitely.
      return res.status(200).json({ received: true, matched: false });
    }

    const statusByEvent: Record<string, string> = {
      "payment.completed": "paid",
      "payment.failed": "failed",
      "payment.refunded": "refunded",
      "payment.chargeback": "failed",
    };
    const patch = await fetch(
      supabaseUrl + "/rest/v1/orders?id=eq." + encodeURIComponent(rows[0].id),
      { method: "PATCH", headers, body: JSON.stringify({ payment_status: statusByEvent[eventName], ...(eventName === "payment.completed" ? { fulfillment_status: "processing" } : {}) }) },
    );
    if (!patch.ok) return res.status(502).json({ error: "Could not update order payment status." });
    return res.status(200).json({ received: true, matched: true });
  } catch {
    return res.status(400).json({ error: "Invalid webhook payload." });
  }
}
