# Performance Optimization Guide

## Overview
This document outlines the performance optimization strategies implemented in the Timeless Accessories e-commerce platform. Our goal is to maintain optimal performance while delivering a rich user experience.

## Core Web Vitals

### Metrics
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTFB (Time to First Byte)**: < 0.6s

### Monitoring
```typescript
// app/layout.tsx
export function reportWebVitals(metric: NextWebVitalsMetric) {
  switch (metric.name) {
    case 'LCP':
      console.log('LCP:', metric.value);
      break;
    case 'FID':
      console.log('FID:', metric.value);
      break;
    case 'CLS':
      console.log('CLS:', metric.value);
      break;
    case 'TTFB':
      console.log('TTFB:', metric.value);
      break;
  }
}
```

## Image Optimization

### Next.js Image Component
```typescript
// components/shared/OptimizedImage.tsx
import Image from 'next/image';

export function OptimizedImage({ src, alt, width, height }: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      placeholder="blur"
      blurDataURL={`data:image/svg+xml;base64,...`}
      className="object-cover"
    />
  );
}
```

### Image Loading Strategy
1. Priority Images (above the fold)
```typescript
<Image
  src="/hero-image.jpg"
  alt="Hero"
  priority={true}
  quality={85}
/>
```

2. Lazy Loading (below the fold)
```typescript
<Image
  src="/product-image.jpg"
  alt="Product"
  loading="lazy"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

## Caching Strategy

### Route Cache
```typescript
// app/products/page.tsx
export const revalidate = 3600; // Revalidate every hour

export default async function ProductsPage() {
  // Implementation
}
```

### Data Cache
```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

export const getProducts = unstable_cache(
  async (category: string) => {
    // Fetch products
  },
  ['products'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['products']
  }
);
```

### API Route Cache
```typescript
// app/api/products/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const products = await getProducts();
  
  return NextResponse.json(products, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600'
    }
  });
}
```

## Code Optimization

### Bundle Analysis
```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

### Dynamic Imports
```typescript
// app/dashboard/page.tsx
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('@/components/Chart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false
});
```

### Route Segments
```typescript
// app/layout.tsx
import { Suspense } from 'react';

export default function Layout({ children }) {
  return (
    <div>
      <Suspense fallback={<Header.Skeleton />}>
        <Header />
      </Suspense>
      {children}
    </div>
  );
}
```

## Database Optimization

### Query Optimization
```typescript
// lib/db/products.ts
export async function getProducts(category: string) {
  return await prisma.product.findMany({
    where: { categoryId: category },
    select: {
      id: true,
      name: true,
      price: true,
      images: { take: 1 }
    },
    take: 20
  });
}
```

### Indexing Strategy
```prisma
// prisma/schema.prisma
model Product {
  id        String   @id @default(cuid())
  name      String
  price     Float
  categoryId String
  
  @@index([categoryId])
  @@index([price])
}
```

## Frontend Optimization

### React Component Optimization
```typescript
// components/ProductCard.tsx
import { memo } from 'react';

function ProductCard({ product }: Props) {
  // Implementation
}

export default memo(ProductCard, (prev, next) => {
  return prev.product.id === next.product.id;
});
```

### State Management
```typescript
// hooks/useProducts.ts
import { useMemo } from 'react';

export function useFilteredProducts(products, filters) {
  return useMemo(() => {
    return products.filter(product => {
      // Filter implementation
    });
  }, [products, filters]);
}
```

## Asset Optimization

### Font Loading
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      {children}
    </html>
  );
}
```

### CSS Optimization
```typescript
// tailwind.config.ts
module.exports = {
  purge: ['./app/**/*.{ts,tsx}'],
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
};
```

## Monitoring and Analytics

### Performance Monitoring
```typescript
// lib/monitoring.ts
export function trackPerformanceMetric(metric: PerformanceMetric) {
  // Send to analytics service
}

export function setupPerformanceObserver() {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach(entry => {
      trackPerformanceMetric({
        name: entry.name,
        value: entry.startTime,
        type: entry.entryType
      });
    });
  });

  observer.observe({ entryTypes: ['navigation', 'resource', 'paint'] });
}
```

## Best Practices

1. Image Optimization
   - Use Next.js Image component
   - Implement responsive images
   - Optimize image quality vs size
   - Use modern image formats (WebP)

2. Code Splitting
   - Implement route-based code splitting
   - Use dynamic imports for heavy components
   - Lazy load below-the-fold content
   - Optimize bundle size

3. Caching Strategy
   - Implement appropriate cache headers
   - Use stale-while-revalidate
   - Cache static assets
   - Implement service workers

4. Database Performance
   - Optimize database queries
   - Use appropriate indexes
   - Implement connection pooling
   - Monitor query performance

5. Frontend Performance
   - Minimize JavaScript execution
   - Optimize React renders
   - Implement proper loading states
   - Use performance profiling tools

## Performance Testing

### Lighthouse CI
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v3
        with:
          urls: |
            https://staging.timelessaccessories.com/
          budgetPath: ./budget.json
          uploadArtifacts: true
```

### Performance Budget
```json
// budget.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "first-contentful-paint": ["warn", {"minScore": 0.9}],
        "interactive": ["error", {"minScore": 0.9}],
        "performance-budget": ["error", {"resourceSizes": {
          "script": "200 KB",
          "total": "1000 KB"
        }}]
      }
    }
  }
} 