import { Product } from './types/index.ts';

export interface StoreCollection {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
}

export const AVEART_COLLECTIONS: StoreCollection[] = [
  { slug: 'new-arrivals', title: 'New Arrivals', eyebrow: 'Just added', description: 'The latest pieces added to the AVEART collection.' },
  { slug: 'best-sellers', title: 'Best Sellers', eyebrow: 'The favourites', description: 'Popular and featured pieces selected from the store.' },
  { slug: 'everyday-essentials', title: 'Everyday Essentials', eyebrow: 'Made for every day', description: 'Easy pieces for everyday outfits and regular rotation.' },
  { slug: 'street-style', title: 'Street Style', eyebrow: 'Off-duty style', description: 'Relaxed, graphic and urban-inspired pieces.' },
  { slug: 'sets-coords', title: 'Sets & Co-ords', eyebrow: 'A matching moment', description: 'Co-ordinated pieces and matching sets.' },
  { slug: 'sneakers-shoes', title: 'Sneakers & Shoes', eyebrow: 'Step out', description: 'Footwear for everyday wear and different occasions.' },
  { slug: 'bags-accessories', title: 'Bags & Accessories', eyebrow: 'The finishing touch', description: 'Bags and accessories to complete an outfit.' },
  { slug: 'activewear', title: 'Activewear', eyebrow: 'Move comfortably', description: 'Sport, training and movement-ready clothing.' },
  { slug: 'special-offers', title: 'Special Offers', eyebrow: 'Worth a closer look', description: 'Items currently marked with a genuine promotional price.' },
];

const normalise = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function productImage(product: Product): string {
  const item = product as any;
  const variant = Array.isArray(item.variants)
    ? item.variants.find((entry: any) => entry?.is_primary === true || Number(entry?.is_primary) === 1) || item.variants[0]
    : undefined;
  const candidates = [
    item.primary_image, item.image_url, item.imageUrl, item.thumbnail_url, item.thumbnail,
    ...(Array.isArray(item.images) ? item.images : []),
    variant?.images?.[0], variant?.image_url,
    ...(Array.isArray(item.variants) ? item.variants.flatMap((entry: any) => [entry?.images?.[0], entry?.image_url]) : []),
  ];
  return candidates.find((value) => typeof value === 'string' && value.trim()) || '';
}

export function isVisibleStoreProduct(product: Product): boolean {
  const item = product as any;
  if (!productImage(product)) return false;
  if (item.is_published === 0 || item.is_published === false) return false;
  return true;
}

function productText(product: Product): string {
  const item = product as any;
  return normalise([
    item.title, item.name, item.subtitle, item.category_name, item.category_slug,
    item.category, item.description,
    ...(Array.isArray(item.tags) ? item.tags : [item.tags]),
  ].filter(Boolean).join(' '));
}

function hasSalePrice(product: Product): boolean {
  const item = product as any;
  const tags = normalise(Array.isArray(item.tags) ? item.tags.join(' ') : item.tags);
  const base = Number(item.base_price ?? item.price ?? 0);
  const original = Number(item.original_price ?? 0);
  return item.is_on_sale === true || Number(item.is_on_sale) === 1 ||
    (original > 0 && base > 0 && original > base) ||
    /(^| )sale|special offer|promotion|discount/.test(tags);
}

function salesCount(product: Product): number | null {
  const item = product as any;
  const keys = ['sales_count', 'sold_count', 'units_sold', 'total_sold', 'purchase_count'];
  for (const key of keys) {
    if (item[key] !== undefined && Number.isFinite(Number(item[key]))) return Number(item[key]);
  }
  return null;
}

function isFeatured(product: Product): boolean {
  const item = product as any;
  const tags = normalise(Array.isArray(item.tags) ? item.tags.join(' ') : item.tags);
  return item.is_featured === true || Number(item.is_featured) === 1 ||
    /(^| )(best seller|bestseller|featured)( |$)/.test(tags);
}

function matchesKeywords(product: Product, pattern: RegExp): boolean {
  return pattern.test(productText(product));
}

export function getCollectionProducts(products: Product[], slug: string): Product[] {
  const visible = products.filter(isVisibleStoreProduct);
  switch (slug) {
    case 'new-arrivals':
      return [...visible]
        .sort((a, b) => Date.parse(String(b.created_at || '')) - Date.parse(String(a.created_at || '')))
        .slice(0, 12);
    case 'best-sellers': {
      const counts = visible.map(salesCount);
      if (counts.some((value) => value !== null)) {
        return visible
          .filter((product) => (salesCount(product) ?? 0) > 0)
          .sort((a, b) => (salesCount(b) ?? 0) - (salesCount(a) ?? 0));
      }
      return visible.filter(isFeatured);
    }
    case 'everyday-essentials':
      return visible.filter((product) => matchesKeywords(product, /\b(basic|essential|everyday|daily|casual|cotton|t shirt|tee|polo|shirt|jeans|denim|trouser|legging|hoodie|sweatshirt)\b/));
    case 'street-style':
      return visible.filter((product) => matchesKeywords(product, /\b(street|streetwear|graphic|oversized|skate|urban|jersey|track|cargo)\b/));
    case 'sets-coords':
      return visible.filter((product) => matchesKeywords(product, /\b(set|sets|co ord|co ords|coord|matching|two piece|2 piece|tracksuit|twin set)\b/));
    case 'sneakers-shoes':
      return visible.filter((product) => matchesKeywords(product, /\b(sneaker|trainer|shoe|shoes|boot|boots|sandal|sandals|loafer|flat|heel|footwear)\b/));
    case 'bags-accessories':
      return visible.filter((product) => matchesKeywords(product, /\b(accessor|bag|handbag|tote|backpack|purse|wallet|cap|hat|belt|scarf|jewell?ery|sunglasses)\b/));
    case 'activewear':
      return visible.filter((product) => matchesKeywords(product, /\b(activewear|sportswear|sport|training|gym|fitness|yoga|running|workout|athletic)\b/));
    case 'special-offers':
      return visible.filter(hasSalePrice);
    default:
      return visible;
  }
}
