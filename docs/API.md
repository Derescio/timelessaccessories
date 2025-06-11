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

### Guest Checkout Support
The API supports guest checkout for order creation and payment processing. Guest endpoints:
- Do not require authentication headers
- Use session-based cart identification
- Store guest email for order tracking
- Support all payment methods (PayPal, Stripe, LascoPay)

### Guest vs Authenticated Endpoints

**Guest Order Creation:**
```typescript
// POST /api/orders/guest
{
  cartId: string,
  guestEmail: string,
  shippingAddress: {...},
  paymentMethod: string
}
```

**Authenticated Order Creation:**
```typescript
// POST /api/orders
// Requires: Authorization header
{
  cartId: string,
  shippingAddress: {...},
  paymentMethod: string
  // userId extracted from JWT token
}
```

### Rate Limiting
- Anonymous requests: 100 requests per IP per hour
- Authenticated requests: 1000 requests per user per hour
- **Guest checkout requests: 50 requests per IP per hour** (stricter limits for security)

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

## Design Management API 🆕

### Design Library

#### GET /api/admin/designs
Fetch all designs in the library.

**Authentication:** Admin required

**Response:**
```json
{
  "designs": [
    {
      "id": "design_123",
      "name": "Dragon Logo",
      "description": "Mythical dragon design",
      "imageUrl": "/uploads/designs/design-1234567890.png",
      "thumbnailUrl": null,
      "width": 1000,
      "height": 1000,
      "fileSize": 245760,
      "fileType": "image/png",
      "tags": ["logo", "fantasy", "dragon"],
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "userId": "user_admin"
    }
  ]
}
```

#### POST /api/admin/designs/upload
Upload a new design file.

**Authentication:** Admin required

**Request:** FormData
- `file`: Image file (PNG, JPG, SVG, max 5MB)
- `name`: Design name (string, required)

**Response:**
```json
{
  "success": true,
  "design": {
    "id": "design_123",
    "name": "Dragon Logo",
    "imageUrl": "/uploads/designs/design-1234567890.png",
    "width": 1000,
    "height": 1000
  }
}
```

**Error Responses:**
- `400`: No file provided, invalid file type, file too large
- `401`: Unauthorized
- `403`: Forbidden (not admin)
- `500`: Upload failed

### Product Design Application

#### GET /api/admin/products/{productId}/designs
Get all designs applied to a product.

**Authentication:** Admin required

**Response:**
```json
{
  "productDesigns": [
    {
      "id": "pd_123",
      "productId": "product_456",
      "designId": "design_123",
      "position": "front",
      "x": 50.0,
      "y": 40.0,
      "scale": 80.0,
      "angle": 0.0,
      "layer": 1,
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "design": {
        "id": "design_123",
        "name": "Dragon Logo",
        "imageUrl": "/uploads/designs/design-1234567890.png",
        "width": 1000,
        "height": 1000
      }
    }
  ]
}
```

#### POST /api/admin/products/{productId}/designs
Apply a design to a product.

**Authentication:** Admin required

**Request:**
```json
{
  "designId": "design_123",
  "position": "front",
  "x": 50.0,
  "y": 40.0,
  "scale": 80.0,
  "angle": 0.0
}
```

**Response:**
```json
{
  "success": true,
  "productDesign": {
    "id": "pd_123",
    "productId": "product_456",
    "designId": "design_123",
    "position": "front",
    "x": 50.0,
    "y": 40.0,
    "scale": 80.0,
    "angle": 0.0,
    "layer": 1
  }
}
```

#### DELETE /api/admin/products/{productId}/designs/{designId}
Remove a design from a product.

**Authentication:** Admin required

**Response:**
```json
{
  "success": true,
  "message": "Design removed from product"
}
```

### Mockup Generation

#### POST /api/admin/products/{productId}/generate-mockups
Generate mockup images for a product with applied designs.

**Authentication:** Admin required

**Response:**
```json
{
  "success": true,
  "mockupsCount": 3,
  "mockups": [
    {
      "variant": "front-view",
      "imageUrl": "/uploads/mockups/product_456_front.jpg"
    },
    {
      "variant": "back-view", 
      "imageUrl": "/uploads/mockups/product_456_back.jpg"
    }
  ]
}
```

## Printify Integration API 🆕

### Catalog Management

#### GET /api/admin/printify/catalog
Browse Printify blueprint catalog.

**Authentication:** Admin required

**Response:**
```json
{
  "success": true,
  "blueprints": [
    {
      "id": 9,
      "title": "Unisex Heavy Cotton Tee",
      "description": "High-quality cotton t-shirt",
      "brand": "Gildan",
      "model": "5000",
      "images": [
        "https://printify.com/image1.jpg",
        "https://printify.com/image2.jpg"
      ]
    }
  ]
}
```

#### POST /api/admin/printify/import-product
Import a Printify blueprint as a local product.

**Authentication:** Admin required

**Request:**
```json
{
  "blueprintId": 9,
  "printProviderId": 1,
  "categoryId": "cat_123",
  "markup": 150
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product imported successfully",
  "product": {
    "id": "product_456",
    "name": "Unisex Heavy Cotton Tee",
    "slug": "unisex-heavy-cotton-tee",
    "variants": 12
  }
}
```

### Product Management

#### GET /api/admin/printify/products
List imported Printify products.

**Authentication:** Admin required

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "product_456",
      "title": "Unisex Heavy Cotton Tee",
      "status": "Not created in Printify",
      "variants": 12,
      "images": ["/placeholder-1.jpg"],
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### POST /api/admin/printify/sync-product
Sync a product with latest Printify data.

**Authentication:** Admin required

**Request:**
```json
{
  "productId": "product_456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product synced with blueprint data (2 changes)",
  "changes": {
    "name": {
      "from": "Old Name",
      "to": "Updated Name"
    },
    "description": {
      "from": "Old Description", 
      "to": "Updated Description"
    }
  },
  "note": "Printify product will be created when first order is placed"
}
```

#### DELETE /api/admin/printify/products/{productId}
Remove an imported Printify product.

**Authentication:** Admin required

**Response:**
```json
{
  "success": true,
  "message": "Product removed successfully"
}
```

### Connection Management

#### GET /api/admin/printify/test-connection
Test Printify API connection and credentials.

**Authentication:** Admin required

**Response:**
```json
{
  "success": true,
  "message": "Connected to Printify successfully",
  "shopInfo": {
    "id": 12345,
    "title": "My Store",
    "sales_channel": "api"
  }
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (in development)",
  "code": "ERROR_CODE" // Optional error code
}
```

### Common Error Codes:
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions  
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid request data
- `PRINTIFY_ERROR` (500): Printify API error
- `UPLOAD_ERROR` (400): File upload error

### Rate Limiting:
- Printify API: 600 requests per minute
- Design uploads: 10 per minute per user
- Mockup generation: 5 per minute per user

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