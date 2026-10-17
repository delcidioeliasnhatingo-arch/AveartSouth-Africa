import crypto from 'node:crypto';
import { db } from './db.ts';

// Shared sandbox webhook secret
export const SANDBOX_WEBHOOK_SECRET = 'whsec_aveart_sandbox_' + crypto.createHash('sha256').update('aveart_curated_secret_2026').digest('hex').substring(0, 24);

export interface SandboxPaymentIntent {
  id: string;
  clientSecret: string;
  amount: number; // in dollars
  currency: string;
  status: 'requires_payment_method' | 'processing' | 'succeeded' | 'requires_action' | 'canceled';
  orderId: string;
  orderNumber: string;
  createdAt: string;
}

// In-memory or database registered payment intents
const paymentIntents = new Map<string, SandboxPaymentIntent>();

export function createPaymentIntent(orderId: string, orderNumber: string, amount: number): SandboxPaymentIntent {
  const id = 'pi_' + crypto.randomBytes(16).toString('hex');
  const clientSecret = `${id}_secret_${crypto.randomBytes(12).toString('hex')}`;
  
  const intent: SandboxPaymentIntent = {
    id,
    clientSecret,
    amount,
    currency: 'USD',
    status: 'requires_payment_method',
    orderId,
    orderNumber,
    createdAt: new Date().toISOString(),
  };

  paymentIntents.set(id, intent);
  return intent;
}

export function getPaymentIntent(id: string): SandboxPaymentIntent | undefined {
  return paymentIntents.get(id);
}

// Known Sandbox Test Cards for comprehensive sandbox testing
export const SANDBOX_TEST_CARDS = {
  SUCCESS: '4242424242424242',       // Guaranteed success
  AUTHENTICATION: '4000000000003063', // 3D Secure verification simulated
  DECLINED: '4000000000000002',       // Card declined (do_not_honor)
  INSUFFICIENT: '4000000000000119',   // Insufficient funds
  EXPIRED: '4000000000000069',        // Expired card
};

export interface ProcessSandboxResult {
  success: boolean;
  paymentIntentId: string;
  status: 'succeeded' | 'failed' | 'requires_action';
  errorCode?: string;
  errorMessage?: string;
  transactionId?: string;
}

export function processSandboxPayment(
  paymentIntentId: string,
  cardNumber: string,
  expiry: string,
  cvc: string,
  postalCode: string
): ProcessSandboxResult {
  const intent = paymentIntents.get(paymentIntentId);
  if (!intent) {
    return {
      success: false,
      paymentIntentId,
      status: 'failed',
      errorCode: 'intent_not_found',
      errorMessage: 'The payment intent does not exist or has expired.',
    };
  }

  const cleanCard = cardNumber.replace(/\s+/g, '');

  if (cleanCard === SANDBOX_TEST_CARDS.DECLINED) {
    intent.status = 'canceled';
    return {
      success: false,
      paymentIntentId,
      status: 'failed',
      errorCode: 'card_declined',
      errorMessage: 'Your card was declined by the issuer (test card simulation).',
    };
  }

  if (cleanCard === SANDBOX_TEST_CARDS.INSUFFICIENT) {
    intent.status = 'canceled';
    return {
      success: false,
      paymentIntentId,
      status: 'failed',
      errorCode: 'insufficient_funds',
      errorMessage: 'Insufficient funds for this transaction (test card simulation).',
    };
  }

  if (cleanCard === SANDBOX_TEST_CARDS.EXPIRED) {
    intent.status = 'canceled';
    return {
      success: false,
      paymentIntentId,
      status: 'failed',
      errorCode: 'expired_card',
      errorMessage: 'Your card has expired (test card simulation).',
    };
  }

  // Basic length validation
  if (cleanCard.length < 13 || cleanCard.length > 19) {
    return {
      success: false,
      paymentIntentId,
      status: 'failed',
      errorCode: 'invalid_card_number',
      errorMessage: 'Card number length is invalid.',
    };
  }

  // Successful payment
  intent.status = 'succeeded';
  const transactionId = 'txn_' + crypto.randomBytes(12).toString('hex');

  return {
    success: true,
    paymentIntentId,
    status: 'succeeded',
    transactionId,
  };
}

