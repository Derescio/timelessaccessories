'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { getCart, updateCartItem, removeFromCart } from '@/lib/actions/cart.actions';
import { triggerCartUpdate } from '@/lib/utils';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { useDebounce } from '@/hooks/use-debounce';

interface CartItem {
    id: string;
    slug: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

interface Cart {
    id: string;
    items: CartItem[];
}

export default function CartPageContent() {
    const { status } = useSession();
    const isAuthenticated = status === 'authenticated';
    const [isLoading, setIsLoading] = useState(true);
    const [cart, setCart] = useState<Cart | null>(null);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [pendingQuantities, setPendingQuantities] = useState<Record<string, number>>({});

    // Debounce pending quantity updates
    const debouncedQuantities = useDebounce(pendingQuantities, 500);

    // Load cart with caching
    const loadCart = useCallback(async () => {
        setIsLoading(true);
        try {
            const cartData = await getCart();
            setCart(cartData || null);
        } catch (error) {
            console.error('Error loading cart:', error);
            toast.error('Failed to load cart');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    // Handle debounced quantity updates
    useEffect(() => {
        const updateQuantities = async () => {
            for (const [itemId, quantity] of Object.entries(debouncedQuantities)) {
                if (quantity <= 0) {
                    await handleRemoveItem(itemId);
                } else {
                    try {
                        const result = await updateCartItem({ cartItemId: itemId, quantity });
                        if (result.success) {
                            triggerCartUpdate();
                        } else {
                            // Revert optimistic update on failure
                            setCart(prev => prev ? {
                                ...prev,
                                items: prev.items.map(item =>
                                    item.id === itemId ? { ...item, quantity: item.quantity } : item
                                )
                            } : null);
                            toast.error(result.message || 'Failed to update quantity');
                        }
                    } catch (error) {
                        console.error('Error updating quantity:', error);
                        toast.error('Failed to update quantity');
                    }
                }
            }
            setPendingQuantities({});
        };

        if (Object.keys(debouncedQuantities).length > 0) {
            updateQuantities();
        }
    }, [debouncedQuantities]);

    // Optimistic quantity update
    const handleQuantityChange = useCallback((itemId: string, newQuantity: number) => {
        // Optimistic update
        setCart(prev => prev ? {
            ...prev,
            items: prev.items.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            )
        } : null);

        // Queue for debounced API call
        setPendingQuantities(prev => ({
            ...prev,
            [itemId]: newQuantity
        }));
    }, []);

    // Remove item
    const handleRemoveItem = async (itemId: string) => {
        setIsUpdating(itemId);
        try {
            const result = await removeFromCart({ cartItemId: itemId });
            if (result.success) {
                setCart(prev => {
                    const updatedItems = prev?.items.filter(item => item.id !== itemId) || [];
                    return updatedItems.length > 0 && prev ? { ...prev, items: updatedItems } : null;
                });
                triggerCartUpdate();
                toast.success('Item removed from cart');
            } else {
                toast.error(result.message || 'Failed to remove item');
            }
        } catch (error) {
            console.error('Error removing item:', error);
            toast.error('Failed to remove item');
        } finally {
            setIsUpdating(null);
        }
    };

    // Calculate cart totals with memoization
    const cartTotals = useMemo(() => {
        const subtotal = cart?.items.reduce((total: number, item: CartItem) =>
            total + (item.price * item.quantity), 0) || 0;
        const estimatedTax = subtotal * 0.07; // 7% tax rate
        const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
        const total = subtotal + estimatedTax + shipping;

        return { subtotal, estimatedTax, shipping, total };
    }, [cart?.items]);

    const { subtotal, estimatedTax, shipping, total } = cartTotals;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-light mb-8">SHOPPING CART</h1>

            {isLoading ? (
                <div className="flex justify-center my-12">
                    <p>Loading cart...</p>
                </div>
            ) : !cart || cart.items.length === 0 ? (
                <div className="text-center my-12">
                    <p className="text-lg mb-4">Your cart is empty</p>
                    <Button asChild>
                        <Link href="/products">Start Shopping</Link>
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Cart items */}
                    <div className="w-full md:w-2/3 space-y-4">
                        {cart.items.map((item: CartItem) => (
                            <div key={item.id} className="flex flex-wrap md:flex-nowrap gap-4 p-4 border rounded-md">
                                <Link href={`/products/${item.slug}`} className="shrink-0">
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            width={100}
                                            height={100}
                                            className="rounded-md"
                                        />
                                    ) : (
                                        <div className="w-[100px] h-[100px] bg-gray-100 rounded-md" />
                                    )}
                                </Link>
                                <div className="flex-grow">
                                    <Link href={`/products/${item.slug}`}>
                                        <h3 className="font-medium hover:text-primary">{item.name}</h3>
                                    </Link>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        ${item.price.toFixed(2)}
                                    </p>
                                    <div className="flex items-center gap-4 mt-4">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                disabled={isUpdating === item.id}
                                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="w-8 text-center">{item.quantity}</span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                disabled={isUpdating === item.id}
                                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={isUpdating === item.id}
                                            onClick={() => handleRemoveItem(item.id)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                                <div className="w-full md:w-auto md:text-right">
                                    <p className="font-medium">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order summary */}
                    <div className="w-full md:w-1/3">
                        <div className="sticky top-4">
                            <Card className="p-6">
                                <h2 className="text-xl font-medium mb-4">Order Summary</h2>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Shipping</span>
                                            <span>${shipping.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Estimated Tax</span>
                                            <span>${estimatedTax.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between font-semibold text-lg">
                                            <span>Total</span>
                                            <span>${total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {isAuthenticated ? (
                                        <Button
                                            className="w-full"
                                            asChild
                                        >
                                            <Link href="/shipping">
                                                Proceed to Checkout
                                            </Link>
                                        </Button>
                                    ) : (
                                        <div className="space-y-3">
                                            {/* Primary CTA - Guest Checkout */}
                                            <Button
                                                className="w-full"
                                                asChild
                                            >
                                                <Link href="/shipping?guest=true">
                                                    Continue as Guest
                                                </Link>
                                            </Button>

                                            {/* Secondary CTA - Sign In */}
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                asChild
                                            >
                                                <Link href="/sign-in?callbackUrl=/cart">
                                                    Sign In for Faster Checkout
                                                </Link>
                                            </Button>

                                            {/* Benefits of signing in */}
                                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                                                <p className="text-xs text-blue-800 font-medium mb-1">Benefits of signing in:</p>
                                                <ul className="text-xs text-blue-700 space-y-1">
                                                    <li>• Save addresses for faster checkout</li>
                                                    <li>• Track your order history</li>
                                                    <li>• Faster returns and support</li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {!isAuthenticated ? (
                                        <p className="text-xs text-center text-muted-foreground mt-4">
                                            Your cart items will be saved to your account when you sign in
                                        </p>
                                    ) : (
                                        <p className="text-xs text-center text-muted-foreground mt-4">
                                            Taxes and shipping calculated at checkout
                                        </p>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 