# Testing Documentation

## Overview
This document outlines the testing strategy and implementation for the Timeless Accessories e-commerce platform. We use a combination of unit tests, integration tests, and end-to-end tests to ensure code quality and functionality.

## Testing Stack
- Jest: Unit and integration testing
- React Testing Library: Component testing
- Playwright: End-to-end testing
- MSW (Mock Service Worker): API mocking
- Vitest: Unit testing runner

## Directory Structure
```
__tests__/
├── unit/                 # Unit tests
├── integration/          # Integration tests
├── e2e/                 # End-to-end tests
└── __mocks__/           # Mock files
```

## Unit Testing

### Component Testing
```typescript
// __tests__/unit/components/ProductCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/shared/ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    images: ['/test.jpg']
  };

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('handles add to cart action', async () => {
    const onAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);
    
    await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(onAddToCart).toHaveBeenCalledWith('1');
  });
});
```

### Utility Function Testing
```typescript
// __tests__/unit/utils/price.test.ts
import { formatPrice, calculateDiscount } from '@/lib/utils/price';

describe('Price Utils', () => {
  it('formats price correctly', () => {
    expect(formatPrice(1999)).toBe('$19.99');
    expect(formatPrice(2000)).toBe('$20.00');
  });

  it('calculates discount correctly', () => {
    expect(calculateDiscount(100, 20)).toBe(80);
  });
});
```

## Integration Testing

### API Route Testing
```typescript
// __tests__/integration/api/products.test.ts
import { createMocks } from 'node-mocks-http';
import { getProducts } from '@/app/api/products/route';

describe('Products API', () => {
  it('returns products with pagination', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1', limit: '20' }
    });

    await getProducts(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.products).toBeDefined();
    expect(data.pagination).toBeDefined();
  });
});
```

### Database Integration Testing
```typescript
// __tests__/integration/db/products.test.ts
import { prisma } from '@/lib/db';
import { createProduct, getProduct } from '@/lib/db/products';

describe('Product Database Operations', () => {
  beforeEach(async () => {
    await prisma.product.deleteMany();
  });

  it('creates and retrieves a product', async () => {
    const product = await createProduct({
      name: 'Test Product',
      price: 99.99
    });

    const retrieved = await getProduct(product.id);
    expect(retrieved).toMatchObject({
      name: 'Test Product',
      price: 99.99
    });
  });
});
```

## End-to-End Testing

### Setup
```typescript
// playwright.config.ts
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './__tests__/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Chrome',
      use: { browserName: 'chromium' },
    },
    {
      name: 'Firefox',
      use: { browserName: 'firefox' },
    },
  ],
};

export default config;
```

### User Flow Testing
```typescript
// __tests__/e2e/checkout.test.ts
import { test, expect } from '@playwright/test';

test('complete checkout process', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');

  // Add product to cart
  await page.goto('/products/test-product');
  await page.click('button:text("Add to Cart")');

  // Complete checkout
  await page.goto('/cart');
  await page.click('button:text("Checkout")');
  
  // Fill shipping info
  await page.fill('[name=firstName]', 'John');
  await page.fill('[name=lastName]', 'Doe');
  // ... more fields

  // Verify order confirmation
  await page.click('button:text("Place Order")');
  await expect(page.locator('text=Order Confirmed')).toBeVisible();
});
```

## API Mocking

### Mock Service Worker Setup
```typescript
// __tests__/__mocks__/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/products', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        products: [
          {
            id: '1',
            name: 'Mock Product',
            price: 99.99
          }
        ]
      })
    );
  }),
];
```

### Using Mocks in Tests
```typescript
// __tests__/integration/components/ProductList.test.tsx
import { setupServer } from 'msw/node';
import { handlers } from '../__mocks__/handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('renders product list', async () => {
  render(<ProductList />);
  
  await screen.findByText('Mock Product');
  expect(screen.getByText('$99.99')).toBeInTheDocument();
});
```

## Test Coverage

### Configuration
```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Running Tests
```bash
# Run unit and integration tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run e2e tests
npm run test:e2e

# Run specific test file
npm test -- ProductCard.test.tsx
```

## Best Practices

1. Test Organization
   - Keep tests close to implementation
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)
   - Group related tests with describe blocks

2. Test Coverage
   - Aim for 80% coverage minimum
   - Focus on business-critical paths
   - Test edge cases and error scenarios
   - Don't test implementation details

3. Mocking
   - Mock external dependencies
   - Use realistic test data
   - Keep mocks simple and maintainable
   - Document mock behavior

4. Performance
   - Keep tests fast
   - Use setup and teardown hooks effectively
   - Parallelize test runs when possible
   - Clean up test data

5. Maintenance
   - Regular updates of test dependencies
   - Review and update tests with code changes
   - Remove obsolete tests
   - Document testing patterns 