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
}

const STORAGE_KEY = 'cart-promotions';

export function useCartPromotions() {
    const [appliedPromotions, setAppliedPromotions] = useState<AppliedPromotion[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load promotions from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const promotions = JSON.parse(stored);
                setAppliedPromotions(promotions);
            }
        } catch (error) {
            console.error('Error loading promotions from localStorage:', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save promotions to localStorage whenever they change
    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(appliedPromotions));
            } catch (error) {
                console.error('Error saving promotions to localStorage:', error);
            }
        }
    }, [appliedPromotions, isLoaded]);

    const addPromotion = useCallback((promotion: AppliedPromotion) => {
        setAppliedPromotions(prev => {
            // Check if promotion is already applied
            if (prev.some(p => p.id === promotion.id)) {
                return prev;
            }
            return [...prev, promotion];
        });
    }, []);

    const removePromotion = useCallback((promotionId: string) => {
        setAppliedPromotions(prev => prev.filter(p => p.id !== promotionId));
    }, []);

    const clearPromotions = useCallback(() => {
        setAppliedPromotions([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing promotions from localStorage:', error);
        }
    }, []);

    const getTotalDiscount = useCallback(() => {
        return appliedPromotions.reduce((sum, promo) => sum + promo.discount, 0);
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
        clearPromotionsAfterOrder,
        getTotalDiscount,
        hasPromotion,
        getPromotionByCode,
        promotionCount: appliedPromotions.length,
        isLoaded
    };
} 