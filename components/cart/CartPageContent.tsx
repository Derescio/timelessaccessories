'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { getCart, updateCartItem, removeFromCart } from '@/lib/actions/cart.actions';
import { triggerCartUpdate } from '@/lib/utils';
import { toast } from 'sonner';
import SplitText from '../ui/reactbits/hellotext';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { useDebounce } from '@/hooks/use-debounce';
import { CouponInput } from '@/components/checkout/CouponInput';
import { useCartPromotions, type AppliedPromotion } from '@/hooks/use-cart-promotions';

interface CartItem {
    id: string;
    slug: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    productId?: string;
    categoryId?: string;
}

interface Cart {
    id: string;
    items: CartItem[];
    promotions?: AppliedPromotion[];
    userId?: string | null;
    sessionId?: string | null;
    itemCount?: number;
    subtotal?: number;
    totalDiscount?: number;
    total?: number;
}

export default function CartPageContent() {
    const { data: session, status } = useSession();
    const isAuthenticated = status === 'authenticated';
    const [isLoading, setIsLoading] = useState(true);
    const [cart, setCart] = useState<Cart | null>(null);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [pendingQuantities, setPendingQuantities] = useState<Record<string, number>>({});
    const {
        appliedPromotions,
        addPromotion,
        removePromotion,
        getTotalDiscount,
        clearPromotions
    } = useCartPromotions(cart);

    // Debug cart and promotions state (can be removed in production)
    useEffect(() => {
        const storedPromotions = localStorage.getItem('cart-promotions-by-cart');
        const storedData = storedPromotions ? JSON.parse(storedPromotions) : null;

        console.log('🛒 [CART-DEBUG] Complete state:', {
            cartId: cart?.id,
            cartLoaded: !!cart,
            cartItemsCount: cart?.items?.length || 0,
            appliedPromotionsCount: appliedPromotions.length,
            appliedPromotions: appliedPromotions.map(p => ({ id: p.id, code: p.couponCode, discount: p.discount })),
            // LocalStorage debug
            localStorageData: storedData,
            localStorageCartIds: storedData ? Object.keys(storedData) : [],
            currentCartInStorage: storedData && cart?.id ? storedData[cart.id] : null,
            // Navigation debug
            currentUrl: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
            timestamp: new Date().toISOString()
        });
    }, [cart?.id, appliedPromotions]);

    // Debounce pending quantity updates
    const debouncedQuantities = useDebounce(pendingQuantities, 500);

    const [guestEmail, setGuestEmail] = useState("");

    // Create stable references to prevent infinite loops
    const cartItemsLength = cart?.items?.length || 0;
    const cartId = cart?.id;

    const handleAnimationComplete = () => {
        // Animation completed
    };

    // Load cart with caching
    const loadCart = useCallback(async () => {
        setIsLoading(true);
        try {
            const cartData = await getCart();
            setCart(cartData as Cart || null);
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

    // Handle promotion application
    const handleApplyPromotion = useCallback(async (promotion: AppliedPromotion) => {
        console.log('🛒 [CART] Applying promotion:', {
            promotionId: promotion.id,
            couponCode: promotion.couponCode,
            discount: promotion.discount,
            cartId: cart?.id,
            currentPromotionsCount: appliedPromotions.length,
            timestamp: new Date().toISOString()
        });

        const result = await addPromotion(promotion);

        if (result.success) {
            // Reload cart to get updated promotions
            await loadCart();
            // Don't show toast here - CouponInput already shows success toast
        } else {
            toast.error(result.error || 'Failed to apply promotion');
        }

        return result;
    }, [addPromotion, appliedPromotions.length, cart?.id, loadCart]);

    // Handle promotion removal
    const handleRemovePromotion = useCallback(async (promotionId: string) => {
        const removedPromotion = appliedPromotions.find(p => p.id === promotionId);
        console.log('🛒 [CART] Removing promotion:', {
            promotionId,
            removedPromotion,
            cartId: cart?.id,
            currentPromotionsCount: appliedPromotions.length,
            timestamp: new Date().toISOString()
        });

        const result = await removePromotion(promotionId);

        if (result.success) {
            // Reload cart to get updated promotions
            await loadCart();
            // Don't show toast here - CouponInput already shows success toast
        } else {
            toast.error(result.error || 'Failed to remove promotion');
        }

        return result;
    }, [removePromotion, appliedPromotions, cart?.id, loadCart]);

    // Calculate cart totals with memoization
    const cartTotals = useMemo(() => {
        const subtotal = cart?.items.reduce((total: number, item: CartItem) =>
            total + (item.price * item.quantity), 0) || 0;
        const totalDiscount = getTotalDiscount();
        const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
        const estimatedTax = discountedSubtotal * 0.07; // 7% tax rate
        const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
        const total = discountedSubtotal + estimatedTax + shipping;

        return { subtotal, totalDiscount, discountedSubtotal, estimatedTax, shipping, total };
    }, [cart?.items, appliedPromotions]);

    const { subtotal, totalDiscount, discountedSubtotal, estimatedTax, shipping, total } = cartTotals;

    // Removed complex validation logic to prevent infinite loops

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

                                        {/* Applied Promotions */}
                                        {appliedPromotions.map((promo) => (
                                            <div key={promo.id} className="flex justify-between text-green-600">
                                                <span className="text-sm">
                                                    {promo.couponCode} - {promo.name}
                                                </span>
                                                <span>-${promo.discount.toFixed(2)}</span>
                                            </div>
                                        ))}

                                        {totalDiscount > 0 && (
                                            <div className="flex justify-between text-green-600 font-medium">
                                                <span>Total Savings</span>
                                                <span>-${totalDiscount.toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between">
                                            <span>Shipping</span>
                                            <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
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

                                    {/* Guest Email Input (must come before promo codes) */}
                                    {!isAuthenticated && (
                                        <div className="border-t pt-4 mt-4">
                                            <label htmlFor="guest-email" className="block text-sm font-medium mb-2">
                                                Enter your email to use promo codes:
                                            </label>
                                            <input
                                                id="guest-email"
                                                type="email"
                                                value={guestEmail}
                                                onChange={e => setGuestEmail(e.target.value)}
                                                className="w-full border rounded px-3 py-2"
                                                placeholder="you@example.com"
                                                autoComplete="email"
                                                required
                                            />
                                        </div>
                                    )}

                                    {/* Coupon Input Section */}
                                    <div className="border-t pt-4 mt-4">
                                        <h3 className="font-medium mb-3">Have a Promo Code?</h3>

                                        <CouponInput
                                            onApply={handleApplyPromotion}
                                            onRemove={handleRemovePromotion}
                                            cartItems={cart.items.map(item => ({
                                                id: item.id,
                                                productId: item.productId || item.id,
                                                quantity: item.quantity,
                                                price: item.price,
                                                name: item.name,
                                                categoryId: item.categoryId
                                            }))}
                                            cartTotal={subtotal}
                                            appliedPromotions={appliedPromotions}
                                            maxPromotions={3}
                                            userEmail={isAuthenticated ? (session?.user?.email ?? undefined) : (guestEmail || undefined)}
                                            disabled={!isAuthenticated && !guestEmail.trim()}
                                        />

                                        {!isAuthenticated && !guestEmail.trim() && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Please enter your email above to apply promo codes
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-6">
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
                                                    {/* <p className="text-xs text-blue-800 font-medium mb-1">Benefits of signing in:</p> */}
                                                    <SplitText text="Benefits of signing in:" className="md:text-2xl text-lg font-semibold text-center" delay={100}
                                                        duration={0.6}
                                                        ease="power3.out"
                                                        splitType="chars"
                                                        from={{ opacity: 0, y: 40 }}
                                                        to={{ opacity: 1, y: 0 }}
                                                        threshold={0.1}
                                                        rootMargin="-100px"
                                                        textAlign="center" onLetterAnimationComplete={handleAnimationComplete} />
                                                    <ul className="text-xs text-blue-700 space-y-1">
                                                        <li>• Instant Welcome Bonus</li>
                                                        <li>• Promo Code WELCOME10</li>
                                                        <li>• Get Emailed Future Promo Codes</li>
                                                        <li>• Track Order History</li>
                                                        <li>• Faster checkout</li>


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
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 