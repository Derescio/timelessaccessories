'use client';

import { useState, useCallback, useEffect } from 'react';
import { addPromotionToCart, removePromotionFromCart } from '@/lib/actions/cart.actions';

export interface AppliedPromotion {
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
    cartId?: string;
}

export function useCartPromotions(cartData?: { id: string; promotions?: AppliedPromotion[] } | null) {
    const [isLoaded, setIsLoaded] = useState(false);
    
    // Get promotions from cart data (server-side)
    const appliedPromotions = cartData?.promotions || [];
    const currentCartId = cartData?.id;

    // Set loaded state when cart data is available
    useEffect(() => {
        if (cartData) {
            setIsLoaded(true);
            console.log('🎯 [useCartPromotions] Cart data loaded:', {
                cartId: cartData.id,
                promotionsCount: appliedPromotions.length,
                promotions: appliedPromotions.map(p => ({ 
                    couponCode: p.couponCode, 
                    discount: p.discount 
                }))
            });
        }
    }, [cartData, appliedPromotions]);

    const addPromotion = useCallback(async (promotion: AppliedPromotion) => {
        if (!currentCartId) {
            console.warn('Cannot add promotion without cart ID - cart may still be loading');
            return { success: false, error: 'Cart ID not available' };
        }
        
        console.log('🎯 Adding promotion to cart:', currentCartId, promotion.couponCode);
        
        const result = await addPromotionToCart(currentCartId, {
            promotionId: promotion.id,
            couponCode: promotion.couponCode || '',
            discount: promotion.discount,
            discountType: promotion.discountType,
            appliedItems: promotion.appliedTo,
            freeItem: promotion.freeItem
        });
        
        return result;
    }, [currentCartId]);

    const removePromotion = useCallback(async (promotionId: string) => {
        if (!currentCartId) {
            return { success: false, error: 'Cart ID not available' };
        }
        
        console.log('🎯 Removing promotion from cart:', currentCartId, promotionId);
        
        const result = await removePromotionFromCart(currentCartId, promotionId);
        return result;
    }, [currentCartId]);

    const clearPromotions = useCallback(async () => {
        if (!currentCartId) return { success: false, error: 'Cart ID not available' };
        
        // Remove all promotions for this cart
        const results = await Promise.all(
            appliedPromotions.map(promo => removePromotionFromCart(currentCartId, promo.id))
        );
        
        return { success: results.every(r => r.success) };
    }, [currentCartId, appliedPromotions]);

    // Clear promotions for a specific cart (useful when cart is deleted)
    const clearCartPromotions = useCallback(async (cartId: string) => {
        // This would need to be implemented if needed
        console.warn('clearCartPromotions not implemented for server-side promotions');
        return { success: false, error: 'Not implemented' };
    }, []);

    const getTotalDiscount = useCallback(() => {
        return appliedPromotions.reduce((total, promo) => total + promo.discount, 0);
    }, [appliedPromotions]);

    const hasPromotion = useCallback((promotionId: string) => {
        return appliedPromotions.some(p => p.id === promotionId);
    }, [appliedPromotions]);

    const getPromotionByCode = useCallback((couponCode: string) => {
        return appliedPromotions.find(p => p.couponCode?.toUpperCase() === couponCode.toUpperCase());
    }, [appliedPromotions]);

    // Function to clear promotions after successful order
    const clearPromotionsAfterOrder = useCallback(async () => {
        return await clearPromotions();
    }, [clearPromotions]);

    return {
        appliedPromotions,
        addPromotion,
        removePromotion,
        clearPromotions,
        clearCartPromotions,
        clearPromotionsAfterOrder,
        getTotalDiscount,
        hasPromotion,
        getPromotionByCode,
        promotionCount: appliedPromotions.length,
        isLoaded: isLoaded
    };
} 