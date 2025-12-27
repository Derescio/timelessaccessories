/**
 * SEO utility functions for canonical URLs and other SEO helpers
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shop-dw.com';

/**
 * Get canonical URL for a given path
 * @param path - Relative path (e.g., '/products/item-slug' or 'products/item-slug')
 * @returns Full canonical URL
 */
export function getCanonicalUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Remove trailing slash
  const normalizedPath = cleanPath.replace(/\/$/, '');
  return `${BASE_URL}${normalizedPath}`;
}

/**
 * Get absolute URL for images
 * @param path - Image path (relative or absolute)
 * @returns Full URL
 */
export function getAbsoluteImageUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Handle relative paths
  if (path.startsWith('/')) {
    return `${BASE_URL}${path}`;
  }
  return `${BASE_URL}/${path}`;
}

/**
 * Format price for structured data
 * @param price - Price as number
 * @param currency - Currency code (default: USD)
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = 'CAD'): string {
  return `${price.toFixed(2)} ${currency}`;
}

