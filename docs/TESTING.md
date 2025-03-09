# Testing Documentation

## Overview
This document outlines the testing setup and procedures for the Timeless Accessories e-commerce platform.

## Test Structure
- `__tests__/` - Root directory for all tests
  - `components/` - Component tests
  - `api/` - API route tests
  - `e2e/` - End-to-end tests

## Running Tests

### Unit and Integration Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Run specific test file
npm test -- __tests__/components/ProductCard.test.tsx

# Run tests matching a pattern
npm test -- -t "ProductCard"

# Generate coverage report
npm run test:coverage
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Test Configuration
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Test setup and global configurations
- `playwright.config.ts` - E2E test configuration

## Coverage Reports
Coverage reports are generated in the `coverage/` directory:
- Open `coverage/lcov-report/index.html` in your browser
- Coverage is also reported to Codecov in CI/CD pipeline

## Writing Tests

### Component Tests
```typescript
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import YourComponent from '@/components/YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### API Tests
```typescript
import { createMocks } from 'node-mocks-http';
import { yourApiHandler } from '@/app/api/your-route/route';

describe('Your API', () => {
  it('handles requests correctly', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await yourApiHandler(req, res);
    expect(res._getStatusCode()).toBe(200);
  });
});
```

## CI/CD Integration
Tests are automatically run in the CI/CD pipeline:
- On every push to main/development
- On pull requests
- Daily scheduled runs
- Manual triggers available 