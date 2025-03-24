# Timeless Accessories E-commerce Platform

A modern e-commerce platform built with Next.js 15, TypeScript, and a robust tech stack for selling accessories online.

## Tech Stack

- **Frontend:**
  - Next.js 15 (App Router)
  - TypeScript
  - Shadcn UI
  - Lucide Icons
  - Recharts (Analytics)

- **Backend & Database:**
  - Prisma (ORM)
  - PostgreSQL
  - NextAuth.js (Beta)

- **Services:**
  - Stripe (Payments)
  - PayPal (Payments)
  - LascoPay (Regional Payment)
  - Resend (Email)
  - Uploadthing (File uploads)

- **Validation & Testing:**
  - Zod (Schema Validation)
  - Jest & React Testing Library
  - Cypress (E2E Testing)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm or yarn
- Stripe account (for payment processing)
- PayPal developer account (for payment processing)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/timeless-accessories.git
   cd timeless-accessories
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Fill in the required environment variables in `.env`

4. Set up the database:

   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Payment Integrations

### Stripe Setup

The application uses Stripe for credit card payments. To set up Stripe:

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Set the following environment variables:

   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

4. For detailed setup instructions, see [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md)

#### Stripe Debugging

For development and testing purposes, you can use the built-in debugging utility:

```javascript
// In browser console (development mode only)
import { debugStripePaymentIntent } from "@/lib/utils";
debugStripePaymentIntent("order-id-here");
```

This will output detailed information about the Stripe payment intent creation process in the browser console.

Alternatively, you can use the provided debug script:

```javascript
// Load the debug script in the browser console
fetch('/debug-scripts/test-stripe.js')
  .then(response => response.text())
  .then(text => eval(text))
  .catch(error => console.error('Failed to load debug script:', error));

// Then test Stripe payment with an order ID
testStripePayment("order-id-here");
```

This script makes a direct request to the Stripe payment API and logs detailed response information.

You can also visit `/debug-scripts/stripe-tester.html` in your development environment to use a visual interface for testing Stripe payment intents.

### PayPal Setup

For PayPal payment processing:

1. Create a PayPal Developer account
2. Set up a sandbox application
3. Configure the environment variables:

   ```
   PAYPAL_CLIENT_ID=...
   PAYPAL_APP_SECRET=...
   PAYPAL_API_URL=https://api-m.sandbox.paypal.com
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
   ```

## Development Workflow

### Branch Structure

- `main` - Production branch
- `development` - Main development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Hot fix branches

### Commit Message Format

```
type(scope): subject

[optional body]

[optional footer]
```

Types:

- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes (formatting, etc)
- refactor: Code refactoring
- test: Adding tests
- chore: Maintenance tasks

### Pull Request Process

1. Create a new branch from `development`
2. Make your changes
3. Submit a PR to `development`
4. Ensure CI checks pass
5. Get code review approval
6. Merge using squash merge

## Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run linting
npm run lint
```

## Deployment

The application uses a CI/CD pipeline with GitHub Actions:

- Commits to `development` trigger staging deployment
- Commits to `main` trigger production deployment
- PR checks include linting, testing, and build verification

## License

[MIT License](LICENSE)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Market Configuration

This application supports two different market configurations:

### 1. GLOBAL Market

- Standard shipping options based on country and order total
- Multiple payment options: PayPal, Stripe Credit Card, Cash on Delivery
- Free shipping for orders over $100
- Shipping costs: $15 for USA/Canada, $35 for other countries

### 2. LASCO Market

- Courier-based shipping only
- LascoPay payment integration only
- Shipping cost based on selected courier

### Switching Markets

To switch between market configurations:

```bash
# Run the market switcher tool
npm run switch-market
```

This will update the `.env` file with the selected market configuration. Remember to restart your development server after switching markets for the changes to take effect.
