import express, { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase, hashPassword, verifyPassword } from './src/server/db.ts';
import {
  createSession,
  authenticateToken,
  revokeSession,
  requireAuth,
  requireRole,
  optionalAuth,
  AuthenticatedRequest,
} from './src/server/auth.ts';
import {
  createPaymentIntent,
  getPaymentIntent,
  processSandboxPayment,
  generateWebhookSignature,
  processWebhookEvent,
  SANDBOX_TEST_CARDS,
  SANDBOX_WEBHOOK_SECRET,
} from './src/server/payment.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database and seed initial fashion data
initDatabase();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Express middleware
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString();
  },
}));

app.use('/api', optionalAuth as any);

// Helper to format product row from DB
function formatProductRow(row: any) {
  if (!row) return null;
  return {
    ...row,
    sizes: row.sizes_json ? JSON.parse(row.sizes_json) : [],
    colors: row.colors_json ? JSON.parse(row.colors_json) : [],
    tags: row.tags_json ? JSON.parse(row.tags_json) : [],
  };
}

// ==========================================
// 1. PUBLIC CATALOG & STOREFRONT ENDPOINTS
// ==========================================

// GET /api/categories
app.get('/api/categories', (req: Request, res: Response) => {
  try {
    const { gender } = req.query;
    let sql = `
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_published = 1
    `;
    const params: any[] = [];

    if (gender && gender !== 'all') {
      sql += ` WHERE (c.gender = ? OR c.gender = 'unisex')`;
      params.push(gender);
    }

    sql += ` GROUP BY c.id ORDER BY c.sort_order ASC`;

    const categories = db.prepare(sql).all(...params);
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
});

// GET /api/products
app.get('/api/products', (req: Request, res: Response) => {
  try {
    const { category, gender, search, minPrice, maxPrice, inStockOnly, sort, featured, onSale } = req.query;

    let query = `
      SELECT 
        p.*, 
        c.name as category_name, 
        c.slug as category_slug,
        COUNT(pv.id) as variant_count,
        MIN(p.base_price + pv.price_offset) as min_price,
        MAX(p.base_price + pv.price_offset) as max_price,
        TOTAL(pv.stock_quantity) as total_stock,
        (SELECT image_url FROM product_variants WHERE product_id = p.id AND image_url IS NOT NULL LIMIT 1) as primary_image
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.is_published = 1
    `;

    const params: any[] = [];

    if (gender && gender !== 'all') {
      query += ` AND (p.gender = ? OR p.gender = 'unisex')`;
      params.push(gender);
    }

    if (category) {
      query += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(category, category);
    }

    if (featured === 'true' || featured === '1') {
      query += ` AND p.is_featured = 1`;
    }

    if (onSale === 'true' || onSale === '1') {
      query += ` AND p.is_on_sale = 1`;
    }

    if (search && typeof search === 'string') {
      const term = `%${search.trim()}%`;
      query += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.material LIKE ? OR p.artisan LIKE ? OR p.tags_json LIKE ?)`;
      params.push(term, term, term, term, term);
    }

    if (minPrice) {
      query += ` AND (p.base_price >= ?)`;
      params.push(parseFloat(String(minPrice)));
    }

    if (maxPrice) {
      query += ` AND (p.base_price <= ?)`;
      params.push(parseFloat(String(maxPrice)));
    }

    query += ` GROUP BY p.id`;

    if (inStockOnly === 'true' || inStockOnly === '1') {
      query += ` HAVING total_stock > 0`;
    }

    if (sort === 'price_asc') {
      query += ` ORDER BY min_price ASC`;
    } else if (sort === 'price_desc') {
      query += ` ORDER BY max_price DESC`;
    } else if (sort === 'newest') {
      query += ` ORDER BY p.created_at DESC`;
    } else {
      query += ` ORDER BY p.is_featured DESC, p.created_at DESC`;
    }

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    const products = rows.map(formatProductRow);

    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

// GET /api/products/:slug
app.get('/api/products/:slug', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const productStmt = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.is_published = 1
    `);
    const rawProduct = productStmt.get(slug) as any;

    if (!rawProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = formatProductRow(rawProduct);

    const variants = db.prepare(`
      SELECT * FROM product_variants
      WHERE product_id = ?
      ORDER BY price_offset ASC, size ASC
    `).all(product.id);

    res.json({
      ...product,
      variants,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch product details', details: error.message });
  }
});

// GET /api/products/:slug/recommendations
// High-relevance recommendation engine following all specification rules:
// - Gender prioritized: women -> women (+ unisex), men -> men (+ unisex)
// - Excludes current product
// - Real catalog data only
// - Types supported: also_like (default), similar, complete_look
app.get('/api/products/:slug/recommendations', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const type = req.query.type || 'also_like'; // 'also_like', 'similar', 'complete_look'

    // 1. Get reference product
    const currentProduct = db.prepare(`
      SELECT p.*, c.slug as category_slug, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.is_published = 1
    `).get(slug) as any;

    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const currentGender = currentProduct.gender; // 'women', 'men', or 'unisex'
    const currentTags = currentProduct.tags_json ? JSON.parse(currentProduct.tags_json) : [];

    // Base query for candidate recommendations: published, purchasable, not self
    let candidatesQuery = `
      SELECT 
        p.*, 
        c.name as category_name, 
        c.slug as category_slug,
        COUNT(pv.id) as variant_count,
        MIN(p.base_price + pv.price_offset) as min_price,
        MAX(p.base_price + pv.price_offset) as max_price,
        TOTAL(pv.stock_quantity) as total_stock,
        (SELECT image_url FROM product_variants WHERE product_id = p.id AND image_url IS NOT NULL LIMIT 1) as primary_image
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.is_published = 1 AND p.id != ?
      GROUP BY p.id
      HAVING total_stock > 0
    `;

    const allCandidates = db.prepare(candidatesQuery).all(currentProduct.id).map(formatProductRow) as any[];

    // 1. Determine allowed genders
    // For women's: 'women' and 'unisex'. Never indiscriminately mix men's.
    // For men's: 'men' and 'unisex'. Never indiscriminately mix women's.
    // For unisex: 'unisex' prioritized, then complementary pieces.
    const allowedGenders = currentGender === 'unisex' ? ['unisex', 'women', 'men'] : [currentGender, 'unisex'];

    // Candidates within allowed genders only
    const validCandidates = allCandidates.filter((c) => allowedGenders.includes(c.gender));

    // Scoring engine based on recommendation type
    const scored = validCandidates.map((candidate) => {
      let score = 0;

      // Rule 1: Gender alignment
      if (currentGender === 'women') {
        if (candidate.gender === 'women') score += 40;
        else if (candidate.gender === 'unisex') score += 25;
      } else if (currentGender === 'men') {
        if (candidate.gender === 'men') score += 40;
        else if (candidate.gender === 'unisex') score += 25;
      } else {
        if (candidate.gender === 'unisex') score += 40;
        else score += 20;
      }

      // Rule 2: Recommendation type specific rules
      if (type === 'complete_look') {
        // Complete the look: prioritize cross-category pieces that create a full outfit
        if (candidate.category_id !== currentProduct.category_id) {
          score += 40;
        }

        // Check complementary tags (e.g. complementary:women-trousers, complementary:accessories)
        const isTagComplementary = currentTags.some((t: string) =>
          t.startsWith('complementary:') && candidate.category_slug.includes(t.replace('complementary:', ''))
        );
        if (isTagComplementary) {
          score += 60;
        }

        // Accessories complement everything
        if (candidate.category_slug.includes('accessories')) {
          score += 35;
        }
      } else if (type === 'similar') {
        // Similar products: prioritize same or adjacent category
        if (candidate.category_id === currentProduct.category_id) {
          score += 60;
        }

        // Match material
        if (candidate.material && currentProduct.material) {
          const mat1 = currentProduct.material.toLowerCase();
          const mat2 = candidate.material.toLowerCase();
          if (
            (mat1.includes('linen') && mat2.includes('linen')) ||
            (mat1.includes('silk') && mat2.includes('silk')) ||
            (mat1.includes('wool') && mat2.includes('wool')) ||
            (mat1.includes('cotton') && mat2.includes('cotton')) ||
            (mat1.includes('cashmere') && mat2.includes('cashmere'))
          ) {
            score += 35;
          }
        }
      } else {
        // 'also_like' (default): balanced combination of same style aesthetic and complementary wardrobe items
        if (candidate.category_id === currentProduct.category_id) {
          score += 25;
        }

        // Match shared tags
        const commonTags = (candidate.tags || []).filter((t: string) =>
          !t.startsWith('complementary:') && currentTags.includes(t)
        );
        score += commonTags.length * 15;

        // Prefer same designer / artisan
        if (candidate.artisan === currentProduct.artisan) {
          score += 15;
        }
      }

      // Prioritize featured items
      if (candidate.is_featured) score += 10;

      return { candidate, score };
    });

    // Sort descending by calculated score
    scored.sort((a, b) => b.score - a.score);

    // Ensure we take up to 4 recommendations without duplicates
    const results = scored.slice(0, 4).map((s) => s.candidate);

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate recommendations', details: error.message });
  }
});

// ==========================================
// 2. SERVER-AUTHORITATIVE CART & PRICING (ZAR)
// ==========================================

export interface CartCalculationItem {
  variantId: string;
  quantity: number;
}

export function calculateCartAuthoritative(
  items: CartCalculationItem[],
  discountCode?: string,
  shippingMethod: string = 'standard_curated'
) {
  let subtotal = 0;
  const lineItems: any[] = [];
  const errors: string[] = [];

  for (const item of items) {
    if (!item.variantId || item.quantity <= 0) continue;

    const row = db.prepare(`
      SELECT 
        pv.id as variant_id,
        pv.sku,
        pv.name as variant_name,
        pv.size,
        pv.color,
        pv.price_offset,
        pv.stock_quantity,
        pv.image_url,
        p.id as product_id,
        p.title as product_title,
        p.slug as product_slug,
        p.base_price,
        p.is_published
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.id = ?
    `).get(item.variantId) as any;

    if (!row || !row.is_published) {
      errors.push(`An item in your bag is no longer available.`);
      continue;
    }

    if (item.quantity > row.stock_quantity) {
      errors.push(
        `Only ${row.stock_quantity} unit(s) of "${row.product_title} (${row.variant_name})" remain in stock.`
      );
    }

    const unitPrice = row.base_price + row.price_offset;
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    lineItems.push({
      productId: row.product_id,
      variantId: row.variant_id,
      sku: row.sku,
      productTitle: row.product_title,
      variantName: row.variant_name,
      size: row.size,
      color: row.color,
      productSlug: row.product_slug,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
      imageUrl: row.image_url,
      stockAvailable: row.stock_quantity,
    });
  }

  // Calculate discount if promo code provided
  let discountAmount = 0;
  let appliedDiscount: any = null;

  if (discountCode) {
    const discountRow = db.prepare(`
      SELECT * FROM discounts 
      WHERE code = ? AND is_active = 1
    `).get(discountCode.trim().toUpperCase()) as any;

    if (discountRow) {
      const now = new Date().toISOString();
      const isExpired = discountRow.expires_at && discountRow.expires_at < now;
      const meetsMin = subtotal >= discountRow.min_order_value;

      if (!isExpired && meetsMin) {
        if (discountRow.discount_percent && discountRow.discount_percent > 0) {
          discountAmount = (subtotal * discountRow.discount_percent) / 100;
        } else if (discountRow.fixed_amount && discountRow.fixed_amount > 0) {
          discountAmount = Math.min(subtotal, discountRow.fixed_amount);
        }
        appliedDiscount = {
          code: discountRow.code,
          percent: discountRow.discount_percent,
          fixedAmount: discountRow.fixed_amount,
          amountSaved: discountAmount,
        };
      } else if (!meetsMin) {
        errors.push(`Promotion code ${discountRow.code} requires a minimum order of R ${discountRow.min_order_value}.`);
      }
    } else {
      errors.push(`Promotion code "${discountCode}" is invalid.`);
    }
  }

  // Shipping rules in ZAR (South African Rand):
  // Free delivery across South Africa on orders exceeding R 1,000 (otherwise R 95)
  // White-Glove Curated Delivery: R 350 flat
  let shippingAmount = 0;
  if (shippingMethod === 'white_glove_freight') {
    shippingAmount = 350.0;
  } else {
    shippingAmount = subtotal >= 1000.0 ? 0.0 : 95.0;
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  // South African standard VAT (15%)
  const taxAmount = Math.round(taxableAmount * 0.15 * 100) / 100;
  const totalAmount = Math.round((taxableAmount + shippingAmount + taxAmount) * 100) / 100;

  return {
    lineItems,
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    appliedDiscount,
    shippingMethod,
    shippingAmount,
    taxAmount,
    totalAmount,
    errors,
    isValid: errors.length === 0 && lineItems.length > 0,
  };
}

// POST /api/cart/calculate
app.post('/api/cart/calculate', (req: Request, res: Response) => {
  try {
    const { items, discountCode, shippingMethod } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const calculation = calculateCartAuthoritative(items, discountCode, shippingMethod);
    res.json(calculation);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to calculate cart', details: error.message });
  }
});

// ==========================================
// 3. AUTHENTICATION & CUSTOMER ACCOUNT
// ==========================================

app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const passwordHash = hashPassword(password);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, phone, created_at)
      VALUES (?, ?, ?, ?, 'customer', ?, ?)
    `).run(userId, cleanEmail, passwordHash, name.trim(), phone || null, now);

    const token = createSession(userId);

    res.json({
      user: {
        id: userId,
        email: cleanEmail,
        name: name.trim(),
        role: 'customer',
        phone: phone || null,
      },
      token,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;

    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = createSession(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
      token,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

app.post('/api/auth/logout', (req: AuthenticatedRequest, res: Response) => {
  if (req.sessionToken) {
    revokeSession(req.sessionToken);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

app.get('/api/auth/me', requireAuth as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(user.id);

    res.json({ user, addresses });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user profile', details: error.message });
  }
});

app.post('/api/auth/addresses', requireAuth as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { recipientName, street, apartment, city, state, postalCode, country, isDefault } = req.body;

    if (!recipientName || !street || !city || !postalCode || !country) {
      return res.status(400).json({ error: 'Missing required address fields.' });
    }

    const addressId = crypto.randomUUID();
    const now = new Date().toISOString();

    if (isDefault) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(user.id);
    }

    db.prepare(`
      INSERT INTO addresses (id, user_id, recipient_name, street, apartment, city, state, postal_code, country, is_default, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      addressId,
      user.id,
      recipientName.trim(),
      street.trim(),
      apartment?.trim() || null,
      city.trim(),
      state?.trim() || '',
      postalCode.trim(),
      country.trim(),
      isDefault ? 1 : 0,
      now
    );

    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(user.id);
    res.json(addresses);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save address', details: error.message });
  }
});

