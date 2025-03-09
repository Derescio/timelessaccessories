# Frontend Architecture

## Overview
The frontend of Timeless Accessories is built using Next.js 15 with TypeScript, following the App Router pattern. We use shadcn/ui for components and Tailwind CSS for styling.

## Directory Structure
```
app/
├── (auth)/                # Authentication routes
├── (dashboard)/           # Admin dashboard routes
├── (shop)/                # Shopping routes
├── api/                   # API routes
├── components/
│   ├── ui/               # Base UI components
│   ├── shared/           # Shared components
│   ├── forms/            # Form components
│   └── sections/         # Page sections
├── lib/
│   ├── actions/          # Server actions
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utility functions
│   └── validations/      # Form validations
└── styles/               # Global styles
```

## Component Architecture

### UI Components (components/ui/)
Base components from shadcn/ui, customized for our needs:
- Button
- Input
- Card
- Dialog
- Navigation
- etc.

### Shared Components (components/shared/)
Common components used across multiple pages:
- Header
- Footer
- ProductCard
- CategoryCard
- CartItem
- etc.

### Form Components (components/forms/)
Form-specific components with validation:
- LoginForm
- RegisterForm
- CheckoutForm
- ProductForm
- etc.

### Page Sections (components/sections/)
Larger page-specific components:
- HeroSection
- FeaturedProducts
- CategoryGrid
- etc.

## State Management

### Server Components
- Used for static and dynamic server-rendered content
- Handle data fetching and initial state
- Improve performance and SEO

### Client Components
- Used for interactive elements
- Handle client-side state and events
- Marked with "use client" directive

### Context Providers
```typescript
// app/providers.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

## Data Fetching

### Server Actions
Used for mutations and form submissions:
```typescript
'use server'

export async function addToCart(productId: string, quantity: number) {
  // Implementation
}
```

### API Routes
Used for client-side data fetching:
```typescript
// lib/api.ts
export async function getProducts(params: ProductQueryParams) {
  const response = await fetch('/api/products?' + new URLSearchParams(params));
  return response.json();
}
```

## Routing and Navigation

### App Router Structure
```
app/
├── page.tsx              # Home page
├── layout.tsx            # Root layout
├── products/
│   ├── page.tsx         # Products listing
│   └── [id]/
│       └── page.tsx     # Product details
└── categories/
    ├── page.tsx         # Categories listing
    └── [slug]/
        └── page.tsx     # Category products
```

### Navigation
Using Next.js Link component and navigation hooks:
```typescript
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
```

## Styling

### Tailwind CSS
- Utility-first CSS framework
- Custom theme configuration
- Responsive design utilities

### CSS Modules
Used for component-specific styles when needed:
```typescript
// ProductCard.module.css
.card {
  @apply relative overflow-hidden rounded-lg;
}
```

## Performance Optimization

### Image Optimization
Using Next.js Image component:
```typescript
import Image from 'next/image';

export function ProductImage({ src, alt }: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={400}
      priority={false}
      className="object-cover"
    />
  );
}
```

### Code Splitting
- Automatic code splitting by route
- Dynamic imports for heavy components
```typescript
const Chart = dynamic(() => import('@/components/Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
```

### Caching Strategy
- Route cache
- Data cache
- Full route cache
- Layout cache

## Error Handling

### Error Boundaries
```typescript
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Loading States
```typescript
export default function Loading() {
  return <LoadingSkeleton />;
}
```

## Testing

### Component Testing
Using Jest and React Testing Library:
```typescript
describe('ProductCard', () => {
  it('renders product information correctly', () => {
    // Test implementation
  });
});
```

### E2E Testing
Using Playwright:
```typescript
test('user can add product to cart', async ({ page }) => {
  // Test implementation
});
```

## Best Practices

1. Component Organization
   - Keep components small and focused
   - Use composition over inheritance
   - Follow single responsibility principle

2. Performance
   - Use server components where possible
   - Implement proper loading states
   - Optimize images and assets
   - Implement proper caching strategies

3. Accessibility
   - Follow ARIA guidelines
   - Implement keyboard navigation
   - Provide proper contrast ratios
   - Include alt text for images

4. State Management
   - Use server components for static data
   - Implement proper loading and error states
   - Keep client-side state minimal

5. Code Quality
   - Follow TypeScript best practices
   - Implement proper error handling
   - Write comprehensive tests
   - Use consistent naming conventions 