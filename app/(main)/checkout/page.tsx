'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CouponInput } from '@/components/checkout/CouponInput';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, CreditCard, Truck, Tag } from 'lucide-react';

// Sample cart items for demonstration
const sampleCartItems = [
    {
        id: '1',
        productId: 'prod_1',
        name: 'Classic T-Shirt',
        price: 29.99,
        quantity: 2,
        categoryId: 'cat_1'
    },
    {
        id: '2',
        productId: 'prod_2',
        name: 'Premium Hoodie',
        price: 59.99,
        quantity: 1,
        categoryId: 'cat_2'
    },
    {
        id: '3',
        productId: 'prod_3',
        name: 'Designer Mug',
        price: 19.99,
        quantity: 3,
        categoryId: 'cat_3'
    }
];

interface AppliedPromotion {
    id: string;
    name: string;
    description?: string | null;
    type: string;
    couponCode?: string | null;
    discount: number;
    discountType: string;
    appliedTo: string[];
    freeItem?: {
        id: string;
        name: string;
    } | null;
}

export default function CheckoutPage() {
    const [cartItems] = useState(sampleCartItems);
    const [appliedPromotions, setAppliedPromotions] = useState<AppliedPromotion[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalDiscount = appliedPromotions.reduce((sum, promo) => sum + promo.discount, 0);
    const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
    const tax = (subtotal - totalDiscount) * 0.08; // 8% tax
    const total = subtotal - totalDiscount + shipping + tax;

    const handleApplyPromotion = (promotion: AppliedPromotion) => {
        setAppliedPromotions(prev => [...prev, promotion]);
    };

    const handleRemovePromotion = (promotionId: string) => {
        setAppliedPromotions(prev => prev.filter(p => p.id !== promotionId));
    };

    const handleCheckout = async () => {
        setIsProcessing(true);

        try {
            // Here you would integrate with your payment processing
            // and track promotion usage

            // Track promotion usage for each applied promotion
            for (const promotion of appliedPromotions) {
                await fetch('/api/promotions/track-usage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        promotionId: promotion.id,
                        userId: 'user_123', // Replace with actual user ID
                        discountAmount: promotion.discount,
                        originalAmount: subtotal,
                        finalAmount: total,
                        couponCode: promotion.couponCode,
                        cartItemCount: cartItems.length
                    })
                });
            }

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            alert('Order placed successfully!');
        } catch (error) {
            console.error('Checkout error:', error);
            alert('There was an error processing your order. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Order Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Order Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-medium">{item.name}</h4>
                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>

                                {appliedPromotions.map((promo) => (
                                    <div key={promo.id} className="flex justify-between text-green-600">
                                        <span className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                {promo.couponCode}
                                            </Badge>
                                            {promo.name}
                                        </span>
                                        <span>-${promo.discount.toFixed(2)}</span>
                                    </div>
                                ))}

                                <div className="flex justify-between">
                                    <span className="flex items-center gap-2">
                                        <Truck className="h-4 w-4" />
                                        Shipping
                                    </span>
                                    <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span>Tax</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>

                                <Separator />

                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Applied Promotions Display */}
                    {appliedPromotions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Applied Promotions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {appliedPromotions.map((promo) => (
                                        <div key={promo.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Tag className="h-4 w-4 text-green-600" />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-green-800">{promo.couponCode}</span>
                                                        <Badge variant="secondary" className="text-xs">
                                                            ${promo.discount.toFixed(2)} off
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-green-600">{promo.name}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <p className="text-xs text-gray-500 mt-2">
                                        Promotions were applied in your cart. To modify, please go back to your cart.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Payment & Shipping */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                Shipping Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium">John Doe</h4>
                                <p className="text-sm text-gray-600">
                                    123 Main Street<br />
                                    Anytown, ST 12345<br />
                                    United States
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-green-600">
                                <Truck className="h-4 w-4" />
                                {shipping === 0 ? 'Free shipping applied!' : 'Standard shipping (5-7 business days)'}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Payment Method
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    <span className="font-medium">•••• •••• •••• 1234</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">Expires 12/25</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        onClick={handleCheckout}
                        disabled={isProcessing}
                        className="w-full h-12 text-lg"
                        size="lg"
                    >
                        {isProcessing ? 'Processing...' : `Complete Order - $${total.toFixed(2)}`}
                    </Button>

                    <div className="text-xs text-gray-500 text-center space-y-1">
                        <p>By completing your order, you agree to our Terms of Service and Privacy Policy.</p>
                        <p>Your payment information is secure and encrypted.</p>
                    </div>
                </div>
            </div>

            {/* Promotion Benefits Display */}
            {appliedPromotions.length > 0 && (
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="text-green-600">🎉 You're Saving Money!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {appliedPromotions.map((promo) => (
                                <div key={promo.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-green-600">{promo.couponCode}</Badge>
                                        <span className="font-medium text-green-800">${promo.discount.toFixed(2)} off</span>
                                    </div>
                                    <h4 className="font-medium text-green-800">{promo.name}</h4>
                                    {promo.description && (
                                        <p className="text-sm text-green-600 mt-1">{promo.description}</p>
                                    )}
                                    {promo.appliedTo.length > 0 && (
                                        <p className="text-xs text-gray-600 mt-2">
                                            Applied to: {promo.appliedTo.join(', ')}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-4 bg-green-100 rounded-lg text-center">
                            <p className="text-lg font-bold text-green-800">
                                Total Savings: ${totalDiscount.toFixed(2)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 