// ==========================================
// 4. CHECKOUT & ORDERS (DEBITO PAY & SANDBOX)
// ==========================================

app.post('/api/orders', (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      items,
      discountCode,
      shippingMethod,
      customerEmail,
      customerName,
      customerPhone,
      shippingStreet,
      shippingApartment,
      shippingCity,
      shippingState,
      shippingPostalCode,
      shippingCountry,
      paymentProvider = 'debito_pay',
      notes,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart must contain at least one item.' });
    }

    if (!customerEmail || !customerName || !shippingStreet || !shippingCity || !shippingPostalCode) {
      return res.status(400).json({ error: 'Recipient name, email, and shipping address are required.' });
    }

    const calc = calculateCartAuthoritative(items, discountCode, shippingMethod);
    if (!calc.isValid) {
      return res.status(400).json({
        error: 'Cart validation failed',
        details: calc.errors,
      });
    }

    const now = new Date().toISOString();
    const orderId = crypto.randomUUID();
    const orderNumber = 'AVE-ZA-' + Math.floor(1000 + Math.random() * 9000);
    const userId = req.user ? req.user.id : null;

    db.exec('BEGIN TRANSACTION;');
    try {
      for (const item of calc.lineItems) {
        const currentVariant = db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').get(item.variantId) as any;
        if (!currentVariant || currentVariant.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productTitle} (${item.variantName})`);
        }

        const newBalance = currentVariant.stock_quantity - item.quantity;
        db.prepare('UPDATE product_variants SET stock_quantity = ? WHERE id = ?').run(newBalance, item.variantId);

        db.prepare(`
          INSERT INTO inventory_logs (id, variant_id, change_quantity, balance_after, reason, reference_id, notes, created_at)
          VALUES (?, ?, ?, ?, 'order_reservation', ?, ?, ?)
        `).run(
          crypto.randomUUID(),
          item.variantId,
          -item.quantity,
          newBalance,
          orderId,
          `Order ${orderNumber} placed`,
          now
        );
      }

      db.prepare(`
        INSERT INTO orders (
          id, order_number, user_id, customer_email, customer_name, customer_phone,
          shipping_street, shipping_apartment, shipping_city, shipping_state, shipping_postal_code, shipping_country,
          shipping_method, payment_provider, status, payment_status, payment_intent_id,
          subtotal, discount_amount, discount_code, shipping_amount, tax_amount, total_amount,
          tracking_number, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', 'unpaid', null, ?, ?, ?, ?, ?, ?, null, ?, ?, ?)
      `).run(
        orderId,
        orderNumber,
        userId,
        customerEmail.trim(),
        customerName.trim(),
        customerPhone || null,
        shippingStreet.trim(),
        shippingApartment || null,
        shippingCity.trim(),
        shippingState || 'Western Cape',
        shippingPostalCode.trim(),
        shippingCountry || 'South Africa',
        shippingMethod || 'standard_curated',
        paymentProvider,
        calc.subtotal,
        calc.discountAmount,
        discountCode || null,
        calc.shippingAmount,
        calc.taxAmount,
        calc.totalAmount,
        notes || null,
        now,
        now
      );

      const insertItem = db.prepare(`
        INSERT INTO order_items (
          id, order_id, product_id, variant_id, product_title, variant_name, size, color, unit_price, quantity, line_total, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of calc.lineItems) {
        insertItem.run(
          crypto.randomUUID(),
          orderId,
          item.productId,
          item.variantId,
          item.productTitle,
          item.variantName,
          item.size || null,
          item.color || null,
          item.unitPrice,
          item.quantity,
          item.lineTotal,
          item.imageUrl
        );
      }

      db.exec('COMMIT;');
    } catch (err: any) {
      db.exec('ROLLBACK;');
      return res.status(409).json({ error: 'Order placement failed', details: err.message });
    }

    const paymentIntent = createPaymentIntent(orderId, orderNumber, calc.totalAmount);
    db.prepare('UPDATE orders SET payment_intent_id = ? WHERE id = ?').run(paymentIntent.id, orderId);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    res.json({
      order: {
        ...order,
        items: orderItems,
      },
      paymentIntent,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Order processing failed', details: error.message });
  }
});

// Debito Pay South African Checkout Adapter
app.post('/api/payment/debito-pay', (req: Request, res: Response) => {
  try {
    const { orderId, orderNumber, bankOrMethod, accountNumber } = req.body;
    if (!orderId || !orderNumber) {
      return res.status(400).json({ error: 'orderId and orderNumber are required' });
    }

    const now = new Date().toISOString();
    const trackingNumber = 'AVE-RAM-' + Math.floor(1000000 + Math.random() * 9000000);
    const debitoTxnId = 'debito_za_' + crypto.randomBytes(8).toString('hex');

    db.prepare(`
      UPDATE orders
      SET status = 'paid', payment_status = 'succeeded', payment_provider = 'debito_pay', tracking_number = ?, updated_at = ?
      WHERE id = ?
    `).run(trackingNumber, now, orderId);

    res.json({
      success: true,
      transactionId: debitoTxnId,
      provider: 'debito_pay',
      status: 'succeeded',
      message: 'Debito Pay South Africa authorization confirmed. Order is now queued for dispatch.',
      trackingNumber,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Debito Pay authorization failed', details: error.message });
  }
});

// Sandbox Payment Adapter
app.post('/api/payment/process-sandbox', (req: Request, res: Response) => {
  try {
    const { paymentIntentId, cardNumber, expiry, cvc, postalCode } = req.body;

    if (!paymentIntentId || !cardNumber) {
      return res.status(400).json({ error: 'Payment intent ID and card number are required.' });
    }

    const result = processSandboxPayment(
      paymentIntentId,
      cardNumber,
      expiry || '12/28',
      cvc || '123',
      postalCode || '8001'
    );

    if (!result.success) {
      return res.status(402).json({
        error: result.errorCode,
        message: result.errorMessage,
        status: result.status,
      });
    }

    const intent = getPaymentIntent(paymentIntentId);
    if (intent) {
      const now = new Date().toISOString();
      const trackingNumber = 'AVE-RAM-' + Math.floor(1000000 + Math.random() * 9000000);

      db.prepare(`
        UPDATE orders
        SET status = 'paid', payment_status = 'succeeded', tracking_number = ?, updated_at = ?
        WHERE id = ?
      `).run(trackingNumber, now, intent.orderId);
    }

    res.json({
      success: true,
      transactionId: result.transactionId,
      status: 'succeeded',
      message: 'Sandbox payment authorized successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Sandbox payment processing failed', details: error.message });
  }
});

app.get('/api/orders/my', requireAuth as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const orders = db.prepare(`
      SELECT * FROM orders 
      WHERE user_id = ? OR customer_email = ?
      ORDER BY created_at DESC
    `).all(user.id, user.email) as any[];

    const result = orders.map((order) => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return { ...order, items };
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch customer orders', details: error.message });
  }
});

app.get('/api/orders/track/:orderNumber', (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber) as any;

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    res.json({ ...order, items });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to track order', details: error.message });
  }
});

// ==========================================
// 5. ADMIN SUITE (OPERATIONS IN ZAR)
// ==========================================

app.get('/api/admin/metrics', requireRole('admin', 'store_manager') as any, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const totalRevenueRow = db.prepare(`
      SELECT TOTAL(total_amount) as total_revenue
      FROM orders 
      WHERE payment_status = 'succeeded'
    `).get() as any;

    const totalOrdersRow = db.prepare('SELECT COUNT(*) as total_orders FROM orders').get() as any;
    const paidOrdersRow = db.prepare("SELECT COUNT(*) as paid_orders FROM orders WHERE status = 'paid' OR status = 'preparing_shipment' OR status = 'in_transit' OR status = 'delivered'").get() as any;
    
    const lowStockRow = db.prepare(`
      SELECT COUNT(*) as low_stock_count
      FROM product_variants
      WHERE stock_quantity <= low_stock_threshold
    `).get() as any;

    const recentOrders = db.prepare(`
      SELECT * FROM orders
      ORDER BY created_at DESC
      LIMIT 8
    `).all();

    res.json({
      totalRevenue: Math.round((totalRevenueRow?.total_revenue || 0) * 100) / 100,
      totalOrders: totalOrdersRow?.total_orders || 0,
      paidOrders: paidOrdersRow?.paid_orders || 0,
      lowStockCount: lowStockRow?.low_stock_count || 0,
      recentOrders,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch admin metrics', details: error.message });
  }
});

app.get('/api/admin/orders', requireRole('admin', 'store_manager') as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search && typeof search === 'string') {
      const term = `%${search.trim()}%`;
      query += ' AND (order_number LIKE ? OR customer_email LIKE ? OR customer_name LIKE ?)';
      params.push(term, term, term);
    }

    query += ' ORDER BY created_at DESC';

    const orders = db.prepare(query).all(...params) as any[];
    const detailed = orders.map((order) => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return { ...order, items };
    });

    res.json(detailed);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
});

