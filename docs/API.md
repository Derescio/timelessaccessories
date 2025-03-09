# API Documentation

## Overview
This document outlines the RESTful API endpoints for the Timeless Accessories e-commerce platform. All API routes are prefixed with `/api`.

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