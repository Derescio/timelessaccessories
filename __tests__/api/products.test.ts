import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/products/route';
import { prisma } from '@/lib/db/config';

jest.mock('@/lib/db/config', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
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
          price: 99.99,
          description: 'Test description',
          images: ['/test-image.jpg'],
          categoryId: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockProducts);
    });

    it('handles errors when fetching products', async () => {
      (prisma.product.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch products');
    });
  });

  describe('POST /api/products', () => {
    it('creates a new product successfully', async () => {
      const mockProduct = {
        name: 'New Product',
        price: 129.99,
        description: 'New product description',
        images: ['/new-image.jpg'],
        categoryId: '1',
      };

      const mockCreatedProduct = {
        id: '2',
        ...mockProduct,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.product.create as jest.Mock).mockResolvedValue(mockCreatedProduct);

      const request = new Request('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(mockProduct),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockCreatedProduct);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: mockProduct,
      });
    });

    it('handles validation errors when creating product', async () => {
      const invalidProduct = {
        name: 'Invalid Product',
        // Missing required fields
      };

      const request = new Request('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(invalidProduct),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Failed to create product');
    });
  });
}); 