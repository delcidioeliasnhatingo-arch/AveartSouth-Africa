# AVEART — Artisanal Haute Design & Curated Objects

AVEART is an artisanal luxury e-commerce platform and gallery storefront dedicated to limited-edition architectural objects, handcrafted ceramics, bespoke furniture, and heirloom lighting. The platform provides a responsive, editorial shopping experience paired with server-authoritative inventory, secure checkout, payment sandbox verification, and an administrative operations hub.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Key Architecture Decisions for Approval:**
> - **Unified Full-Stack Runtime**: Express.js server (`server.ts`) hosting Vite middleware in development and serving production static assets, enabling server-side price recalculation, order creation, cryptographic webhook verification, and authenticated API endpoints without client-side secrets.
> - **Database Strategy**: Production relational data layer with full migrations, foreign key cascading, ACID transactions for stock reservation/decrement, and audit logs for inventory movement.
> - **Authentication & RBAC**: Dual-mode session & token authentication with customer account self-service, address book, order history, and role-based permissions (`admin`, `store_manager`, `customer`).
> - **Payment Adapter & Webhook Idempotency**: Stripe-compatible sandbox payment adapter with HMAC-SHA256 signature verification, idempotent event processing via transactional idempotency keys, and automated refund lifecycle management.
> - **Visual Direction**: Haute editorial luxury aesthetic — warm travertine/linen canvas (`#FAF8F5`), deep obsidian typography (`#121212`), muted terracotta bronze accents (`#A35D38`), Cormorant Garamond display serif paired with Plus Jakarta Sans geometric body.

---

### 1. Overview & Core Concept

- **What It Does**: AVEART presents high-end design objects with editorial storytelling, dynamic multi-attribute variant selection (materials, finishes, dimensions), live stock availability, server-verified cart pricing, multi-step checkout with real-time tax/shipping computation, customer portal, and an administrative command center for orders, inventory adjustments, and catalog management.
- **Target Audience / Persona**: Discerning interior architects, collectors, and design connoisseurs seeking authentic limited-edition artisanal furnishings; alongside store managers and curators requiring inventory visibility and order fulfillment workflows.
- **Key Value**: Elimination of dead affordances, zero price tampering through server validation, guaranteed stock consistency under concurrent orders, and verifiable sandbox payment transactions with webhook lifecycle handling.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Discovery & Exploration**:
   - Curated Home with Hero spotlight, featured limited series, craftsmanship atelier statement, and seasonal editorial collections.
   - Comprehensive Catalog & Category pages with facet filtering (Category, Material, Price Range, In-Stock status) and server-backed search with query debouncing.
2. **Product Detail Page (PDP)**:
   - Sticky high-resolution gallery with zoom inspection.
   - Contiguous purchase module: variant selector (finish/material/edition), live stock indicator with low-stock warnings, dimension specifications, provenance notes, and instant "Add to Bag" feedback.
3. **Cart & Secure Checkout**:
   - Slide-over cart drawer with live subtotal, shipping threshold progress, and quantity stepping.
   - Checkout flow: Shipping address validation, dynamic shipping method selection (Standard, White-Glove Architectural Freight), promo/discount code verification, and sandbox payment entry (credit card test tokens).
4. **Order Confirmation & Customer Portal**:
   - Immediate order confirmation with tracking number, status timeline, itemized invoice, and print receipt.
   - Customer account view with saved addresses, order tracking, and profile preferences.
5. **Admin Operations Suite**:
   - Dashboard KPI metrics (Gross Revenue, Active Orders, Low Stock Alerts, Conversion Rate).
   - Inventory & Variant Manager with stock adjustment audit logs.
   - Order Processing Console with state transitions (`pending` → `paid` → `processing` → `shipped` → `delivered` / `refunded`).
   - Catalog management (create/edit products, categories, media, and pricing).

#### Visual Identity & Theme
- **Aesthetic Direction**: Haute Editorial & Gallery Minimalist. Clean hairline dividers (`border-stone-200`), spacious whitespace rhythm, balanced typographic hierarchy, and zero generic AI pill-badges.
- **Color Palette**:
  - Dominant Canvas (60%): `#FAF8F5` (Warm Alabaster / Linen)
  - Structural Surfaces (30%): `#FFFFFF` (Pristine Card Surfaces), `#F3EFEA` (Muted Sand Hover), `#E7E2DA` (Hairline Dividers)
  - Typography: `#121212` (Deep Charcoal Obsidian Display), `#57534E` (Muted Warm Slate Body)
  - Accent Budget (10%): `#9C5B32` (Artisan Terracotta Bronze) for primary CTA buttons and focus states; `#2D6A4F` (Subtle Forest) for positive delivery states.
- **Typography & Scale**:
  - Display & Headings: `Cormorant Garamond` (or `Playfair Display`), serif, high-contrast, editorial elegance.
  - Body & Form Controls: `Plus Jakarta Sans`, sans-serif, legible geometric measure (65–75ch).
  - Telemetry & Financials: `tabular-nums font-mono` for all currencies, prices, order IDs, and stock counts.
- **Top Bar Contract**:
  - Zone 1: Wordmark `AVEART` (editorial serif display).
  - Zone 2: Concise single-line links: `Collection`, `Atelier`, `Editions`, `Objects`, `Journal`.
  - Zone 3: Search trigger, Account icon, and Cart Drawer trigger with real-time numeric badge.

---

### 3. Key Product Decisions & Trade-Offs

