import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/cards/ProductCard';
import { ProductCardProduct } from '@/types';

// Mock the wishlist actions
jest.mock('@/lib/actions/wishlist.actions', () => ({
    toggleWishlist: jest.fn(),
    getWishlistStatus: jest.fn().mockResolvedValue(false),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

describe('ProductCard', () => {
    const mockProduct: ProductCardProduct = {
        id: '1',
        name: 'Test Product',
        price: 99.99,
        compareAtPrice: null,
        discountPercentage: null,
        hasDiscount: false,
        slug: 'test-product',
        mainImage: '/test-image.jpg',
        images: [{ url: '/test-image.jpg' }],
        category: {
            name: 'Test Category',
            slug: 'test-category'
        },
        rating: 4.5,
        numReviews: 10,
        inventorySku: 'TEST-001',
        sku: 'TEST-001',
        quantity: 5
    };

    it('renders product information correctly', () => {
        render(<ProductCard product={mockProduct} />);

        expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
        expect(screen.getByText(`$${mockProduct.price.toFixed(2)}`)).toBeInTheDocument();
    });

    it('handles missing image gracefully', () => {
        const productWithoutImage = {
            ...mockProduct,
            mainImage: '',
            images: []
        };
        render(<ProductCard product={productWithoutImage} />);

        expect(screen.getByText(productWithoutImage.name)).toBeInTheDocument();
    });
}); 