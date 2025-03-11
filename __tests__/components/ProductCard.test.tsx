import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ProductCard from '@/components/ProductCard';

describe('ProductCard', () => {
    const mockProduct = {
        id: '1',
        name: 'Test Product',
        price: 99.99,
        description: 'Test description',
        images: ['/test-image.jpg'],
        category: { name: 'Test Category', id: '1' }
    };

    it('renders product information correctly', () => {
        render(<ProductCard product={mockProduct} />);

        expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
        expect(screen.getByText(`$${mockProduct.price}`)).toBeInTheDocument();
        expect(screen.getByAltText(mockProduct.name)).toHaveAttribute('src', mockProduct.images[0]);
    });

    it('handles missing image gracefully', () => {
        const productWithoutImage = { ...mockProduct, images: [] };
        render(<ProductCard product={productWithoutImage} />);

        expect(screen.getByText(productWithoutImage.name)).toBeInTheDocument();
        // Should show placeholder image
        expect(screen.getByAltText(productWithoutImage.name)).toHaveAttribute('src', '/placeholder.jpg');
    });
}); 