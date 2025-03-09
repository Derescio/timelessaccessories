import { createMocks } from 'node-mocks-http';
import { getProducts, createProduct } from '@/app/api/products/route';
import { prisma } from '@/lib/db/config';

jest.mock('@/lib/db', () => ({
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
    it('returns all products', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Test Product',
          price: 99.99,
          description: 'Test description',
          images: ['/test-image.jpg'],
          categoryId: '1',
        },
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await getProducts(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(mockProducts);
    });

    it('handles errors gracefully', async () => {
      (prisma.product.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const { req, res } = createMocks({
        method: 'GET',
      });

      await getProducts(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Failed to fetch products' });
    });
  });

  describe('POST /api/products', () => {
    it('creates a new product', async () => {
      const mockProduct = {
        name: 'New Product',
        price: 129.99,
        description: 'New product description',
        images: ['/new-image.jpg'],
        categoryId: '1',
      };

      (prisma.product.create as jest.Mock).mockResolvedValue({ id: '2', ...mockProduct });

      const { req, res } = createMocks({
        method: 'POST',
        body: mockProduct,
      });

      await createProduct(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(JSON.parse(res._getData())).toHaveProperty('id');
    });

    it('validates required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { name: 'Invalid Product' }, // Missing required fields
      });

      await createProduct(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toHaveProperty('error');
    });
  });
}); 