'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";

// Define interfaces for the component props and promotion data
interface CartItem {
    id?: string;
    productId?: string;
    quantity: number;
    price: number;
    name?: string;
    categoryId?: string;
    specialInstructions?: string;
}

interface Promotion {
    id: string;
    name: string;
    description?: string | null;
    type: string;
    couponCode?: string | null;
}

interface AppliedPromotion extends Promotion {
    discount: number;
    discountType: string;
    appliedTo: string[];
    freeItem?: {
        id: string;
        name: string;
    } | null;
}

interface CouponInputProps {
    onApply: (promotion: AppliedPromotion) => Promise<{ success: boolean; error?: string }>;
    onRemove?: (promotionId: string) => Promise<{ success: boolean; error?: string }>;
    cartItems: CartItem[];
    cartTotal: number;
    appliedPromotions?: AppliedPromotion[];
    disabled?: boolean;
    maxPromotions?: number;
    userEmail?: string; // For guest users or override
}

export function CouponInput({
    onApply,
    onRemove,
    cartItems,
    cartTotal,
    appliedPromotions = [],
    disabled = false,
    maxPromotions = 3,
    userEmail
}: CouponInputProps) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { data: session } = useSession();

    const canApplyMore = appliedPromotions.length < maxPromotions;

    const applyCoupon = async () => {
        if (!code.trim()) return;

        // Check if coupon is already applied
        if (appliedPromotions.some(p => p.couponCode?.toUpperCase() === code.toUpperCase())) {
            setError('This coupon is already applied');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/promotions/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: code.toUpperCase(),
                    cartItems,
                    cartTotal,
                    userId: session?.user?.id,
                    userEmail: userEmail || session?.user?.email
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to apply coupon');

                // Special handling for authentication required error
                if (response.status === 401) {
                    toast.error("Sign In Required", {
                        description: data.error || 'This coupon code requires you to be signed in',
                        action: {
                            label: "Sign In",
                            onClick: () => window.location.href = '/auth/signin'
                        }
                    });
                } else {
                    toast.error("Coupon Error", {
                        description: data.error || 'Failed to apply coupon code'
                    });
                }
                return;
            }

            const appliedPromotion: AppliedPromotion = {
                ...data.promotion,
                discount: data.discount,
                discountType: data.discountType,
                appliedTo: data.appliedTo,
                freeItem: data.freeItem
            };

            console.log('🎯 [COUPON-INPUT] Applying promotion:', {
                promotionId: appliedPromotion.id,
                couponCode: appliedPromotion.couponCode,
                discount: appliedPromotion.discount,
                timestamp: new Date().toISOString(),
                fullPromotion: appliedPromotion
            });

            const applyResult = await onApply(appliedPromotion);

            if (applyResult.success) {
                toast.success("Coupon Applied!", {
                    description: data.message,
                    action: {
                        label: "View Details",
                        onClick: () => console.log("Promotion details:", data.promotion)
                    }
                });

                // Clear the input after successful application
                setCode('');
            } else {
                setError(applyResult.error || 'Failed to apply promotion');
                toast.error("Application Failed", {
                    description: applyResult.error || 'Failed to apply promotion to cart'
                });
            }
        } catch (err) {
            const errorMessage = 'An error occurred while validating the coupon';
            setError(errorMessage);
            toast.error("Validation Failed", {
                description: "Please try again or contact support"
            });
        } finally {
            setLoading(false);
        }
    };

    const removeCoupon = async (promotionId: string) => {
        if (onRemove) {
            const result = await onRemove(promotionId);
            if (result.success) {
                toast.success("Coupon Removed", {
                    description: "The coupon has been removed from your order"
                });
            } else {
                toast.error("Removal Failed", {
                    description: result.error || "Failed to remove coupon"
                });
            }
        }
    };

    const getDiscountDisplay = (promotion: AppliedPromotion) => {
        switch (promotion.discountType) {
            case 'PERCENTAGE_DISCOUNT':
                return `$${promotion.discount.toFixed(2)} off`;
            case 'FIXED_AMOUNT_DISCOUNT':
                return `$${promotion.discount.toFixed(2)} off`;
            case 'FREE_ITEM':
                return promotion.freeItem ? `Free ${promotion.freeItem.name}` : 'Free item';
            case 'BUY_ONE_GET_ONE':
                return `$${promotion.discount.toFixed(2)} off (BOGO)`;
            default:
                return `$${promotion.discount.toFixed(2)} off`;
        }
    };

    return (
        <div className="space-y-4">
            {/* Applied Promotions */}
            {appliedPromotions.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Applied Coupons</h4>
                    {appliedPromotions.map((promotion) => (
                        <div
                            key={promotion.id}
                            className="relative p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                            <div className="flex items-start gap-2 pr-10">
                                <Tag className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-green-800">
                                            {promotion.couponCode}
                                        </span>
                                        <Badge variant="secondary" className="text-xs">
                                            {getDiscountDisplay(promotion)}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-green-600 mt-1">
                                        {promotion.name}
                                    </p>
                                    {promotion.appliedTo.length > 0 && (
                                        <p className="text-xs text-gray-500 mt-1 break-words">
                                            Applied to: {promotion.appliedTo.join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {onRemove && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeCoupon(promotion.id)}
                                    className="absolute top-2 right-2 h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-100 flex-shrink-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Coupon Input */}
            {canApplyMore && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Enter coupon code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            disabled={disabled || loading}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    applyCoupon();
                                }
                            }}
                            className="flex-1"
                        />
                        <Button
                            onClick={applyCoupon}
                            disabled={!code.trim() || loading || disabled}
                            className="whitespace-nowrap"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Apply Coupon
                        </Button>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {!canApplyMore && (
                        <p className="text-sm text-gray-500">
                            Maximum number of coupons applied ({maxPromotions})
                        </p>
                    )}
                </div>
            )}

            {/* Help Text */}
            <div className="text-xs text-gray-500">
                <p>• Enter your coupon code above and click "Apply Coupon"</p>
                <p>• Coupons are case-insensitive and will be automatically formatted</p>
                <p>• You can apply up to {maxPromotions} coupons per order</p>
            </div>
        </div>
    );
} 