'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ShoppingCart, Trash, Loader } from 'lucide-react';
import { getCart, updateCartItem, removeFromCart } from '@/lib/actions/cart.actions';
import { triggerCartUpdate } from '@/lib/utils';
import { CartItemDetails } from '@/types';
import { toast } from 'sonner';

export default function CartPageContent() {
    const [cartItems, setCartItems] = useState<CartItemDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    // Load cart items
    useEffect(() => {
        async function loadCart() {
            setIsLoading(true);
            try {
                const result = await getCart();
                if (result) {
                    setCartItems(result.items || []);
                }
            } catch (error) {
                console.error('Error loading cart:', error);
                toast.error('Failed to load cart');
            } finally {
                setIsLoading(false);
            }
        }

        loadCart();

        // Listen for cart updates
        const handleCartUpdate = () => {
            loadCart();
        };

        window.addEventListener('cart-updated', handleCartUpdate);
        return () => {
            window.removeEventListener('cart-updated', handleCartUpdate);
        };
    }, []);

    const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        setIsUpdating(itemId);
        try {
            console.log(`Updating cart item ${itemId} to quantity ${newQuantity}`);

            const result = await updateCartItem({
                cartItemId: itemId,
                quantity: newQuantity
            });

            console.log('Update result:', result);

            if (result.success) {
                // Update local state
                setCartItems(prev => prev.map(item =>
                    item.id === itemId ? { ...item, quantity: newQuantity } : item
                ));
                triggerCartUpdate();
                toast.success('Quantity updated', {
                    duration: 3000,
                });
            } else {
                toast.error(result.message || 'Failed to update item');
            }
        } catch (error) {
            console.error('Error updating cart item:', error);
            toast.error('Failed to update item');
        } finally {
            setIsUpdating(null);
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        setIsUpdating(itemId);
        try {
            const result = await removeFromCart({
                cartItemId: itemId
            });

            if (result.success) {
                // Remove from local state
                setCartItems(prev => prev.filter(item => item.id !== itemId));
                toast.success('Item removed from cart', {
                    duration: 3000,
                });
                triggerCartUpdate();
            } else {
                toast.error(result.message || 'Failed to remove item');
            }
        } catch (error) {
            console.error('Error removing cart item:', error);
            toast.error('Failed to remove item');
        } finally {
            setIsUpdating(null);
        }
    };

    // Calculate cart totals
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const estimatedTax = subtotal * 0.07; // 7% tax rate
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    const total = subtotal + estimatedTax + shipping;

    // If cart is empty
    if (!isLoading && cartItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-6">Looks like you haven&apos;t added any items to your cart yet.</p>
                <Button asChild>
                    <Link href="/products">Browse Products</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row gap-8">
            {/* Cart items */}
            <div className="w-full md:w-2/3 space-y-4">
                {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 border rounded-md">
                        <Link href={`/products/${item.slug}`} className="shrink-0">
                            <Image
                                src={item.image}
                                alt={item.name}
                                width={96}
                                height={96}
                                className="object-cover rounded-md"
                            />
                        </Link>
                        <div className="flex-1">
                            <Link href={`/products/${item.slug}`} className="hover:underline">
                                <h3 className="font-medium">{item.name}</h3>
                            </Link>
                            <div className="text-sm text-muted-foreground mb-4">
                                ${item.price.toFixed(2)} {item.hasDiscount && item.discountPercentage && (
                                    <span className="inline-block ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded">
                                        {item.discountPercentage}% OFF
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center border rounded-md">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-r-none"
                                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                        disabled={isUpdating === item.id || item.quantity <= 1}
                                    >
                                        {isUpdating === item.id ? (
                                            <Loader className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Minus className="h-3 w-3" />
                                        )}
                                    </Button>
                                    <div className="w-10 text-center">
                                        <span className="text-sm font-medium">{item.quantity}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-l-none"
                                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                        disabled={isUpdating === item.id || item.quantity >= item.maxQuantity}
                                    >
                                        {isUpdating === item.id ? (
                                            <Loader className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Plus className="h-3 w-3" />
                                        )}
                                    </Button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleRemoveItem(item.id)}
                                        disabled={isUpdating === item.id}
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Order summary */}
            <div className="w-full md:w-1/3 sticky top-20">
                <div className="border rounded-md p-4 space-y-4">
                    <h2 className="text-lg font-semibold">Order Summary</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Estimated Tax</span>
                            <span>${estimatedTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping</span>
                            <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                        </div>
                    </div>
                    <div className="pt-4 border-t">
                        <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                    <Button className="w-full">Proceed to Checkout</Button>
                </div>
            </div>
        </div>
    );
} 