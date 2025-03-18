'use client';

import { useState } from 'react';
import { addToCart } from '@/lib/actions/cart.actions';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, Loader } from 'lucide-react';
import { triggerCartUpdate } from '@/lib/utils';
import { toast } from 'sonner';
// import { CartItemDetails } from '@/types';

// Define a type for the cart action result
interface CartActionResult {
    success: boolean;
    message: string;
    item?: {
        id: string;
        quantity: number;
        [key: string]: unknown;
    } | {
        id: string;
        productId: string;
        inventoryId: string;
        name: string;
        slug: string;
        quantity: number;
        price: number;
        image: string;
        discountPercentage: number | null;
        hasDiscount: boolean;
        maxQuantity: number;
        [key: string]: unknown;
    };
}

interface AddToCartButtonProps {
    productId: string;
    inventoryId: string;
    quantity?: number;
    disabled?: boolean;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
    showIcon?: boolean;
    onSuccess?: (result: CartActionResult) => void;
}

export default function AddToCartButton({
    productId,
    inventoryId,
    quantity = 1,
    disabled = false,
    variant = 'default',
    size = 'default',
    className = '',
    showIcon = true,
    onSuccess,
}: AddToCartButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleAddToCart = async () => {
        console.log('AddToCartButton clicked:', { productId, inventoryId, quantity });

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
                quantity,
            });

            console.log('Add to cart result:', result);

            if (result.success) {
                setIsSuccess(true);
                toast.success(result.message || 'Item added to cart', {
                    action: {
                        label: "Go to Cart",
                        onClick: () => window.location.href = "/cart"
                    },
                    duration: 5000, // Show for 5 seconds to give time to click
                });
                console.log('Triggering cart update event');
                triggerCartUpdate();

                // Call onSuccess callback if provided
                if (onSuccess) {
                    console.log('Calling onSuccess callback');
                    // Cast the result to CartActionResult to satisfy TypeScript
                    onSuccess(result as unknown as CartActionResult);
                } else {
                    // Reset success state after a delay if no onSuccess callback
                    setTimeout(() => {
                        console.log('Resetting success state');
                        setIsSuccess(false);
                    }, 2000);
                }
            } else {
                toast.error(result.message || 'Failed to add item to cart');
                console.error('Add to cart failed:', result.message);
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
            variant={variant}
            size={size}
            className={className}
            disabled={disabled || isLoading}
            onClick={handleAddToCart}
        >
            {isLoading ? (
                <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                </>
            ) : isSuccess && !onSuccess ? (
                <>
                    <Check className="mr-2 h-4 w-4" />
                    Added to Cart
                </>
            ) : (
                <>
                    {showIcon && <ShoppingCart className="mr-2 h-4 w-4" />}
                    Add to Cart
                </>
            )}
        </Button>
    );
} 