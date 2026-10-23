export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }
  const apiKey = process.env.DEBITOPAY_API_KEY;
  const merchantId = process.env.DEBITOPAY_MERCHANT_ID;
  const walletCode = process.env.DEBITOPAY_WALLET_CODE;
  if (!apiKey || !merchantId || !walletCode) {
    return res.status(503).json({ success: false, error: 'Debito Pay is not configured for this deployment.' });
  }
  const { orderId, provider, details } = req.body || {};
  const amount = Number(details?.amount);
  const email = String(details?.customerEmail || '');
  const name = String(details?.customerName || '');
  const phone = String(details?.customerPhone || '');
  if (!orderId || !Number.isFinite(amount) || amount < 5 || !email || !name) {
    return res.status(400).json({ success: false, error: 'Order details are incomplete or the amount is below the ZAR payment minimum.' });
  }
  const origin = (req.headers.origin && /^https:\/\//i.test(req.headers.origin)) ? req.headers.origin : 'https://aveart-south-africa.vercel.app';
  const returnUrl = origin + '/payment-return?order_id=' + encodeURIComponent(String(orderId));
  try {
    const gateway = await fetch('https://gyqoaningqhurhvdugne.supabase.co/functions/v1/payment-orchestrator', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Idempotency-Key': String(orderId),
        'X-Customer-Origin': origin + '/checkout',
        ...(req.headers['user-agent'] ? { 'X-Customer-User-Agent': String(req.headers['user-agent']) } : {})
      },
      body: JSON.stringify({
        action: 'process',
        payment_method: 'payfast',
        merchant_id: merchantId,
        wallet_code: walletCode,
        amount,
        currency: 'ZAR',
        source: 'gateway',
        source_id: String(orderId),
        customer_email: email,
        customer_name: name,
        ...(phone ? { customer_phone: phone } : {}),
        return_url: returnUrl
      })
    });
    const raw = await gateway.text();
    let data: any;
    try { data = JSON.parse(raw); }
    catch { return res.status(502).json({ success: false, error: 'Debito Pay returned an invalid response.', detail: raw.slice(0, 200) }); }
    if (!gateway.ok || !data.success) {
      return res.status(gateway.status >= 400 ? gateway.status : 502).json({ success: false, error: data.error || 'Debito Pay could not start the payment.' });
    }
    if (!data.checkout_url) {
      return res.status(502).json({ success: false, error: 'Debito Pay did not return a hosted checkout URL.' });
    }
    return res.status(200).json({ success: true, status: data.status || 'pending', payment_id: data.payment_id, checkout_url: data.checkout_url });
  } catch {
    return res.status(502).json({ success: false, error: 'Could not connect to Debito Pay. Please try again.' });
  }
}
