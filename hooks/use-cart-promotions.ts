'use client';

import { useState, useCallback, useEffect } from 'react';

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

interface CartPromotionsState {
  [cartId: string]: AppliedPromotion[];
}

const STORAGE_KEY = 'cart-promotions-by-cart';

export function useCartPromotions(currentCartId?: string) {
    const [promotionsByCart, setPromotionsByCart] = useState<CartPromotionsState>({});
    
    // Get promotions for current cart only
    const appliedPromotions = currentCartId ? (promotionsByCart[currentCartId] || []) : [];

    // Load promotions from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as CartPromotionsState;
                setPromotionsByCart(parsed);
            }
        } catch (error) {
            console.error('Error loading cart promotions:', error);
        }
    }, []);

    // Save to localStorage whenever promotions change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(promotionsByCart));
        } catch (error) {
            console.error('Error saving cart promotions:', error);
        }
    }, [promotionsByCart]);

    const addPromotion = useCallback((promotion: AppliedPromotion) => {
        if (!currentCartId) {
            console.warn('Cannot add promotion without cart ID');
            return;
        }
        
        setPromotionsByCart(prev => {
            const cartPromotions = prev[currentCartId] || [];
            
            // Check if promotion already exists for this cart
            if (cartPromotions.some(p => p.id === promotion.id)) {
                return prev;
            }
            
            const updatedPromotions = [...cartPromotions, { ...promotion, cartId: currentCartId }];
            
            return {
                ...prev,
                [currentCartId]: updatedPromotions
            };
        });
    }, [currentCartId]);

    const removePromotion = useCallback((promotionId: string) => {
        if (!currentCartId) return;
        
        setPromotionsByCart(prev => {
            const cartPromotions = prev[currentCartId] || [];
            const updatedPromotions = cartPromotions.filter(p => p.id !== promotionId);
            
            return {
                ...prev,
                [currentCartId]: updatedPromotions
            };
        });
    }, [currentCartId]);

    const clearPromotions = useCallback(() => {
        if (!currentCartId) return;
        
        setPromotionsByCart(prev => {
            const updated = { ...prev };
            delete updated[currentCartId];
            return updated;
        });
    }, [currentCartId]);

    // Clear promotions for a specific cart (useful when cart is deleted)
    const clearCartPromotions = useCallback((cartId: string) => {
        setPromotionsByCart(prev => {
            const updated = { ...prev };
            delete updated[cartId];
            return updated;
        });
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
    const clearPromotionsAfterOrder = useCallback(() => {
        clearPromotions();
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
        isLoaded: Object.keys(promotionsByCart).length > 0
    };
} 