// Generate HMAC-SHA256 signature for webhook payload
export function generateWebhookSignature(payload: string, secret: string = SANDBOX_WEBHOOK_SECRET): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

// Verify HMAC-SHA256 signature
export function verifyWebhookSignature(payload: string, header: string, secret: string = SANDBOX_WEBHOOK_SECRET): boolean {
  try {
    const parts = header.split(',');
    let timestamp = '';
    let v1 = '';

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') timestamp = value;
      if (key === 'v1') v1 = value;
    }

    if (!timestamp || !v1) return false;

    // Defense against replay attacks: enforce 5-minute window
    const now = Math.floor(Date.now() / 1000);
    const eventTime = parseInt(timestamp, 10);
    if (Math.abs(now - eventTime) > 300) {
      return false;
    }

    const expectedSignature = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const actualBuffer = Buffer.from(v1, 'hex');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    return false;
  }
}

// Process Webhook Event Idempotently
export function processWebhookEvent(rawBody: string, signatureHeader: string): { processed: boolean; message: string; eventType?: string } {
  const isValid = verifyWebhookSignature(rawBody, signatureHeader);
  if (!isValid) {
    throw new Error('Invalid webhook signature');
  }

  const event = JSON.parse(rawBody);
  const eventId = event.id;

  // Check if event was already processed (Idempotency check)
  const existing = db.prepare('SELECT id, status FROM webhook_events WHERE event_id = ?').get(eventId) as { id: string; status: string } | undefined;
  if (existing) {
    return { processed: true, message: 'Event already processed (idempotent skip)', eventType: event.type };
  }

  const now = new Date().toISOString();

  // Handle Event Type
  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const orderNumber = pi.metadata?.orderNumber;

      if (orderNumber) {
        db.exec('BEGIN TRANSACTION;');
        try {
          const updateOrder = db.prepare(`
            UPDATE orders
            SET status = 'paid', payment_status = 'succeeded', payment_intent_id = ?, updated_at = ?
            WHERE order_number = ? AND payment_status != 'succeeded'
          `);
          updateOrder.run(pi.id, now, orderNumber);
          db.exec('COMMIT;');
        } catch (err) {
          db.exec('ROLLBACK;');
          throw err;
        }
      }
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      const orderNumber = charge.metadata?.orderNumber;

      if (orderNumber) {
        db.exec('BEGIN TRANSACTION;');
        try {
          const order = db.prepare('SELECT id, status FROM orders WHERE order_number = ?').get(orderNumber) as { id: string; status: string } | undefined;
          if (order && order.status !== 'refunded') {
            // Restore inventory
            const items = db.prepare('SELECT variant_id, quantity FROM order_items WHERE order_id = ?').all(order.id) as Array<{ variant_id: string; quantity: number }>;
            for (const item of items) {
              const currentVariant = db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').get(item.variant_id) as { stock_quantity: number };
              const newBalance = currentVariant.stock_quantity + item.quantity;

              db.prepare('UPDATE product_variants SET stock_quantity = ? WHERE id = ?').run(newBalance, item.variant_id);
              db.prepare(`
                INSERT INTO inventory_logs (id, variant_id, change_quantity, balance_after, reason, reference_id, notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `).run(crypto.randomUUID(), item.variant_id, item.quantity, newBalance, 'refund_restock', order.id, `Automatic restock from refunded order ${orderNumber}`, now);
            }

            db.prepare(`
              UPDATE orders
              SET status = 'refunded', payment_status = 'refunded', updated_at = ?
              WHERE id = ?
            `).run(now, order.id);
          }
          db.exec('COMMIT;');
        } catch (err) {
          db.exec('ROLLBACK;');
          throw err;
        }
      }
    }

    // Record webhook event in DB
    db.prepare(`
      INSERT INTO webhook_events (id, event_id, provider, event_type, payload, signature, status, processed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), eventId, 'aveart_sandbox', event.type, rawBody, signatureHeader, 'processed', now);

    return { processed: true, message: 'Event successfully processed', eventType: event.type };
  } catch (error: any) {
    db.prepare(`
      INSERT INTO webhook_events (id, event_id, provider, event_type, payload, signature, status, processed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), eventId, 'aveart_sandbox', event.type, rawBody, signatureHeader, 'failed', now);
    throw error;
  }
}
