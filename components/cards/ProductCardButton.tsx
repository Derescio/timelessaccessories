'use client';

import { useState } from 'react';
import { addToCart } from '@/lib/actions/cart.actions';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, Loader } from 'lucide-react';
import { triggerCartUpdate } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductCardButtonProps {
    productId: string;
    inventoryId: string;
    className?: string;
}

export default function ProductCardButton({
    productId,
    inventoryId,
    className = '',
}: ProductCardButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleAddToCart = async () => {
        console.log('Add to cart clicked', { productId, inventoryId });

        if (!inventoryId) {
            console.error('Invalid inventory ID:', inventoryId);
            toast.error('Invalid inventory configuration');
            return;
        }

        setIsLoading(true);
        try {
            const result = await addToCart({
                productId,
                inventoryId,
                quantity: 1,
            });

            console.log('Add to cart result:', result);

            if (result.success) {
                setIsSuccess(true);
                toast.success(result.message || 'Item added to cart', {
                    action: {
                        label: "Go to Cart",
                        onClick: () => window.location.href = "/cart"
                    },
                    duration: 5000, // Show the toast for 5 seconds to give user time to click
                });
                console.log('Triggering cart update event');
                triggerCartUpdate();

                // Reset success state after a delay
                setTimeout(() => {
                    console.log('Resetting success state');
                    setIsSuccess(false);
                }, 3000); // Increase to 3 seconds for better visual feedback
            } else {
                toast.error(result.message || 'Failed to add item to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add item to cart');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            className={`w-full ${className}`}
            size="sm"
            onClick={handleAddToCart}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                </>
            ) : isSuccess ? (
                <>
                    <Check className="w-4 h-4 mr-2" />
                    Added
                </>
            ) : (
                <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                </>
            )}
        </Button>
    );
} 