app.patch('/api/admin/orders/:id/status', requireRole('admin', 'store_manager') as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;

    const allowed = ['pending_payment', 'paid', 'preparing_shipment', 'in_transit', 'delivered', 'cancelled', 'refunded'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status transition.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const now = new Date().toISOString();

    if ((status === 'cancelled' || status === 'refunded') && order.status !== 'cancelled' && order.status !== 'refunded') {
      db.exec('BEGIN TRANSACTION;');
      try {
        const items = db.prepare('SELECT variant_id, quantity FROM order_items WHERE order_id = ?').all(id) as any[];
        for (const item of items) {
          const variant = db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').get(item.variant_id) as any;
          if (variant) {
            const newStock = variant.stock_quantity + item.quantity;
            db.prepare('UPDATE product_variants SET stock_quantity = ? WHERE id = ?').run(newStock, item.variant_id);
            db.prepare(`
              INSERT INTO inventory_logs (id, variant_id, change_quantity, balance_after, reason, reference_id, notes, created_at)
              VALUES (?, ?, ?, ?, 'order_cancelled', ?, ?, ?)
            `).run(
              crypto.randomUUID(),
              item.variant_id,
              item.quantity,
              newStock,
              id,
              `Restock from order ${order.order_number} (${status})`,
              now
            );
          }
        }

        db.prepare(`
          UPDATE orders 
          SET status = ?, payment_status = ?, updated_at = ?
          WHERE id = ?
        `).run(status, status === 'refunded' ? 'refunded' : order.payment_status, now, id);

        db.exec('COMMIT;');
      } catch (err) {
        db.exec('ROLLBACK;');
        throw err;
      }
    } else {
      let updateSql = 'UPDATE orders SET status = ?, updated_at = ?';
      const params: any[] = [status, now];

      if (trackingNumber) {
        updateSql += ', tracking_number = ?';
        params.push(trackingNumber.trim());
      }

      updateSql += ' WHERE id = ?';
      params.push(id);

      db.prepare(updateSql).run(...params);
    }

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update order status', details: error.message });
  }
});

