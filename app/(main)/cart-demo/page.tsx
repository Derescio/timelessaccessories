'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CouponInput } from '@/components/checkout/CouponInput';
import { useCartPromotions, type AppliedPromotion } from '@/hooks/use-cart-promotions';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

// Demo cart items
const demoCartItems = [
    {
        id: '1',
        productId: 'prod_1',
        name: 'Classic T-Shirt',
        price: 29.99,
        quantity: 2,
        categoryId: 'cat_1',
        image: '/placeholder-product.jpg'
    },
    {
        id: '2',
        productId: 'prod_2',
        name: 'Premium Hoodie',
        price: 59.99,
        quantity: 1,
        categoryId: 'cat_2',
        image: '/placeholder-product.jpg'
    },
    {
        id: '3',
        productId: 'prod_3',
        name: 'Designer Mug',
        price: 19.99,
        quantity: 3,
        categoryId: 'cat_3',
        image: '/placeholder-product.jpg'
    }
];

export default function CartDemoPage() {
    const [cartItems, setCartItems] = useState(demoCartItems);

    // Create mock cart data for the demo
    const mockCartData = {
        id: 'demo-cart-123',
        items: cartItems.map(item => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            product: {
                name: item.name,
                slug: item.name.toLowerCase().replace(/\s+/g, '-')
            },
            inventory: {
                retailPrice: item.price
            }
        })),
        promotions: [] // Will be managed by the hook
    };

    const {
        appliedPromotions,
        addPromotion,
        removePromotion,
        getTotalDiscount
    } = useCartPromotions(mockCartData);

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalDiscount = getTotalDiscount();
    const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
    const shipping = subtotal > 50 ? 0 : 9.99;
    const tax = discountedSubtotal * 0.08;
    const total = discountedSubtotal + shipping + tax;

    const updateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            setCartItems(prev => prev.filter(item => item.id !== itemId));
        } else {
            setCartItems(prev => prev.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            ));
        }
    };

    const handleApplyPromotion = async (promotion: AppliedPromotion): Promise<{ success: boolean, error?: string }> => {
        try {
            // For demo purposes, simulate the database operation
            const result = await addPromotion(promotion);
            if (result.success) {
                toast.success(`Applied ${promotion.couponCode} promotion!`);
                return { success: true };
            } else {
                toast.error(result.error || 'Failed to apply promotion');
                return { success: false, error: result.error };
            }
        } catch (error) {
            const errorMessage = 'Failed to apply promotion';
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const handleRemovePromotion = async (promotionId: string): Promise<{ success: boolean, error?: string }> => {
        try {
            // For demo purposes, simulate the database operation
            const result = await removePromotion(promotionId);
            if (result.success) {
                toast.success('Promotion removed!');
                return { success: true };
            } else {
                toast.error(result.error || 'Failed to remove promotion');
                return { success: false, error: result.error };
            }
        } catch (error) {
            const errorMessage = 'Failed to remove promotion';
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Cart with Promotions Demo</h1>
                <p className="text-gray-600 mb-2">
                    Test the promotions system with sample cart items. This demo uses the database-first promotion persistence system.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p className="font-medium mb-1">🧪 Demo Mode:</p>
                    <p>This page demonstrates the promotion system with mock data. Real promotions from your database will work here too!</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Cart Items ({cartItems.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                                        <ShoppingCart className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-medium">{item.name}</h3>
                                        <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-8 text-center">{item.quantity}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Order Summary & Promotions */}
                <div className="space-y-6">
                    {/* Order Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                    <div className="flex justify-between text-green-600 font-medium border-t pt-2">
                                        <span>Total Savings</span>
                                        <span>-${totalDiscount.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Promotions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Promo Codes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CouponInput
                                onApply={handleApplyPromotion}
                                onRemove={handleRemovePromotion}
                                cartItems={cartItems}
                                cartTotal={subtotal}
                                appliedPromotions={appliedPromotions}
                                maxPromotions={3}
                            />
                        </CardContent>
                    </Card>

                    {/* Demo Instructions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Demo Instructions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <h4 className="font-medium mb-2">Test Coupon Codes:</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <Badge variant="outline">WELCOME10</Badge>
                                        <span className="text-gray-600">10% off</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <Badge variant="outline">SAVE20</Badge>
                                        <span className="text-gray-600">$20 off</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <Badge variant="outline">FREESHIP</Badge>
                                        <span className="text-gray-600">Free shipping</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">
                                <p>• Try applying multiple coupons</p>
                                <p>• Change quantities to see recalculation</p>
                                <p>• Remove promotions to test functionality</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Savings Summary */}
            {totalDiscount > 0 && (
                <Card className="mt-8 bg-green-50 border-green-200">
                    <CardContent className="p-6 text-center">
                        <h3 className="text-xl font-bold text-green-800 mb-2">
                            🎉 You're Saving ${totalDiscount.toFixed(2)}!
                        </h3>
                        <div className="flex flex-wrap justify-center gap-2">
                            {appliedPromotions.map((promo) => (
                                <Badge key={promo.id} className="bg-green-600">
                                    {promo.couponCode}: ${promo.discount.toFixed(2)} off
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Toaster />
        </div>
    );
} 