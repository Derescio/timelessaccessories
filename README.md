# Timeless Accessories E-commerce Platform

A modern e-commerce platform built with Next.js 15, TypeScript, and a robust tech stack for selling accessories online. Features full **Print-on-Demand (POD)** integration with Printify and a comprehensive **Design Management System** for creating professional product listings.

## 🌟 Key Features

### Core E-commerce
- **Complete Shopping Experience** - Product catalog, cart, checkout, order management
- **Multi-Payment Support** - Stripe, PayPal, LascoPay integration
- **Guest & User Checkout** - Flexible purchasing options
- **Admin Dashboard** - Comprehensive management interface
- **Inventory Management** - Stock tracking and reservation system

### 🎨 Print-on-Demand & Design Management **NEW**
- **Printify Integration** - Import templates from Printify catalog
- **Design Management System** - Upload and manage custom artwork
- **Product Designer** - Apply designs to blank templates with positioning controls
- **Mockup Generation** - Create professional product images with designs applied
- **Lazy POD Creation** - Products created in Printify only when orders are placed
- **Transform Your Store** - From "blank template catalog" to "designed product store"

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
  - **Printify API** (Print-on-Demand) 🆕

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
- **Printify account** (for POD functionality) 🆕

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

   Fill in the required environment variables in `.env`, including:

   ```env
   # Existing variables...
   
   # Printify Integration (NEW)
   PRINTIFY_ACCESS_TOKEN=your_printify_access_token
   PRINTIFY_SHOP_ID=your_printify_shop_id
   ```

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

## 🎨 Design Management Workflow

Transform blank Printify templates into professional, designed products:

### 1. Import Product Templates
```bash
# Navigate to: /admin/printify/catalog
# Browse Printify blueprints → Import desired templates
```

### 2. Upload Custom Designs
```bash
# Navigate to: /admin/printify/designer
# Upload your artwork (logos, graphics, etc.)
```

### 3. Apply Designs to Products
```bash
# Select imported product → Choose design from library
# Configure positioning (front/back, size, rotation)
# Apply design → Generate mockups
```

### 4. Professional Product Listings
- Customers see designed products, not blank templates
- Mockup images show actual designs applied
- Increased customer appeal and conversion rates

### 5. Automated Fulfillment
- Orders trigger Printify product creation with design data
- Printify prints with custom design and ships
- No inventory management needed

For detailed documentation, see [docs/DESIGN_MANAGEMENT.md](docs/DESIGN_MANAGEMENT.md)

## 📋 Admin Interface

Access the admin dashboard at `/admin` with admin credentials:

### Main E-commerce Management
- **Dashboard** - Sales analytics and overview
- **Products** - Product catalog management
- **Orders** - Order processing and tracking
- **Categories** - Category hierarchy management

### 🆕 Printify & Design Management
- **Printify Catalog** - Browse and import Printify templates
- **Design Library** - Upload and manage custom artwork  
- **Product Designer** - Apply designs to imported templates
- **POD Orders** - Monitor print-on-demand fulfillment

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

## Category Management System

The category management system allows admins to create, edit, and organize product categories in a hierarchical structure.

### Key Features

- **Hierarchical Categories**: Categories can have parent-child relationships, allowing for nested organization
- **Validation**: The system prevents circular references (cannot set a category as its own parent or as a descendant)
- **User Association**: Categories are associated with the admin user who creates or updates them
- **Image Management**: Categories can have images uploaded through UploadThing

### Recent Improvements

- Fixed issue with category updates when maintaining the same parent
- Added proper validation to prevent circular references
- Added user tracking for category ownership
- Improved error handling and user feedback
- Added comprehensive logging for easier troubleshooting

### Common Operations

1. **Creating a category**: Navigate to Admin > Categories > Create Category
2. **Editing a category**: Select any category from the list and click Edit
3. **Creating a subcategory**: Either select a parent when creating a new category, or use the "Add Subcategory" option
4. **Deleting a category**: Categories can only be deleted if they have no subcategories or products
