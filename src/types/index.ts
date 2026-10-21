export type GenderCategory = 'women' | 'men' | 'unisex';

export interface ColorOption {
  name: string;
  hex: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  gender?: GenderCategory;
  sort_order: number;
  product_count?: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  size?: string;
  color?: string;
  finish?: string;
  price_offset: number;
  stock_quantity: number;
  low_stock_threshold: number;
  image_url: string;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  gender: GenderCategory;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  material: string;
  dimensions?: string;
  artisan: string;
  provenance: string;
  care_instructions?: string;
  base_price: number; // In ZAR
  original_price?: number; // In ZAR (for genuine sale/discount)
  sizes?: string[]; // e.g. ['XS', 'S', 'M', 'L', 'XL']
  colors?: ColorOption[];
  tags?: string[];
  is_published: number;
  is_featured: number;
  is_on_sale?: number;
  created_at: string;
  variants?: ProductVariant[];
  min_price?: number;
  max_price?: number;
  total_stock?: number;
  primary_image?: string;
}

export interface CartItem {
  variantId: string;
  quantity: number;
  productTitle?: string;
  variantName?: string;
  size?: string;
  color?: string;
  productSlug?: string;
  unitPrice?: number;
  imageUrl?: string;
  stockAvailable?: number;
  lineTotal?: number;
  medusaLineItemId?: string;
}

export interface ServerCartCalculation {
  lineItems: Array<{
    productId: string;
    variantId: string;
    sku: string;
    productTitle: string;
    variantName: string;
    size?: string;
    color?: string;
    productSlug: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    imageUrl: string;
    stockAvailable: number;
  }>;
  subtotal: number;
  discountAmount: number;
  appliedDiscount: {
    code: string;
    percent?: number;
    fixedAmount?: number;
    amountSaved: number;
  } | null;
  shippingMethod: string;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  errors: string[];
  isValid: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'store_manager' | 'customer';
  phone?: string;
}

export interface Address {
  id: string;
  user_id: string;
  recipient_name: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  product_title: string;
  variant_name: string;
  size?: string;
  color?: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  image_url: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  shipping_street: string;
  shipping_apartment?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_method: string;
  status: 'pending_payment' | 'paid' | 'preparing_shipment' | 'in_transit' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'unpaid' | 'processing' | 'succeeded' | 'failed' | 'refunded';
  payment_intent_id?: string;
  payment_provider?: string; // 'debito_pay' or 'stripe_sandbox'
  subtotal: number;
  discount_amount: number;
  discount_code?: string;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface InventoryLog {
  id: string;
  variant_id: string;
  sku: string;
  variant_name: string;
  product_title: string;
  change_quantity: number;
  balance_after: number;
  reason: string;
  reference_id?: string;
  notes?: string;
  created_at: string;
}

export interface AdminMetrics {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  lowStockCount: number;
  recentOrders: Order[];
}

// Currency Formatter Utility for South African Rand
export function formatZAR(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
