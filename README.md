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
- Multiple payment options: PayPal, Credit Card, Cash on Delivery
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