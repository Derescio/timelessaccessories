'use client';

import { useState, useRef } from 'react';
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
    selectedAttributes?: Record<string, string>;
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
    selectedAttributes,
}: AddToCartButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const requestInProgress = useRef(false);
    const lastRequestTime = useRef(0);

    const handleAddToCart = async () => {
        // Prevent multiple simultaneous requests with debounce
        const now = Date.now();
        if (requestInProgress.current || isLoading || (now - lastRequestTime.current < 1000)) {
            console.log('AddToCartButton - Request blocked (duplicate/too frequent)');
            return;
        }

        // Validate inputs before making request
        if (!productId || !inventoryId) {
            console.error('AddToCartButton - Missing required data:', { productId, inventoryId });
            toast.error('Invalid product configuration');
            return;
        }

        // Add detailed logging with type information
        console.log('AddToCartButton - handleAddToCart called with:', {
            productId: productId,
            inventoryId: inventoryId,
            inventoryIdType: typeof inventoryId,
            inventoryIdLength: inventoryId?.length,
            inventoryIdIsUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inventoryId),
            quantity,
            selectedAttributes
        });

        requestInProgress.current = true;
        lastRequestTime.current = now;
        setIsLoading(true);

        try {
            // Get session ID from cookie if not logged in
            const sessionId = document.cookie
                .split('; ')
                .find(row => row.startsWith('sessionCartId='))
                ?.split('=')[1];

            console.log('AddToCartButton - Making addToCart request...');

            const result = await addToCart({
                productId,
                inventoryId,
                quantity,
                sessionId,
                selectedAttributes,
            });

            console.log('AddToCartButton - addToCart result:', result);

            if (result?.success) {
                setIsSuccess(true);
                toast.success(result.message || 'Item added to cart', {
                    action: {
                        label: "Go to Cart",
                        onClick: () => window.location.href = "/cart"
                    },
                    duration: 5000,
                });
                triggerCartUpdate();

                if (onSuccess && result.item) {
                    onSuccess(result as unknown as CartActionResult);
                } else if (!result.item) {
                    console.warn('AddToCartButton - Success but no item details returned');
                    // Still trigger success behavior even if item details missing
                    setTimeout(() => {
                        setIsSuccess(false);
                    }, 500);
                } else {
                    setTimeout(() => {
                        setIsSuccess(false);
                    }, 500);
                }
            } else {
                toast.error('Oops, something went wrong, It seems another customer has purchased the last of this item. ' + result?.message + ' Please Contact our support team' || 'Failed to add item to cart');
                // console.error('Add to cart failed:', result?.message);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add item to cart');
        } finally {
            setIsLoading(false);
            // Add delay before allowing next request
            setTimeout(() => {
                requestInProgress.current = false;
            }, 500);
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