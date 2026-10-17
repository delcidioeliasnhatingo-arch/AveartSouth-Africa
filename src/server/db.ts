import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'aveart.db');
export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      phone TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      street TEXT NOT NULL,
      apartment TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      country TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      gender TEXT NOT NULL DEFAULT 'unisex', -- 'women', 'men', 'unisex'
      description TEXT,
      image_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'unisex', -- 'women', 'men', 'unisex'
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      subtitle TEXT,
      description TEXT NOT NULL,
      material TEXT NOT NULL,
      dimensions TEXT,
      artisan TEXT NOT NULL,
      provenance TEXT NOT NULL,
      care_instructions TEXT,
      base_price REAL NOT NULL, -- in ZAR (R)
      original_price REAL, -- for genuine sales in ZAR
      sizes_json TEXT, -- array of sizes ['XS', 'S', 'M', 'L', 'XL']
      colors_json TEXT, -- array of objects [{ name, hex }]
      tags_json TEXT, -- array of strings ['tailored', 'linen', 'complete_look:trousers']
      is_published INTEGER NOT NULL DEFAULT 1,
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_on_sale INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      size TEXT,
      color TEXT,
      finish TEXT,
      price_offset REAL NOT NULL DEFAULT 0.0,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 3,
      image_url TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventory_logs (
      id TEXT PRIMARY KEY,
      variant_id TEXT NOT NULL,
      change_quantity INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reference_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS discounts (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_percent REAL,
      fixed_amount REAL,
      min_order_value REAL NOT NULL DEFAULT 0.0,
      expires_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      user_id TEXT,
      customer_email TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      shipping_street TEXT NOT NULL,
      shipping_apartment TEXT,
      shipping_city TEXT NOT NULL,
      shipping_state TEXT NOT NULL,
      shipping_postal_code TEXT NOT NULL,
      shipping_country TEXT NOT NULL,
      shipping_method TEXT NOT NULL,
      payment_provider TEXT NOT NULL DEFAULT 'debito_pay',
      status TEXT NOT NULL DEFAULT 'pending_payment',
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      payment_intent_id TEXT,
      subtotal REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0.0,
      discount_code TEXT,
      shipping_amount REAL NOT NULL,
      tax_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      tracking_number TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      variant_id TEXT NOT NULL,
      product_title TEXT NOT NULL,
      variant_name TEXT NOT NULL,
      size TEXT,
      color TEXT,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      line_total REAL NOT NULL,
      image_url TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS webhook_events (
      id TEXT PRIMARY KEY,
      event_id TEXT UNIQUE NOT NULL,
      provider TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      signature TEXT,
      status TEXT NOT NULL,
      processed_at TEXT NOT NULL
    );
  `);

  applyFashionMigrationAndSeed();
}

// Scrypt password hashing
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

function applyFashionMigrationAndSeed() {
  const migrationCheck = db.prepare("SELECT COUNT(*) as count FROM _migrations WHERE name = 'fashion_zar_south_africa_v2'").get() as { count: number };
  if (migrationCheck.count > 0) return;

  console.log('Seeding AVEART South African ZAR fashion catalogue for Women, Men & Accessories (v2)...');

  // Recreate tables cleanly to guarantee schema columns (gender, sizes_json, colors_json, etc.)
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec(`
    DROP TABLE IF EXISTS inventory_logs;
    DROP TABLE IF EXISTS order_items;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS product_variants;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS addresses;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS discounts;
    DROP TABLE IF EXISTS webhook_events;

    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      phone TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      street TEXT NOT NULL,
      apartment TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      country TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      gender TEXT NOT NULL DEFAULT 'unisex', -- 'women', 'men', 'unisex'
      description TEXT,
      image_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'unisex', -- 'women', 'men', 'unisex'
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      subtitle TEXT,
      description TEXT NOT NULL,
      material TEXT NOT NULL,
      dimensions TEXT,
      artisan TEXT NOT NULL,
      provenance TEXT NOT NULL,
      care_instructions TEXT,
      base_price REAL NOT NULL, -- in ZAR (R)
      original_price REAL, -- for genuine sales in ZAR
      sizes_json TEXT, -- array of sizes ['XS', 'S', 'M', 'L', 'XL']
      colors_json TEXT, -- array of objects [{ name, hex }]
      tags_json TEXT, -- array of strings ['tailored', 'linen', 'complete_look:trousers']
      is_published INTEGER NOT NULL DEFAULT 1,
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_on_sale INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE TABLE product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      size TEXT,
      color TEXT,
      finish TEXT,
      price_offset REAL NOT NULL DEFAULT 0.0,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 3,
      image_url TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE inventory_logs (
      id TEXT PRIMARY KEY,
      variant_id TEXT NOT NULL,
      change_quantity INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reference_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
    );

    CREATE TABLE discounts (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_percent REAL,
      fixed_amount REAL,
      min_order_value REAL NOT NULL DEFAULT 0.0,
      expires_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      user_id TEXT,
      customer_email TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      shipping_street TEXT NOT NULL,
      shipping_apartment TEXT,
      shipping_city TEXT NOT NULL,
      shipping_state TEXT NOT NULL,
      shipping_postal_code TEXT NOT NULL,
      shipping_country TEXT NOT NULL,
      shipping_method TEXT NOT NULL,
      payment_provider TEXT NOT NULL DEFAULT 'debito_pay',
      status TEXT NOT NULL DEFAULT 'pending_payment',
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      payment_intent_id TEXT,
      subtotal REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0.0,
      discount_code TEXT,
      shipping_amount REAL NOT NULL,
      tax_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      tracking_number TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      variant_id TEXT NOT NULL,
      product_title TEXT NOT NULL,
      variant_name TEXT NOT NULL,
      size TEXT,
      color TEXT,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      line_total REAL NOT NULL,
      image_url TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE webhook_events (
      id TEXT PRIMARY KEY,
      event_id TEXT UNIQUE NOT NULL,
      provider TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      signature TEXT,
      status TEXT NOT NULL,
      processed_at TEXT NOT NULL
    );
  `);
  db.exec('PRAGMA foreign_keys = ON;');

  const now = new Date().toISOString();

  // Seed Users
  const adminId = crypto.randomUUID();
  const curatorId = crypto.randomUUID();
  const customerId = crypto.randomUUID();

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, phone, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    adminId,
    'admin@aveart.design',
    hashPassword('AveartAdmin2026!'),
    'Elena Vance-Smythe (Director)',
    'admin',
    '+27 (0) 21 424 8900',
    now
  );

  insertUser.run(
    curatorId,
    'curator@aveart.design',
    hashPassword('Curator2026!'),
    'Thabo Mokoena (Head of Fashion)',
    'store_manager',
    '+27 (0) 21 424 8901',
    now
  );

  insertUser.run(
    customerId,
    'collector@aveart.design',
    hashPassword('Collector2026!'),
    'Zola Dlamini',
    'customer',
    '+27 (0) 82 555 4190',
    now
  );

  // Seed default address for customer in South Africa
  db.prepare(`
    INSERT INTO addresses (id, user_id, recipient_name, street, apartment, city, state, postal_code, country, is_default, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    crypto.randomUUID(),
    customerId,
    'Zola Dlamini',
    '14 Kloof Street',
    'Suite 402, Tamboerskloof',
    'Cape Town',
    'Western Cape',
    '8001',
    'South Africa',
    now
  );

  // Seed Categories
  const catWomenBlazers = crypto.randomUUID();
  const catWomenDresses = crypto.randomUUID();
  const catWomenTrousers = crypto.randomUUID();
  const catWomenShirts = crypto.randomUUID();
  const catWomenKnitwear = crypto.randomUUID();
  const catWomenSkirts = crypto.randomUUID();

  const catMenJackets = crypto.randomUUID();
  const catMenJeans = crypto.randomUUID();
  const catMenTees = crypto.randomUUID();
  const catMenBlazers = crypto.randomUUID();
  const catMenSweaters = crypto.randomUUID();

  const catAccessories = crypto.randomUUID();

  const insertCat = db.prepare(`
    INSERT INTO categories (id, name, slug, gender, description, image_url, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertCat.run(
    catWomenBlazers,
    'Blazers & Jackets',
    'women-blazers',
    'women',
    'Precision-tailored double-breasted blazers in breathable pure European and African linen.',
    '/src/assets/images/fashion_women_linen_blazer_1792263530901.jpg',
    1
  );

  insertCat.run(
    catWomenDresses,
    'Dresses & Gowns',
    'women-dresses',
    'women',
    'Minimalist column silhouettes in ribbed raw silk, fine gauge merino, and certified organic modal.',
    '/src/assets/images/fashion_women_silk_midi_dress_1792263530827.jpg',
    2
  );

  insertCat.run(
    catWomenTrousers,
    'Trousers & Tailoring',
    'women-trousers',
    'women',
    'High-waisted double-pleated wide-leg trousers designed for timeless architectural drape.',
    '/src/assets/images/fashion_women_wide_trousers_1792263531620.jpg',
    3
  );

  insertCat.run(
    catWomenShirts,
    'Shirts & Blouses',
    'women-shirts',
    'women',
    'Crisp poplin and fluid silk shirting with sculptural cuffs and clean concealed plackets.',
    '/src/assets/images/fashion_women_poplin_shirt_1792264035212.jpg',
    4
  );

  insertCat.run(
    catWomenKnitwear,
    'Sweaters & Cardigans',
    'women-knitwear',
    'women',
    'Sumptuous brushed cashmere and alpaca knits with horn button detailing and relaxed dropped sleeves.',
    '/src/assets/images/fashion_women_cashmere_cardigan_1792264035828.jpg',
    5
  );

  insertCat.run(
    catWomenSkirts,
    'Skirts & Sets',
    'women-skirts',
    'women',
    'Bias-cut mulberry silk satin skirts designed for effortless fluid movement from day to dusk.',
    '/src/assets/images/fashion_women_satin_skirt_1792264076928.jpg',
    6
  );

  insertCat.run(
    catMenJackets,
    'Overshirts & Outerwear',
    'men-jackets',
    'men',
    'Relaxed heavy-gauge wool and moleskin overshirts with horn button closures and functional utility pockets.',
    '/src/assets/images/fashion_men_wool_overshirt_1792263531608.jpg',
    7
  );

  insertCat.run(
    catMenJeans,
    'Jeans & Denim',
    'men-jeans',
    'men',
    'Shuttle-loom Japanese and African selvedge denim in raw indigo with classic straight-leg cut.',
    '/src/assets/images/fashion_men_selvedge_jeans_1792263532797.jpg',
    8
  );

  insertCat.run(
    catMenTees,
    'T-Shirts & Essentials',
    'men-tshirts',
    'men',
    '300gsm heavyweight organic combed cotton boxy crewnecks built for permanent drape.',
    '/src/assets/images/fashion_men_heavyweight_tee_1792263547026.jpg',
    9
  );

  insertCat.run(
    catMenBlazers,
    'Blazers & Tailoring',
    'men-blazers',
    'men',
    'Unconstructed lightweight hopsack wool travel blazers tailored for understated sophistication.',
    '/src/assets/images/fashion_men_tailored_blazer_1792264035958.jpg',
    10
  );

  insertCat.run(
    catMenSweaters,
    'Sweaters & Cardigans',
    'men-sweaters',
    'men',
    'Extra-fine 18-gauge merino wool crewneck sweaters with hand-linked neckbands and ribbed trims.',
    '/src/assets/images/fashion_men_merino_sweater_1792264036560.jpg',
    11
  );

  insertCat.run(
    catAccessories,
    'Leather Goods & Accessories',
    'accessories',
    'unisex',
    'Vegetable-tanned full-grain leather bags, brass jewelry, and artisan essentials.',
    '/src/assets/images/fashion_acc_leather_tote_1792263547555.jpg',
    12
  );

  // Product Insertion Helper
  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, category_id, gender, title, slug, subtitle, description,
      material, dimensions, artisan, provenance, care_instructions,
      base_price, original_price, sizes_json, colors_json, tags_json,
      is_published, is_featured, is_on_sale, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVariant = db.prepare(`
    INSERT INTO product_variants (
      id, product_id, sku, name, size, color, finish, price_offset, stock_quantity, low_stock_threshold, image_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLog = db.prepare(`
    INSERT INTO inventory_logs (
      id, variant_id, change_quantity, balance_after, reason, reference_id, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, null, ?, ?)
  `);

  // ==========================================
  // WOMEN'S PRODUCTS (6 distinct pieces)
  // ==========================================

  // Product W1: Tailored Linen Blazer
  const pW1 = crypto.randomUUID();
  insertProduct.run(
    pW1,
    catWomenBlazers,
    'women',
    'Tailored Double-Breasted Linen Blazer',
    'tailored-double-breasted-linen-blazer',
    'Oversized Relaxed Silhouette · Pure Flax Linen',
    'Hand-tailored from unbleached 280gsm pure flax linen with subtle shoulder structure, peak lapels, and double horn-button fastening. Cut for a relaxed, contemporary drape that transitions effortlessly between gallery visits and summer evenings in Cape Town.',
    '100% Pure Flax Linen, Cupro Bemberg lining',
    'Relaxed oversized fit; true to size',
    'AVEART Atelier Couture',
    'Cape Town & Paris',
    'Dry clean only. Hang on wide cedar wooden hanger.',
    3450.0, // ZAR
    null,
    JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
    JSON.stringify([
      { name: 'Oatmeal Natural', hex: '#D7CFBE' },
      { name: 'Obsidian Black', hex: '#1C1C1C' },
    ]),
    JSON.stringify(['Blazers', 'Tailored', 'Linen', 'Summer', 'complementary:women-trousers', 'complementary:women-shirts', 'complementary:accessories']),
    1,
    1,
    0,
    now
  );

  ['XS', 'S', 'M', 'L'].forEach((sz, idx) => {
    const vId = crypto.randomUUID();
    const stock = 5 - (idx === 3 ? 2 : 0);
    insertVariant.run(
      vId,
      pW1,
      `AVE-BLZ-OAT-${sz}`,
      `Oatmeal Natural · Size ${sz}`,
      sz,
      'Oatmeal Natural',
      'Matte Unbleached Linen',
      0.0,
      stock,
      2,
      '/src/assets/images/fashion_women_linen_blazer_1792263530901.jpg',
      now
    );
    insertLog.run(crypto.randomUUID(), vId, stock, stock, 'initial', 'Atelier release', now);
  });

  // Product W2: Ribbed Silk-Knit Midi Column Dress
  const pW2 = crypto.randomUUID();
  insertProduct.run(
    pW2,
    catWomenDresses,
    'women',
    'Ribbed Silk-Knit Midi Column Dress',
    'ribbed-silk-knit-midi-column-dress',
    'Continuous Ribbed Knit · Rich Terracotta Hue',
    'Seamlessly knitted on circular looms using fine Italian mulberry silk spun with organic Pima cotton. Hugs the silhouette gently without clinging, ending in a clean calf-grazing hem with subtle raw-edge finish.',
    '70% Mulberry Silk, 30% Long-Staple Pima Cotton',
    'Slim architectural column fit with natural stretch',
    'Karras Knitwear Guild',
    'Johannesburg & Milan',
    'Hand wash cold with wool/silk detergent; lay flat to dry in shade.',
    2890.0, // ZAR (Sale price)
    3400.0, // Original price
    JSON.stringify(['XS', 'S', 'M', 'L']),
    JSON.stringify([
      { name: 'Earthy Terracotta', hex: '#B85D36' },
      { name: 'Chalk Ivory', hex: '#F0ECE4' },
    ]),
    JSON.stringify(['Dresses', 'Silk', 'Knitwear', 'Sale', 'complementary:accessories', 'complementary:women-blazers', 'complementary:women-knitwear']),
    1,
    1,
    1,
    now
  );

  ['XS', 'S', 'M', 'L'].forEach((sz, idx) => {
    const vId = crypto.randomUUID();
    const stock = 6 - idx;
    insertVariant.run(
      vId,
      pW2,
      `AVE-DRS-TER-${sz}`,
      `Earthy Terracotta · Size ${sz}`,
      sz,
      'Earthy Terracotta',
      'Fine Gauge Silk Rib',
      0.0,
      stock,
      2,
      '/src/assets/images/fashion_women_silk_midi_dress_1792263530827.jpg',
      now
    );
    insertLog.run(crypto.randomUUID(), vId, stock, stock, 'initial', 'Kiln collection', now);
  });

  // Product W3: High-Waisted Pleated Wide Trousers
  const pW3 = crypto.randomUUID();
  insertProduct.run(
    pW3,
    catWomenTrousers,
    'women',
    'High-Waisted Pleated Wide Trousers',
    'high-waisted-pleated-wide-trousers',
    'Double Forward Pleats · Sand Ecru Wool Blend',
    'Cut from lightweight tropical virgin wool with a generous high rise, double forward deep pleats, and wide fluid legs. Features an extended tab waistband with hidden Corozo buttons and side-seam pockets.',
    '85% Virgin Wool, 15% Mulberry Silk',
    'High rise, wide leg with 32" inseam (alterable cuff)',
    'Savile Row Sartorial Guild',
    'Cape Town & Florence',
    'Specialist dry clean only. Warm steam press.',
    2450.0, // ZAR
    null,
    JSON.stringify(['30', '32', '34', '36', '38']),
    JSON.stringify([
      { name: 'Sand Ecru', hex: '#E2DBD0' },
      { name: 'Charcoal Basalt', hex: '#2A2928' },
    ]),
    JSON.stringify(['Trousers', 'Tailored', 'Wool', 'complementary:women-blazers', 'complementary:women-shirts', 'complementary:accessories']),
    1,
    1,
    0,
    now
  );

  ['30', '32', '34', '36'].forEach((sz, idx) => {
    const vId = crypto.randomUUID();
    const stock = 6 - idx;
    insertVariant.run(
      vId,
      pW3,
      `AVE-TRS-ECR-${sz}`,
      `Sand Ecru · Waist ${sz}`,
      sz,
      'Sand Ecru',
      'Tropical Wool Weave',
      0.0,
      stock,
      2,
      '/src/assets/images/fashion_women_wide_trousers_1792263531620.jpg',
      now
    );
    insertLog.run(crypto.randomUUID(), vId, stock, stock, 'initial', 'Studio collection', now);
  });

  // Product W4: Crisp Poplin Oversized Shirt
  const pW4 = crypto.randomUUID();
  insertProduct.run(
    pW4,
    catWomenShirts,
    'women',
    'Architectural Crisp Cotton Poplin Shirt',
    'architectural-crisp-cotton-poplin-shirt',
    'Extended Cuffs · Chalk White 120-Thread Poplin',
    'Woven from fine 120/2 double-twist Egyptian cotton poplin with a paper-crisp handfeel. Designed with sculpted elongated French cuffs, a curved high-low shirttail hem, and mother-of-pearl buttons.',
    '100% Giza Long-Staple Cotton Poplin',
    'Oversized boyfriend cut with dropped shoulders',
    'Vance-Smythe Shirting Studio',
    'Cape Town & Zurich',
    'Machine wash cold gentle cycle. Warm iron or steam while slightly damp.',
    1850.0, // ZAR
    null,
    JSON.stringify(['XS', 'S', 'M', 'L']),
    JSON.stringify([
      { name: 'Chalk White', hex: '#FAF9F6' },
      { name: 'Sky Stripe', hex: '#C4D4E0' },
    ]),
    JSON.stringify(['Shirts', 'Poplin', 'Tops', 'Basics', 'complementary:women-trousers', 'complementary:women-blazers', 'complementary:women-skirts']),
    1,
    1,
    0,
    now
  );

  ['XS', 'S', 'M', 'L'].forEach((sz, idx) => {
    const vId = crypto.randomUUID();
    const stock = 7 - idx;
    insertVariant.run(
      vId,
      pW4,
      `AVE-SHT-WHT-${sz}`,
      `Chalk White · Size ${sz}`,
      sz,
      'Chalk White',
      'Paper-Crisp Poplin',
      0.0,
      stock,
      3,
      '/src/assets/images/fashion_women_poplin_shirt_1792264035212.jpg',
      now
    );
    insertLog.run(crypto.randomUUID(), vId, stock, stock, 'initial', 'Spring delivery', now);
  });

  // Product W5: Brushed Cashmere Ribbed Cardigan
  const pW5 = crypto.randomUUID();
  insertProduct.run(
    pW5,
    catWomenKnitwear,
    'women',
    'Brushed Mongolian Cashmere Cardigan',
    'brushed-mongolian-cashmere-cardigan',
    'Chunky Rib Knit · Natural Oatmeal Hue',
    'Spun from grade-A Mongolian cashmere blended with ultrafine South African merino wool. Hand-finished with chunky ribbed plackets, genuine carved horn buttons, and deep raglan sleeves.',
    '70% Mongolian Cashmere, 30% Fine Merino Wool',
    'Relaxed boxy cut; sits at the hip',
    'Highveld Knitwear Guild',
    'Stellenbosch & Ulaanbaatar',
    'Hand wash cold inside out with cashmere shampoo; dry flat on towel.',
    3800.0, // ZAR
    null,
    JSON.stringify(['XS', 'S', 'M', 'L']),
    JSON.stringify([
      { name: 'Natural Oatmeal', hex: '#D8CCA3' },
      { name: 'Charcoal Heather', hex: '#3E3E3E' },
    ]),
    JSON.stringify(['Sweaters', 'Cardigans', 'Cashmere', 'Knitwear', 'complementary:women-skirts', 'complementary:women-trousers', 'complementary:accessories']),
    1,
    1,
    0,
    now
  );

  ['XS', 'S', 'M', 'L'].forEach((sz, idx) => {
    const vId = crypto.randomUUID();
    const stock = 4 - (idx === 3 ? 2 : 0);
    insertVariant.run(
      vId,
      pW5,
      `AVE-CRD-OAT-${sz}`,
      `Natural Oatmeal · Size ${sz}`,
      sz,
      'Natural Oatmeal',
      'Brushed Cashmere Rib',
      0.0,
      stock,
      2,
      '/src/assets/images/fashion_women_cashmere_cardigan_1792264035828.jpg',
      now
    );
    insertLog.run(crypto.randomUUID(), vId, stock, stock, 'initial', 'Winter knit intake', now);
  });

  // Product W6: Bias-Cut Fluid Mulberry Satin Skirt
  const pW6 = crypto.randomUUID();
  insertProduct.run(
    pW6,
    catWomenSkirts,
    'women',
    'Bias-Cut Mulberry Silk Satin Midi Skirt',
    'bias-cut-mulberry-silk-satin-midi-skirt',
    'Fluid Silhouette · Champagne Gold Lustre',
    'Crafted from heavyweight 22-momme pure mulberry silk cut on the bias to hug the hips and fall into a gentle, fluid fluted hemline. Finished with a discrete elasticated waist facing and baby-rolled hem.',
    '100% Pure Mulberry Silk Satin (22 Momme)',
    'Mid-calf length; bias cut stretches naturally to your form',
    'AVEART Atelier Couture',
    'Cape Town & Lyon',
    'Delicate hand wash cold or green dry clean. Steam iron on reverse.',
    2600.0, // ZAR
    null,
    JSON.stringify(['XS', 'S', 'M', 'L']),
    JSON.stringify([
      { name: 'Champagne Gold', hex: '#D9C8A5' },
      { name: 'Onyx Black', hex: '#111111' },
    ]),
    JSON.stringify(['Skirts', 'Silk', 'Satin', 'Dresses', 'complementary:women-knitwear', 'complementary:women-shirts', 'complementary:women-blazers']),
    1,
    0,
    0,
    now
  );

  ['XS', 'S', 'M', 'L'].forEach((sz, idx) => {
    const vId = crypto.randomUUID();
    const stock = 5 - idx;
    insertVariant.run(
      vId,
      pW6,
      `AVE-SKT-GLD-${sz}`,
      `Champagne Gold · Size ${sz}`,
      sz,
      'Champagne Gold',
      '22 Momme Silk Satin',
      0.0,
      stock,
      2,
      '/src/assets/images/fashion_women_satin_skirt_1792264076928.jpg',
      now
    );
    insertLog.run(crypto.randomUUID(), vId, stock, stock, 'initial', 'Atelier intake', now);
  });

  // ==========================================
  // MEN'S PRODUCTS (5 distinct pieces)
  // ==========================================

  // Product M1: Melange Wool Workwear Overshirt
  const pM1 = crypto.randomUUID();
  insertProduct.run(
    pM1,
    catMenJackets,
    'men',
    'Melange Wool Workwear Overshirt',
    'melange-wool-workwear-overshirt',
    'Heavyweight 360gsm Boiled Wool · Charcoal Heather',
    'A versatile trans-seasonal layering piece constructed from dense, water-repellent felted wool melange. Features dual chest patch pockets with flap closures, natural tortoiseshell buttons, and reinforced split yoke.',
    '100% Non-Mulesed Merino Wool',
    'Boxy relaxed fit for effortless layering over tees or knits',
    'Nordic Craft Wool Guild',
    'Cape Town & Copenhagen',
    'Spot clean with cool water. Professional dry clean when needed.',
    2650.0, // ZAR
    null,
    JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
    JSON.stringify([
      { name: 'Charcoal Heather', hex: '#3B3B3B' },
      { name: 'Deep Navy', hex: '#1B2432' },
    ]),
    JSON.stringify(['Jackets', 'Overshirt', 'Wool', 'Menswear', 'complementary:men-jeans', 'complementary:men-tshirts', 'complementary:accessories']),
    1,
    1,
    0,
    now
  );

  ['S', 'M', 'L', 'XL'].forEach((sz, idx) => {
    const vId = crypto.randomUUID();
    const stock = 5 - (idx === 3 ? 3 : 0);
    insertVariant.run(
      vId,
      pM1,
      `AVE-OVR-CHR-${sz}`,
      `Charcoal Heather · Size ${sz}`,
      sz,
      'Charcoal Heather',
      'Felted Wool Melange',
      0.0,
      stock,
      2,
      '/src/assets/images/fashion_men_wool_overshirt_1792263531608.jpg',
      now
    );
    insertLog.run(crypto.randomUUID(), vId, stock, stock, 'initial', 'Winter release', now);
  });

  // Product M2: Japanese Kuroki Selvedge Straight Jeans
  const pM2 = crypto.randomUUID();
  insertProduct.run(
    pM2,
    catMenJeans,
    'men',
    'Japanese Kuroki Selvedge Straight Jeans',
    'japanese-kuroki-selvedge-straight-jeans',
    '14.5oz Raw Indigo Denim · Red Selvedge ID Line',
    'Woven on vintage Toyoda shuttle looms in Okayama from Zimbabwe long-staple cotton and rope-dyed in pure natural indigo. Cut with a medium rise and classic straight leg that breaks perfectly over boots or loafers. Will mold and fade with your personal patina over years of wear.',
    '100% Long-Staple Cotton, 14.5oz Raw Selvedge Denim',
    'Classic straight leg, 34" standard inseam',
    'Kuroki Mills & AVEART Workshop',
    'Okayama & Cape Town',
    'Wear raw for 6+ months before first cold soak. Wash inside-out.',
    2250.0, // ZAR
    null,
    JSON.stringify(['30', '32', '34', '36']),
    JSON.stringify([
      { name: 'Raw Deep Indigo', hex: '#16233B' },
    ]),
    JSON.stringify(['Jeans', 'Denim', 'Selvedge', 'Menswear', 'complementary:men-jackets', 'complementary:men-tshirts', 'complementary:men-sweaters']),
    1,
    1,
    0,
    now
  );

  ['30', '32', '34', '36'].forEach((sz, idx) => {
    const vId = crypto.randomUUID();
    const stock = 6 - idx;
    insertVariant.run(
      vId,
      pM2,
      `AVE-JNS-IND-${sz}`,
      `Raw Deep Indigo · Waist ${sz}`,
      sz,
      'Raw Deep Indigo',
      '14.5oz Unwashed Selvedge',
      0.0,
      stock,
      2,
      '/src/assets/images/fashion_men_selvedge_jeans_1792263532797.jpg',
      now
    );
    insertLog.run(crypto.randomUUID(), vId, stock, stock, 'initial', 'Shuttle batch', now);
  });

  // Product M3: Heavyweight Organic Cotton Boxy Tee
  const pM3 = crypto.randomUUID();
  insertProduct.run(
    pM3,
    catMenTees,
    'men',
    'Heavyweight Organic Cotton Boxy Tee',
    'heavyweight-organic-cotton-boxy-tee',
    '300gsm Pre-Shrunk Combed Cotton · Chalk White',
    'Constructed from substantial 300gsm organic combed cotton jersey with a structured 1" ribbed collar and dropped shoulders. Double-needle coverstitching throughout ensures the collar never sags or rolls through repeated laundering.',
    '100% GOTS-Certified Organic Combed Cotton (300gsm)',
    'Boxy relaxed drop-shoulder fit',
    'AVEART Studio Basics',
    'Cape Town, South Africa',
    'Machine wash cold with like colours. Hang dry to preserve fabric density.',
    650.0, // ZAR
    null,
    JSON.stringify(['S', 'M', 'L', 'XL']),
    JSON.stringify([
      { name: 'Chalk White', hex: '#F9F8F6' },
      { name: 'Washed Black', hex: '#262626' },
    ]),
    JSON.stringify(['T-Shirts', 'Basics', 'Cotton', 'Menswear', 'Unisex', 'complementary:men-jeans', 'complementary:men-jackets', 'complementary:men-blazers']),
    1,
    1,
    0,
    now
  );

  ['S', 'M', 'L', 'XL'].forEach((sz, idx) => {
    const vId = crypto.randomUUID();
    const stock = 10 - idx;
    insertVariant.run(
      vId,
      pM3,
      `AVE-TEE-WHT-${sz}`,
      `Chalk White · Size ${sz}`,
      sz,
      'Chalk White',
      '300gsm Combed Jersey',
      0.0,
      stock,
      3,
      '/src/assets/images/fashion_men_heavyweight_tee_1792263547026.jpg',
      now
    );
    insertLog.run(crypto.randomUUID(), vId, stock, stock, 'initial', 'Basics batch', now);
  });

  // Product M4: Unconstructed Wool Hopsack Travel Blazer
  const pM4 = crypto.randomUUID();
  insertProduct.run(
    pM4,
    catMenBlazers,
    'men',
    'Unconstructed Wool Hopsack Travel Blazer',
    'unconstructed-wool-hopsack-travel-blazer',
    'Breathable Open-Weave Wool · Midnight Navy',
    'Tailored without internal canvas or padding for total natural ease and breathability. Woven from high-twist 280gsm wool hopsack that naturally resists creasing during long flights or commutes. Features patch hip pockets and dual back vents.',
    '100% High-Twist Tropical Wool Hopsack (Vitale Barberis Canonico)',
    'Contemporary tailored fit with natural shoulder line',
    'Vance-Smythe Sartorial',
    'Biella & Cape Town',
    'Professional dry clean only. Steam refresh between wears.',
    3850.0, // ZAR
    null,
    JSON.stringify(['38R', '40R', '42R', '44R']),
    JSON.stringify([
      { name: 'Midnight Navy', hex: '#121B2D' },
      { name: 'Charcoal Grey', hex: '#2B2D2F' },
    ]),
    JSON.stringify(['Blazers', 'Suits', 'Tailoring', 'Menswear', 'complementary:men-jeans', 'complementary:men-tshirts', 'complementary:accessories']),
    1,
    1,
    0,
    now
  );

  ['38R', '40R', '42R', '44R'].forEach((sz, idx) => {
    const vId = crypto.randomUUID();
    const stock = 4 - (idx === 3 ? 2 : 0);
    insertVariant.run(
      vId,
      pM4,
      `AVE-BLZ-NAV-${sz}`,
      `Midnight Navy · Size ${sz}`,
      sz,
      'Midnight Navy',
      'Open Weave Hopsack',
      0.0,
      stock,
      2,
      '/src/assets/images/fashion_men_tailored_blazer_1792264035958.jpg',
      now
    );
    insertLog.run(crypto.randomUUID(), vId, stock, stock, 'initial', 'Sartorial intake', now);
  });

  // Product M5: Fine Merino Wool Crewneck Knit
  const pM5 = crypto.randomUUID();
  insertProduct.run(
    pM5,
    catMenSweaters,
    'men',
    'Fine-Gauge Extra-Fine Merino Crewneck',
    'fine-gauge-merino-crewneck-sweater',
    '18-Gauge Australian Merino · Camel Tobacco',
    'Knitted from extra-fine 19.5-micron combed merino wool yarn. Lightweight yet thermal regulating, perfect as an insulating layer over tees or beneath tailoring. Finished with ribbed micro-cuffs and tubular hem.',
    '100% Pure Extra-Fine Australian Merino Wool',
    'Tailored slim-straight fit',
    'Karras Knitwear Guild',
    'Port Elizabeth & Milan',
    'Hand wash cold with approved wool detergent; flat dry on mesh.',
    1750.0, // ZAR
    null,
    JSON.stringify(['S', 'M', 'L', 'XL']),
    JSON.stringify([
      { name: 'Camel Tobacco', hex: '#9E6D38' },
      { name: 'Basalt Charcoal', hex: '#282828' },
    ]),
    JSON.stringify(['Sweaters', 'Knitwear', 'Merino', 'Menswear', 'complementary:men-jeans', 'complementary:men-blazers', 'complementary:men-jackets']),
    1,
    0,
    0,
    now
  );

  ['S', 'M', 'L', 'XL'].forEach((sz, idx) => {
    const vId = crypto.randomUUID();
    const stock = 6 - idx;
    insertVariant.run(
      vId,
      pM5,
      `AVE-SWT-CAM-${sz}`,
      `Camel Tobacco · Size ${sz}`,
      sz,
      'Camel Tobacco',
      '18-Gauge Fine Merino',
      0.0,
      stock,
      2,
      '/src/assets/images/fashion_men_merino_sweater_1792264036560.jpg',
      now
    );
    insertLog.run(crypto.randomUUID(), vId, stock, stock, 'initial', 'Merino intake', now);
  });

  // ==========================================
  // UNISEX ACCESSORIES (2 distinct heirloom items)
  // ==========================================

  // Product U1: Architectural Pebbled Leather Shopper Tote
  const pU1 = crypto.randomUUID();
  insertProduct.run(
    pU1,
    catAccessories,
    'unisex',
    'Architectural Pebbled Leather Shopper Tote',
    'architectural-pebbled-leather-shopper-tote',
    'Full-Grain Tuscan Calfskin · Solid Cast Brass Rings',
    'Individually handcrafted from vegetable-tanned full-grain pebbled calfskin. Features reinforced dual top handles, detachable crossbody strap, raw suede interior, and an interior zippered compartment suited for up to 16" laptops.',
    'Full-Grain Vegetable-Tanned Italian Leather, Solid Antiqued Brass Hardware',
    'H 38cm × W 34cm × D 12cm (Handle drop 14cm)',
    'Vance-Smythe Leather Atelier',
    'Cape Town & Florence',
    'Treat periodically with organic beeswax leather balm. Store in canvas dust bag.',
    3200.0, // ZAR
    null,
    JSON.stringify(['One Size']),
    JSON.stringify([
      { name: 'Onyx Black', hex: '#111111' },
      { name: 'Rich Cognac', hex: '#824823' },
    ]),
    JSON.stringify(['Accessories', 'Leather', 'Bags', 'Unisex', 'complementary:women-blazers', 'complementary:men-jackets', 'complementary:women-dresses']),
    1,
    1,
    0,
    now
  );

  const vU1 = crypto.randomUUID();
  insertVariant.run(
    vU1,
    pU1,
    'AVE-BAG-TOT-BLK',
    'Onyx Black · One Size',
    'One Size',
    'Onyx Black',
    'Pebbled Full-Grain Calfskin',
    0.0,
    6,
    2,
    '/src/assets/images/fashion_acc_leather_tote_1792263547555.jpg',
    now
  );
  insertLog.run(crypto.randomUUID(), vU1, 6, 6, 'initial', 'Saddlery intake', now);

  // Product U2: Sculptural Solid Brass Cuff & Signet Ring Set
  const pU2 = crypto.randomUUID();
  insertProduct.run(
    pU2,
    catAccessories,
    'unisex',
    'Hand-Hammered Raw Brass Cuff & Signet Set',
    'hand-hammered-raw-brass-cuff-signet-set',
    'Solid Sand-Cast Brass · Tactile Chiseled Surface',
    'Cast in Cape Town using traditional sand molds, then hand-hammered to achieve a unique organic chiseled texture. The raw brass develops an exquisite natural living patina with everyday skin contact, or can be polished bright with lemon oil.',
    '100% Solid Recycled Marine-Grade Brass',
    'Cuff: 65mm diameter (adjustable flex); Ring: Size 8 (18.2mm inner dia)',
    'Karoo Metal Artisans',
    'Nieu-Bethesda, South Africa',
    'Wipe with soft cotton cloth. Buff periodically with natural brass polish.',
    1150.0, // ZAR
    null,
    JSON.stringify(['Standard Set']),
    JSON.stringify([
      { name: 'Warm Antique Brass', hex: '#C5A059' },
    ]),
    JSON.stringify(['Accessories', 'Jewelry', 'Brass', 'Unisex', 'complementary:women-dresses', 'complementary:women-blazers', 'complementary:men-blazers']),
    1,
    1,
    0,
    now
  );

  const vU2 = crypto.randomUUID();
  insertVariant.run(
    vU2,
    pU2,
    'AVE-JWL-CUF-BRS',
    'Warm Antique Brass · Standard Set',
    'Standard Set',
    'Warm Antique Brass',
    'Hand-Hammered Living Patina',
    0.0,
    8,
    3,
    '/src/assets/images/fashion_acc_brass_cuff_1792264076879.jpg',
    now
  );
  insertLog.run(crypto.randomUUID(), vU2, 8, 8, 'initial', 'Foundry casting', now);

  // Seed Discounts in ZAR
  const insertDiscount = db.prepare(`
    INSERT INTO discounts (id, code, discount_percent, fixed_amount, min_order_value, expires_at, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDiscount.run(crypto.randomUUID(), 'AVEART10', 10.0, 0, 1000.0, '2027-12-31T23:59:59Z', 1, now);
  insertDiscount.run(crypto.randomUUID(), 'FASHION15', 15.0, 0, 2500.0, '2027-12-31T23:59:59Z', 1, now);
  insertDiscount.run(crypto.randomUUID(), 'CAPETOWN300', 0, 300.0, 3000.0, '2027-12-31T23:59:59Z', 1, now);

  // Seed Completed Sample Order in ZAR
  const order1Id = crypto.randomUUID();
  const orderNumber = 'AVE-ZA-8910';
  db.prepare(`
    INSERT INTO orders (
      id, order_number, user_id, customer_email, customer_name, customer_phone,
      shipping_street, shipping_apartment, shipping_city, shipping_state, shipping_postal_code, shipping_country,
      shipping_method, payment_provider, status, payment_status, payment_intent_id,
      subtotal, discount_amount, discount_code, shipping_amount, tax_amount, total_amount,
      tracking_number, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'standard_curated', 'debito_pay', 'delivered', 'succeeded', 'debito_txn_8910', ?, 0, null, 0, 433.50, 3323.50, 'AVE-ZA-RAM-9042', 'Leave with 24-hr concierge at Tamboerskloof reception', ?, ?)
  `).run(
    order1Id,
    orderNumber,
    customerId,
    'collector@aveart.design',
    'Zola Dlamini',
    '+27 (0) 82 555 4190',
    '14 Kloof Street',
    'Suite 402, Tamboerskloof',
    'Cape Town',
    'Western Cape',
    '8001',
    'South Africa',
    2890.0,
    now,
    now
  );

  db.prepare(`
    INSERT INTO order_items (
      id, order_id, product_id, variant_id, product_title, variant_name, size, color, unit_price, quantity, line_total, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    order1Id,
    pW2,
    pW2,
    'Ribbed Silk-Knit Midi Column Dress',
    'Earthy Terracotta · Size S',
    'S',
    'Earthy Terracotta',
    2890.0,
    1,
    2890.0,
    '/src/assets/images/fashion_women_silk_midi_dress_1792263530827.jpg'
  );

  // Record migration
  db.prepare("INSERT INTO _migrations (name, applied_at) VALUES ('fashion_zar_south_africa_v2', ?)").run(now);
  console.log('AVEART Fashion catalogue v2 initialized with full South African ZAR pricing and Women/Men/Unisex categories.');
}
