/**
 * Public AVEART storefront client for the Medusa Store API.
 *
 * Only expose VITE_ variables that are safe to ship to the browser:
 * - VITE_MEDUSA_BACKEND_URL
 * - VITE_MEDUSA_PUBLISHABLE_KEY
 * - VITE_MEDUSA_REGION_ID (optional until the South Africa region is configured)
 * - VITE_MEDUSA_SALES_CHANNEL_ID (optional)
 *
 * Never place DATABASE_URL, DebitoPay keys, webhook secrets, JWT_SECRET or
 * COOKIE_SECRET in VITE_ variables.
 */

export type MedusaList<T> = {
  [key: string]: unknown;
  count?: number;
  limit?: number;
  offset?: number;
  products?: T[];
  product_categories?: T[];
  cart?: MedusaCart;
  payment_collection?: unknown;
  type?: string;
};

export type MedusaProduct = {
  id: string;
  title: string;
  handle: string;
  description?: string | null;
  subtitle?: string | null;
  status?: string;
  thumbnail?: string | null;
  images?: Array<{ id?: string; url: string }>;
  categories?: Array<{ id: string; name: string; handle: string }>;
  variants?: Array<{
    id: string;
    title?: string;
    sku?: string | null;
    manage_inventory?: boolean;
    calculated_price?: {
      calculated_amount?: number;
      currency_code?: string;
    } | null;
    prices?: Array<{ amount: number; currency_code: string }>;
    options?: Array<{ id?: string; value: string; option?: { title?: string } }>;
  }>;
  [key: string]: unknown;
};

export type MedusaCart = {
  id: string;
  region_id?: string;
  currency_code?: string;
  items?: Array<{
    id: string;
    quantity: number;
    variant_id?: string;
    title?: string;
    unit_price?: number;
    subtotal?: number;
    total?: number;
  }>;
  total?: number;
  subtotal?: number;
  [key: string]: unknown;
};

type MedusaConfig = {
  backendUrl: string;
  publishableKey: string;
  regionId?: string;
  salesChannelId?: string;
};

export function getMedusaConfig(): MedusaConfig {
  const env = import.meta.env;
  const backendUrl = String(env.VITE_MEDUSA_BACKEND_URL || '').trim().replace(/\/+$/, '');
  const publishableKey = String(env.VITE_MEDUSA_PUBLISHABLE_KEY || '').trim();

  if (!backendUrl) {
    throw new Error('Medusa is not configured: set VITE_MEDUSA_BACKEND_URL in the storefront hosting settings.');
  }
  if (!/^https?:\/\//i.test(backendUrl)) {
    throw new Error('VITE_MEDUSA_BACKEND_URL must be an absolute HTTP(S) URL.');
  }
  if (!publishableKey) {
    throw new Error('Medusa is not configured: create a publishable API key in Medusa Admin and set VITE_MEDUSA_PUBLISHABLE_KEY.');
  }

  return {
    backendUrl,
    publishableKey,
    regionId: String(env.VITE_MEDUSA_REGION_ID || '').trim() || undefined,
    salesChannelId: String(env.VITE_MEDUSA_SALES_CHANNEL_ID || '').trim() || undefined,
  };
}

export async function medusaFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = getMedusaConfig();
  const url = `${config.backendUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');
  headers.set('x-publishable-api-key', config.publishableKey);
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(url, { ...init, headers });
  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorPayload = payload as { message?: string; type?: string } | null;
    const message = errorPayload?.message || `Medusa Store API request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }
  return payload as T;
}

export async function listMedusaProducts(options: {
  limit?: number;
  offset?: number;
  handle?: string;
  categoryId?: string;
} = {}): Promise<MedusaList<MedusaProduct>> {
  const config = getMedusaConfig();
  const params = new URLSearchParams({
    limit: String(options.limit ?? 24),
    offset: String(options.offset ?? 0),
    fields: '+variants,+variants.calculated_price,+variants.prices,+variants.options,+categories',
  });
  if (options.handle) params.set('handle', options.handle);
  if (options.categoryId) params.set('category_id[]', options.categoryId);
  if (config.regionId) params.set('region_id', config.regionId);
  if (config.salesChannelId) params.set('sales_channel_id[]', config.salesChannelId);
  return medusaFetch<MedusaList<MedusaProduct>>(`/store/products?${params.toString()}`);
}

export async function listMedusaCategories(): Promise<MedusaList<{ id: string; name: string; handle: string; description?: string | null }>> {
  return medusaFetch('/store/product-categories?limit=100&include_descendants_tree=true');
}

export async function createMedusaCart(): Promise<MedusaCart> {
  const config = getMedusaConfig();
  if (!config.regionId) {
    throw new Error('Medusa checkout needs VITE_MEDUSA_REGION_ID for the configured South Africa/ZAR region.');
  }
  const body: Record<string, string> = { region_id: config.regionId };
  if (config.salesChannelId) body.sales_channel_id = config.salesChannelId;
  const response = await medusaFetch<{ cart: MedusaCart }>('/store/carts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!response?.cart?.id) throw new Error('Medusa did not return a cart ID.');
  return response.cart;
}

export async function addMedusaLineItem(cartId: string, variantId: string, quantity = 1): Promise<MedusaCart> {
  if (!cartId || !variantId || !Number.isInteger(quantity) || quantity < 1) {
    throw new Error('A valid cart, variant and positive integer quantity are required.');
  }
  const response = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${encodeURIComponent(cartId)}/line-items`, {
    method: 'POST',
    body: JSON.stringify({ variant_id: variantId, quantity }),
  });
  return response.cart;
}

export async function updateMedusaLineItem(cartId: string, lineItemId: string, quantity: number): Promise<MedusaCart> {
  if (!cartId || !lineItemId || !Number.isInteger(quantity) || quantity < 1) {
    throw new Error('A valid cart, line item and positive integer quantity are required.');
  }
  const response = await medusaFetch<{ cart: MedusaCart }>(
    `/store/carts/${encodeURIComponent(cartId)}/line-items/${encodeURIComponent(lineItemId)}`,
    { method: 'POST', body: JSON.stringify({ quantity }) },
  );
  return response.cart;
}

export async function removeMedusaLineItem(cartId: string, lineItemId: string): Promise<MedusaCart> {
  const response = await medusaFetch<{ parent?: MedusaCart; cart?: MedusaCart }>(
    `/store/carts/${encodeURIComponent(cartId)}/line-items/${encodeURIComponent(lineItemId)}`,
    { method: 'DELETE' },
  );
  const cart = response.cart || response.parent;
  if (!cart) throw new Error('Medusa did not return the updated cart after removing the item.');
  return cart;
}

export async function initiateMedusaPaymentSession(
  cartId: string,
  providerId: string,
  data: Record<string, unknown> = {},
): Promise<MedusaCart> {
  if (!cartId || !providerId) throw new Error('Cart ID and configured Medusa payment provider ID are required.');
  const response = await medusaFetch<{ cart: MedusaCart }>(
    `/store/carts/${encodeURIComponent(cartId)}/payment-sessions`,
    { method: 'POST', body: JSON.stringify({ provider_id: providerId, data }) },
  );
  return response.cart;
}

export async function completeMedusaCart(cartId: string): Promise<Record<string, unknown>> {
  if (!cartId) throw new Error('Cart ID is required to complete checkout.');
  return medusaFetch<Record<string, unknown>>(
    `/store/carts/${encodeURIComponent(cartId)}/complete`,
    { method: 'POST', body: JSON.stringify({}) },
  );
}
