export const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.yourdomain.com';

export function getImageUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${CDN_URL}/images${path.startsWith('/') ? path : `/${path}`}`;
}

export function optimizeImage(url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg';
} = {}): string {
  if (!url.startsWith(CDN_URL)) return url;

  const params = new URLSearchParams();
  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.quality) params.append('q', options.quality.toString());
  if (options.format) params.append('f', options.format);

  return `${url}?${params.toString()}`;
} 