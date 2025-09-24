import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/products/route';
import { db } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  db: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

describe('Products API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('returns all products successfully', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Test Product',
          description: 'Test description',
          categoryId: '1',
          category: { id: '1', name: 'Test Category', slug: 'test' },
          inventories: [{
            id: '1',
            retailPrice: 99.99,
            costPrice: 50.00,
            quantity: 10,
            sku: 'TEST-001',
            images: ['/test-image.jpg'],
            hasDiscount: false,
            discountPercentage: null,
            compareAtPrice: null
          }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (db.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (db.product.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/products');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('handles errors when fetching products', async () => {
      (db.product.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/products');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch products');
    });
  });

  describe('POST /api/products', () => {
    it('creates a new product successfully', async () => {
      const { auth } = require('@/auth');
      auth.mockResolvedValue({ user: { role: 'ADMIN' } });

      const mockProduct = {
        name: 'New Product',
        description: 'New product description',
        slug: 'new-product',
        price: 129.99,
        costPrice: 65.00,
        categoryId: '1',
        productTypeId: '1',
        sku: 'NEW-001',
        stock: 10,
        isActive: true,
        isFeatured: false,
        imageUrl: '/new-image.jpg',
      };

      const mockCreatedProduct = {
        id: '2',
        ...mockProduct,
        inventories: [{
          id: '1',
          retailPrice: 129.99,
          costPrice: 65.00,
          quantity: 10,
          sku: 'NEW-001',
          images: ['/new-image.jpg'],
          isDefault: true,
        }],
        category: { id: '1', name: 'Test Category' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.product.findUnique as jest.Mock).mockResolvedValue(null);
      (db.product.create as jest.Mock).mockResolvedValue(mockCreatedProduct);

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(mockProduct),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('handles validation errors when creating product', async () => {
      const { auth } = require('@/auth');
      auth.mockResolvedValue({ user: { role: 'ADMIN' } });

      const invalidProduct = {
        name: 'Invalid Product',
        // Missing required fields
      };

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(invalidProduct),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });
  });
}); 