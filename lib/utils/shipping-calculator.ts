/**
 * Shipping rates configuration
 */
const SHIPPING_RATES = {
    // Local shipping (Jamaica parishes)
    'Kingston': { rate: 0, type: 'local' },
    'St. Andrew': { rate: 0, type: 'local' },
    'St. Catherine': { rate: 0, type: 'local' },
    'St. Thomas': { rate: 0, type: 'local' },
    'Portland': { rate: 0, type: 'local' },
    'St. Mary': { rate: 0, type: 'local' },
    'St. Ann': { rate: 0, type: 'local' },
    'Trelawny': { rate: 0, type: 'local' },
    'St. James': { rate: 0, type: 'local' },
    'Hanover': { rate: 0, type: 'local' },
    'Westmoreland': { rate: 0, type: 'local' },
    'St. Elizabeth': { rate: 0, type: 'local' },
    'Manchester': { rate: 0, type: 'local' },
    'Clarendon': { rate: 0, type: 'local' },
    
    // Global shipping rates
    'USA': { rate: 15, type: 'global' },
    'Canada': { rate: 15, type: 'global' },
    'DEFAULT': { rate: 35, type: 'global' }
} as const;

/**
 * Calculate shipping cost based on country/parish and order total
 * 
 * Rules:
 * - Local shipping (Jamaica parishes): Free
 * - USA/Canada: $15
 * - Other countries: $35
 * - Free shipping for orders over $100 (global shipping only)
 * 
 * @param region The destination region (parish or country)
 * @param orderTotal The total order amount
 * @returns The calculated shipping cost
 */
export function calculateShipping(region: string, orderTotal: number): number {
    // Normalize the region name
    const normalizedRegion = region.trim();
    
    // Get shipping rate configuration
    const rateConfig = SHIPPING_RATES[normalizedRegion as keyof typeof SHIPPING_RATES] || SHIPPING_RATES.DEFAULT;
    
    // For global shipping, check free shipping threshold
    if (rateConfig.type === 'global' && orderTotal >= 100) {
        return 0;
    }
    
    return rateConfig.rate;
}

/**
 * Get shipping type for a region
 * @param region The destination region
 * @returns 'local' or 'global'
 */
export function getShippingType(region: string): 'local' | 'global' {
    const normalizedRegion = region.trim();
    const rateConfig = SHIPPING_RATES[normalizedRegion as keyof typeof SHIPPING_RATES] || SHIPPING_RATES.DEFAULT;
    return rateConfig.type;
}

/**
 * Get estimated shipping time for a region
 * @param region The destination region
 * @returns Estimated shipping time in days
 */
export function getEstimatedShippingTime(region: string): string {
    const shippingType = getShippingType(region);
    
    switch (shippingType) {
        case 'local':
            return '1-2 business days';
        case 'global':
            if (region === 'USA' || region === 'Canada') {
                return '3-5 business days';
            }
            return '5-10 business days';
        default:
            return '5-10 business days';
    }
} 