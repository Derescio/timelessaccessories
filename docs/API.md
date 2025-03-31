# API Documentation

## Overview
This document outlines the RESTful API endpoints for the Timeless Accessories e-commerce platform. All API routes are prefixed with `/api`.

## Important Notes

### Route Parameter Handling

In Next.js 15, all dynamic route parameters are Promise-based. This means:
1. Route parameters must be awaited before use
2. Error handling should account for Promise rejection
3. TypeScript types must reflect the Promise-based nature of parameters

Example route parameter type:
```typescript
type RouteParams = Promise<{
    id: string;
    // ... other parameters
}>;
```

### Error Handling

All API routes follow a standardized error handling pattern:
1. Wrap parameter resolution in try-catch
2. Return appropriate HTTP status codes
3. Include detailed error messages in responses

Example error response:
```typescript
{
    success: false,
    error: string,
    details?: unknown
}
```

## Authentication
All authenticated routes require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Rate Limiting
- Anonymous requests: 100 requests per IP per hour
- Authenticated requests: 1000 requests per user per hour

## API Endpoints

### Products

#### List Products
```http
GET /api/products
```
Query Parameters:
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `category` (string)
- `search` (string)
- `sort` (string: 'price_asc' | 'price_desc' | 'newest')
- `minPrice` (number)
- `maxPrice` (number)

Response:
```json
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "compareAtPrice": "number",
      "images": ["string"],
      "category": {
        "id": "string",
        "name": "string"
      },
      "variants": [
        {
          "id": "string",
          "name": "string",
          "sku": "string",
          "price": "number"
        }
      ]
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalItems": "number"
  }
}
```

#### Get Product
```http
GET /api/products/{id}
```

### Categories

#### List Categories
```http
GET /api/categories
```

#### Get Category
```http
GET /api/categories/{id}
```

### Cart

#### Get Cart
```http
GET /api/cart
```

#### Add to Cart
```http
POST /api/cart
```
Body:
```json
{
  "productId": "string",
  "variantId": "string",
  "quantity": "number"
}
```

### Orders

#### Create Order
```http
POST /api/orders
```
Authentication required

#### List Orders
```http
GET /api/orders
```
Authentication required

### User

#### Register
```http
POST /api/auth/register
```

#### Login
```http
POST /api/auth/login
```

#### Get Profile
```http
GET /api/user/profile
```
Authentication required

## Error Handling

All errors follow this format:
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

Common error codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Webhooks

### Order Webhooks
Endpoint: `/api/webhooks/orders`
- `order.created`
- `order.updated`
- `order.cancelled`

### Payment Webhooks
Endpoint: `/api/webhooks/payments`
- `payment.succeeded`
- `payment.failed`
- `refund.processed`

## Data Models

### Product
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  variants: ProductVariant[];
  inventory: ProductInventory;
}
```

### Category
```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  children?: Category[];
}
```

## Best Practices
1. Use appropriate HTTP methods (GET, POST, PUT, DELETE)
2. Include proper error messages and status codes
3. Validate all input data
4. Use pagination for large datasets
5. Cache responses where appropriate
6. Use HTTPS for all requests
7. Include rate limiting headers
8. Version your API endpoints 

## Products API

### Get All Products
```http
GET /api/products
```

Returns a list of all products.

#### Response
```typescript
{
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}[]
```

#### Example Response
```json
[
  {
    "id": "1",
    "name": "Gold Necklace",
    "price": 299.99,
    "description": "14K Gold necklace",
    "images": ["/images/necklace.jpg"],
    "categoryId": "jewelry",
    "createdAt": "2025-03-09T04:20:00.000Z",
    "updatedAt": "2025-03-09T04:20:00.000Z"
  }
]
```

#### Error Response
```json
{
  "error": "Failed to fetch products: [error details]"
}
```

### Create Product
```http
POST /api/products
```

Creates a new product.

#### Request Body
```typescript
{
  name: string;
  price: number;
  description: string;
  images: string[];
  categoryId: string;
}
```

#### Example Request
```json
{
  "name": "Silver Bracelet",
  "price": 149.99,
  "description": "Sterling silver bracelet",
  "images": ["/images/bracelet.jpg"],
  "categoryId": "jewelry"
}
```

#### Success Response
```json
{
  "id": "2",
  "name": "Silver Bracelet",
  "price": 149.99,
  "description": "Sterling silver bracelet",
  "images": ["/images/bracelet.jpg"],
  "categoryId": "jewelry",
  "createdAt": "2025-03-09T04:30:00.000Z",
  "updatedAt": "2025-03-09T04:30:00.000Z"
}
```

#### Error Response
```json
{
  "error": "Failed to create product: [error details]"
}
```

## Error Handling

All API endpoints follow a consistent error response format:
```typescript
{
  error: string;
}
```

HTTP Status Codes:
- `200`: Success
- `201`: Created successfully
- `400`: Bad request / Validation error
- `500`: Server error

## Testing

Run API tests:
```bash
npm test -- __tests__/api/products.test.ts
```

## Development

### Local Development
```bash
npm run dev
# API available at http://localhost:3000/api/products
```

### Production
```bash
npm run build
npm start
# API available at your-domain.com/api/products
```

## Security

- All endpoints require authentication (except GET /products)
- Rate limiting applied
- Input validation using Zod
- SQL injection prevention via Prisma
- XSS protection
- CSRF tokens for mutations 

## Versioning

The API follows semantic versioning. The current version is v1.
Future breaking changes will be introduced in new major versions.

## Testing

API endpoints can be tested using the provided Postman collection:
`/docs/postman/TimelessAccessories.postman_collection.json` 