app.get('/api/admin/inventory', requireRole('admin', 'store_manager') as any, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const inventory = db.prepare(`
      SELECT 
        pv.*,
        p.title as product_title,
        p.slug as product_slug,
        p.base_price,
        c.name as category_name
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      ORDER BY (pv.stock_quantity <= pv.low_stock_threshold) DESC, pv.stock_quantity ASC
    `).all();

    res.json(inventory);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch inventory', details: error.message });
  }
});

app.post('/api/admin/inventory/adjust', requireRole('admin', 'store_manager') as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { variantId, adjustment, reason, notes } = req.body;

    if (!variantId || typeof adjustment !== 'number') {
      return res.status(400).json({ error: 'variantId and adjustment (number) are required.' });
    }

    const variant = db.prepare('SELECT * FROM product_variants WHERE id = ?').get(variantId) as any;
    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const newBalance = Math.max(0, variant.stock_quantity + adjustment);
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare('UPDATE product_variants SET stock_quantity = ? WHERE id = ?').run(newBalance, variantId);

      db.prepare(`
        INSERT INTO inventory_logs (id, variant_id, change_quantity, balance_after, reason, reference_id, notes, created_at)
        VALUES (?, ?, ?, ?, ?, null, ?, ?)
      `).run(
        crypto.randomUUID(),
        variantId,
        adjustment,
        newBalance,
        reason || 'manual_adjustment',
        notes || 'Admin manual balance adjustment',
        now
      );

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    const updated = db.prepare('SELECT * FROM product_variants WHERE id = ?').get(variantId);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Inventory adjustment failed', details: error.message });
  }
});

