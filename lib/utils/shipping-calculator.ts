import { getShippingRateByCountry } from '@/lib/actions/shipping.actions'

/**
 * Local shipping rates for LASCO market (Jamaica parishes)
 * These remain unchanged as per requirements
 */
const JAMAICA_PARISH_RATES = {
    'Kingston': { rate: 0, type: 'local' as const },
    'St. Andrew': { rate: 0, type: 'local' as const },
    'St. Catherine': { rate: 0, type: 'local' as const },
    'St. Thomas': { rate: 0, type: 'local' as const },
    'Portland': { rate: 0, type: 'local' as const },
    'St. Mary': { rate: 0, type: 'local' as const },
    'St. Ann': { rate: 0, type: 'local' as const },
    'Trelawny': { rate: 0, type: 'local' as const },
    'St. James': { rate: 0, type: 'local' as const },
    'Hanover': { rate: 0, type: 'local' as const },
    'Westmoreland': { rate: 0, type: 'local' as const },
    'St. Elizabeth': { rate: 0, type: 'local' as const },
    'Manchester': { rate: 0, type: 'local' as const },
    'Clarendon': { rate: 0, type: 'local' as const },
}

/**
 * Fallback rates (will be replaced by database lookup)
 */
const FALLBACK_RATES = {
    'USA': { rate: 15, type: 'global' as const },
    'Canada': { rate: 15, type: 'global' as const },
    'DEFAULT': { rate: 35, type: 'global' as const }
}

/**
 * Calculate shipping cost based on country/parish and order total
 * 
 * Rules:
 * - Local shipping (Jamaica parishes): Free
 * - International shipping: Uses database rates
 * - Free shipping based on country-specific thresholds
 * 
 * @param region The destination region (parish or country)
 * @param orderTotal The total order amount in cents
 * @param countryCode Optional 2-letter country code for database lookup
 * @returns The calculated shipping cost in cents
 */
export async function calculateShipping(
    region: string, 
    orderTotal: number, 
    countryCode?: string
): Promise<number> {
    // Normalize the region name
    const normalizedRegion = region.trim();
    
    // Check if it's a Jamaica parish (LASCO market)
    if (normalizedRegion in JAMAICA_PARISH_RATES) {
        return 0; // Free local shipping
    }
    
    // For international shipping, try to get rate from database
    if (countryCode) {
        try {
            const dbRate = await getShippingRateByCountry(countryCode);
            if (dbRate) {
                // Check free shipping threshold
                if (orderTotal >= dbRate.freeShippingThreshold) {
                    return 0;
                }
                return dbRate.rate;
            }
        } catch (error) {
            console.error('Error fetching shipping rate:', error);
        }
    }
    
    // Fallback to hardcoded rates
    const fallbackRate = FALLBACK_RATES[normalizedRegion as keyof typeof FALLBACK_RATES] || FALLBACK_RATES.DEFAULT;
    
    // Check free shipping threshold (fallback: $400 = 40000 cents)
    if (fallbackRate.type === 'global' && orderTotal >= 40000) {
        return 0;
    }
    
    // Convert to cents
    return fallbackRate.rate * 100;
}

/**
 * Synchronous version for backward compatibility
 * Uses fallback rates only
 * @param region The destination region
 * @param orderTotal The total order amount in cents
 * @returns The calculated shipping cost in cents
 */
export function calculateShippingSync(region: string, orderTotal: number): number {
    const normalizedRegion = region.trim();
    
    // Check if it's a Jamaica parish (LASCO market)
    if (normalizedRegion in JAMAICA_PARISH_RATES) {
        return 0; // Free local shipping
    }
    
    // Use fallback rates
    const fallbackRate = FALLBACK_RATES[normalizedRegion as keyof typeof FALLBACK_RATES] || FALLBACK_RATES.DEFAULT;
    
    // Check free shipping threshold (fallback: $400 = 40000 cents)
    if (fallbackRate.type === 'global' && orderTotal >= 40000) {
        return 0;
    }
    
    // Convert to cents
    return fallbackRate.rate * 100;
}

/**
 * Calculate shipping cost by country code
 * @param countryCode 2-letter country code
 * @param orderTotal Order total in cents
 * @returns Shipping cost in cents
 */
export async function calculateShippingByCountry(
    countryCode: string, 
    orderTotal: number
): Promise<number> {
    try {
        const dbRate = await getShippingRateByCountry(countryCode);
        if (dbRate) {
            // Check free shipping threshold
            if (orderTotal >= dbRate.freeShippingThreshold) {
                return 0;
            }
            return dbRate.rate;
        }
    } catch (error) {
        console.error('Error fetching shipping rate:', error);
    }
    
    // Fallback to default international rate
    const fallbackRate = FALLBACK_RATES.DEFAULT;
    
    // Check free shipping threshold
    if (orderTotal >= 40000) { // $400
        return 0;
    }
    
    return fallbackRate.rate * 100; // Convert to cents
}

/**
 * Get shipping type for a region
 * @param region The destination region
 * @returns 'local' or 'global'
 */
export function getShippingType(region: string): 'local' | 'global' {
    const normalizedRegion = region.trim();
    
    // Check if it's a Jamaica parish (local shipping)
    if (normalizedRegion in JAMAICA_PARISH_RATES) {
        return 'local';
    }
    
    // All other destinations are global
    return 'global';
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