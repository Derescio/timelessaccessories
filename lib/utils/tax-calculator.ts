// Tax rates by region
const TAX_RATES = {
    // Jamaica parishes
    'Kingston': 0.15, // 15% GCT
    'St. Andrew': 0.15,
    'St. Catherine': 0.15,
    'St. Thomas': 0.15,
    'Portland': 0.15,
    'St. Mary': 0.15,
    'St. Ann': 0.15,
    'Trelawny': 0.15,
    'St. James': 0.15,
    'Hanover': 0.15,
    'Westmoreland': 0.15,
    'St. Elizabeth': 0.15,
    'Manchester': 0.15,
    'Clarendon': 0.15,
    // Default rate for other regions
    'DEFAULT': 0.07 // 7% default tax rate
} as const;

/**
 * Calculate tax for an order based on the region and subtotal
 * @param region The region/parish for tax calculation
 * @param subtotal The order subtotal before tax
 * @returns The calculated tax amount
 */
export function calculateTax(region: string, subtotal: number): number {
    // Get the tax rate for the region, fallback to default if not found
    const taxRate = TAX_RATES[region as keyof typeof TAX_RATES] || TAX_RATES.DEFAULT;
    
    // Calculate tax amount
    return subtotal * taxRate;
}

/**
 * Get the tax rate for a specific region
 * @param region The region/parish to get the tax rate for
 * @returns The tax rate as a decimal (e.g., 0.15 for 15%)
 */
export function getTaxRate(region: string): number {
    return TAX_RATES[region as keyof typeof TAX_RATES] || TAX_RATES.DEFAULT;
}

/**
 * Get all available tax rates
 * @returns Object containing all tax rates by region
 */
export function getAllTaxRates(): typeof TAX_RATES {
    return TAX_RATES;
} 