- **Server-Authoritative Price & Inventory Validation**:
  - *Chosen Approach*: Cart submissions send only `{ productId, variantId, quantity }`. The server queries the database directly, recalculates line totals, checks current stock, applies active discount rules, and computes shipping/taxes.
  - *Why*: Prevents client-side price tampering and race conditions during stock depletion.
- **Payment Sandbox with Cryptographic Webhook Simulation**:
  - *Chosen Approach*: A built-in sandbox payment adapter simulating modern payment rails (e.g., Stripe PaymentIntents) complete with test cards, asynchronous webhook generation, HMAC signature verification, and replay protection via database event logs.
  - *Why*: Enables end-to-end sandbox testing of successful charges, declined cards, 3D Secure challenges, and refund workflows directly in the development and preview environment.
- **State Machine for Order Lifecycle**:
  - *Chosen Approach*: Strict status enum (`pending_payment`, `payment_processing`, `paid`, `preparing_shipment`, `in_transit`, `delivered`, `cancelled`, `refunded`). Stock is atomically reserved on checkout initiation and deducted on payment confirmation; released if cancelled or refunded.
  - *Why*: Guarantees database state integrity and prevents phantom shipments.

---

### 4. Technical Architecture & Data Strategy

#### System Architecture & Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT VIEWPORT (React SPA)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Storefront   │  │ PDP & Cart   │  │ Checkout &   │  │ Admin Hub  │  │
│  │ Home/Catalog │  │ Slide Drawer │  │ Sandbox Pay  │  │ Dashboard  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
└─────────┼─────────────────┼─────────────────┼────────────────┼─────────┘
          │                 │                 │                │
          ▼                 ▼                 ▼                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 EXPRESS BACKEND (server.ts / Node.js)                  │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │ Auth & RBAC Guard     │  │ Server-Side Price & Tax Engine        │  │
│  │ (Session / JWT / Roles│  │ (Recalculates totals, checks limits)  │  │
│  └───────────┬───────────┘  └───────────────────┬───────────────────┘  │
│              │                                  │                      │
│  ┌───────────▼───────────┐  ┌───────────────────▼───────────────────┐  │
│  │ Payment Sandbox       │  │ Webhook Ingestion & HMAC Verify       │  │
│  │ (Intent, Card Checks) │  │ (Replay protection, idempotency logs) │  │
│  └───────────┬───────────┘  └───────────────────┬───────────────────┘  │
└──────────────┼──────────────────────────────────┼──────────────────────┘
               │                                  │
               ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PERSISTENT RELATIONAL DATA LAYER                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ products &   │  │ orders &     │  │ stock movements│ users, roles│  │
│  │ variants     │  │ order_items  │  │ & audit log   │ & addresses│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Database Schema Blueprint
1. **users**: `id`, `email`, `passwordHash`, `name`, `role` (`customer`, `store_manager`, `admin`), `createdAt`, `updatedAt`
2. **addresses**: `id`, `userId`, `recipientName`, `line1`, `line2`, `city`, `postalCode`, `country`, `isDefault`
3. **categories**: `id`, `name`, `slug`, `description`, `imageUrl`
4. **products**: `id`, `categoryId`, `title`, `slug`, `subtitle`, `description`, `material`, `dimensions`, `artisan`, `basePrice`, `isPublished`, `featured`, `createdAt`
5. **product_variants**: `id`, `productId`, `sku`, `name`, `priceOffset`, `stockQuantity`, `lowStockThreshold`, `imageUrl`
6. **inventory_logs**: `id`, `variantId`, `changeQuantity`, `balanceAfter`, `reason` (`restock`, `order_reservation`, `order_cancelled`, `manual_adjustment`), `referenceId`, `createdAt`
7. **discounts**: `id`, `code`, `discountPercent`, `fixedAmount`, `minOrderValue`, `expiresAt`, `isActive`
8. **orders**: `id`, `orderNumber`, `userId`, `customerEmail`, `customerName`, `status`, `shippingAddress`, `subtotal`, `discountAmount`, `shippingAmount`, `taxAmount`, `totalAmount`, `paymentIntentId`, `paymentStatus`, `trackingNumber`, `createdAt`
9. **order_items**: `id`, `orderId`, `productId`, `variantId`, `productTitle`, `variantName`, `price`, `quantity`
10. **webhook_events**: `id`, `eventId`, `provider`, `eventType`, `payload`, `processedAt`, `status`

#### Planned Incremental Delivery Stages
- **Stage 1 (Storefront & Brand Design)**: Brand typography, top bar contract, responsive navigation, luxury editorial Home, Catalog with facet filtering, Product Detail Page with contiguous purchase module, Cart Drawer, and Policy pages.
- **Stage 2 (Database & Server API)**: Relational database configuration, automatic migrations, seed data for authentic artisanal products, Express API endpoints (`/api/products`, `/api/categories`, `/api/cart/calculate`, `/api/orders`, `/api/auth`).
- **Stage 3 (Authentication & Customer Accounts)**: User registration, secure login, role guard middleware, profile management, saved address book, and customer order tracking.
- **Stage 4 (Checkout & Payment Sandbox)**: Server-side pricing recalculation, sandbox payment intent creation, test card charging, HMAC-verified webhook ingestion, and stock decrements.
- **Stage 5 (Admin Management Suite)**: Protected dashboard with KPI analytics, catalog creator/editor, stock level monitor with manual adjustment logs, and order fulfillment state transitions.
- **Stage 6 (SEO, Operational Polish & Verification)**: OpenGraph meta tags, Schema.org JSON-LD structured data, receipt generation, automated test suite verification, and release verification.
