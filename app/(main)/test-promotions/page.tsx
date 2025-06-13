'use client';

import { useCartPromotions } from '@/hooks/use-cart-promotions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TestPromotionsPage() {
    const {
        appliedPromotions,
        addPromotion,
        removePromotion,
        clearPromotions,
        getTotalDiscount,
        isLoaded
    } = useCartPromotions();

    const addTestPromotion = () => {
        addPromotion({
            id: 'test-promo-1',
            name: 'Test Summer Sale',
            description: 'Test promotion for debugging',
            type: 'PERCENTAGE_DISCOUNT',
            couponCode: 'SUMMER2025',
            discount: 25.00,
            discountType: 'PERCENTAGE_DISCOUNT',
            appliedTo: ['All items'],
            freeItem: null
        });
    };

    if (!isLoaded) {
        return <div>Loading promotions...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">Promotions Persistence Test</h1>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Current Promotions ({appliedPromotions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {appliedPromotions.length === 0 ? (
                        <p className="text-gray-500">No promotions applied</p>
                    ) : (
                        <div className="space-y-2">
                            {appliedPromotions.map((promo) => (
                                <div key={promo.id} className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded">
                                    <div>
                                        <span className="font-medium">{promo.couponCode}</span>
                                        <span className="text-sm text-gray-600 ml-2">{promo.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-600 font-medium">${promo.discount.toFixed(2)} off</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removePromotion(promo.id)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between font-bold">
                                    <span>Total Discount:</span>
                                    <span className="text-green-600">${getTotalDiscount().toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex gap-2">
                    <Button onClick={addTestPromotion}>
                        Add Test Promotion
                    </Button>
                    <Button variant="outline" onClick={clearPromotions}>
                        Clear All
                    </Button>
                </div>

                <div className="space-y-2">
                    <h3 className="font-medium">Test Navigation:</h3>
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" asChild>
                            <Link href="/cart">Go to Cart</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/shipping?guest=true">Go to Shipping</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/cart-demo">Go to Cart Demo</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/confirmation">Go to Confirmation</Link>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <p>1. Add a test promotion using the button above</p>
                        <p>2. Navigate to different pages using the links</p>
                        <p>3. Come back to this page to verify the promotion persisted</p>
                        <p>4. Check that the promotion shows up in cart, shipping, and confirmation pages</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 