app.get('/api/admin/inventory/logs', requireRole('admin', 'store_manager') as any, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = db.prepare(`
      SELECT 
        l.*,
        pv.sku,
        pv.name as variant_name,
        p.title as product_title
      FROM inventory_logs l
      JOIN product_variants pv ON l.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `).all();

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch inventory logs', details: error.message });
  }
});

app.get('/api/admin/discounts', requireRole('admin', 'store_manager') as any, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const discounts = db.prepare('SELECT * FROM discounts ORDER BY created_at DESC').all();
    res.json(discounts);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch discounts', details: error.message });
  }
});

app.post('/api/admin/discounts', requireRole('admin') as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, discountPercent, fixedAmount, minOrderValue, expiresAt, isActive } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Promo code is required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = db.prepare('SELECT id FROM discounts WHERE code = ?').get(cleanCode);
    if (existing) {
      return res.status(400).json({ error: 'Discount code already exists.' });
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    db.prepare(`
      INSERT INTO discounts (id, code, discount_percent, fixed_amount, min_order_value, expires_at, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      cleanCode,
      discountPercent ? parseFloat(discountPercent) : 0,
      fixedAmount ? parseFloat(fixedAmount) : 0,
      minOrderValue ? parseFloat(minOrderValue) : 0,
      expiresAt || null,
      isActive === false ? 0 : 1,
      now
    );

    const created = db.prepare('SELECT * FROM discounts WHERE id = ?').get(id);
    res.json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create discount', details: error.message });
  }
});

// ==========================================
// 6. VITE DEV SERVER / STATIC ASSET MOUNT
// ==========================================

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AVEART South African Fashion Platform active on http://0.0.0.0:${PORT} (Currency: ZAR)`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
