import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shop-dw.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/user/',
          '/studio/',
          '/dev/',
          '/auth/',
          '/orders/',
          '/checkout',
          '/shipping',
          '/payment-method',
          '/place-order',
          '/confirmation',
          '/order-success',
          '/cart',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

