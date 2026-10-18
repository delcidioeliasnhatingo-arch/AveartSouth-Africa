/**
 * Resolve legacy database image paths to Vite-built asset URLs.
 *
 * Product/category records historically store paths such as
 * "/src/assets/images/example.jpg". Those source paths do not exist in
 * production after Vite builds the app, so map them to the hashed assets
 * emitted by Vite. External image URLs are preserved unchanged.
 */
const bundledImages = import.meta.glob('/src/assets/images/*', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const FALLBACK_IMAGE = bundledImages['/src/assets/images/fashion_women_linen_blazer_1792263530901.jpg'];

export function resolveImageUrl(value?: string | null): string {
  if (!value) return FALLBACK_IMAGE || '';
  const path = value.startsWith('/') ? value : `/${value}`;

  if (path.startsWith('/src/assets/images/')) {
    return bundledImages[path] || FALLBACK_IMAGE || '';
  }

  return value;
}
