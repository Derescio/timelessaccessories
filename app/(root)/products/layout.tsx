import { Metadata } from 'next';
import { getCanonicalUrl } from '@/lib/utils/seo';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shop-dw.com';

export const metadata: Metadata = {
  title: "Shop All Accessories | Shop-DW",
  description: "Browse our complete collection of timeless accessories. Find jewelry, watches, bracelets, necklaces, rings, and more. Quality products for everyday style.",
  keywords: ['accessories', 'jewelry', 'watches', 'bracelets', 'necklaces', 'rings', 'fashion accessories', 'shop accessories'],
  alternates: {
    canonical: getCanonicalUrl('/products'),
  },
  openGraph: {
    title: "Shop All Accessories | Shop-DW",
    description: "Browse our complete collection of timeless accessories. Find jewelry, watches, bracelets, necklaces, rings, and more.",
    type: 'website',
    siteName: 'Shop-DW',
    url: getCanonicalUrl('/products'),
    images: [{
      url: `${BASE_URL}/og/Kings_Cross_1.png`,
      width: 1200,
      height: 630,
      alt: 'Shop-DW Products Collection',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Shop All Accessories | Shop-DW",
    description: "Browse our complete collection of timeless accessories. Find jewelry, watches, bracelets, necklaces, rings, and more.",
    images: [`${BASE_URL}/og/Kings_Cross_1.png`],
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

