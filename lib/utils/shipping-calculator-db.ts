import { prisma } from '@/lib/prisma';

export interface ShippingCalculationResult {
  rate: number;
  freeShippingThreshold: number;
  isFreeShipping: boolean;
  countryName: string;
  countryCode?: string;
  currency: string;
  currencySymbol: string;
}

export interface ShippingCalculationOptions {
  subtotal: number;
  market?: 'LASCO' | 'GLOBAL';
  parish?: string; // For LASCO market
  countryId?: number; // For GLOBAL market
  stateId?: number; // For GLOBAL market (optional)
}

/**
 * Calculate shipping cost using the database-driven geographical system
 */
export async function calculateShippingDB(
  options: ShippingCalculationOptions
): Promise<ShippingCalculationResult> {
  console.log('📦 [SHIPPING DB] Starting database shipping calculation:', {
    subtotalDollars: options.subtotal,
    market: options.market,
    countryId: options.countryId,
    stateId: options.stateId,
    timestamp: new Date().toISOString()
  });

  const { subtotal, market = 'GLOBAL', parish, countryId, stateId } = options;

  // Handle LASCO market (Jamaica) - preserve existing logic
  if (market === 'LASCO') {
    console.log('📦 [SHIPPING DB] LASCO market calculation:', {
      freeShippingThreshold: 200,
      subtotal,
      qualifiesForFreeShipping: subtotal >= 200
    });

    return calculateLascoShipping(subtotal, parish);
  }

  // Handle GLOBAL market with database lookup
  if (!countryId) {
    console.error('📦 [SHIPPING DB] Missing countryId for GLOBAL market');
    throw new Error('Country ID is required for GLOBAL market shipping calculation');
  }

  try {
    console.log('📦 [SHIPPING DB] Looking up country in database:', { countryId });

    // Get country information
    const country = await prisma.country.findUnique({
      where: { id: countryId },
      include: {
        shippingRates: {
          where: { isActive: true }
        }
      }
    });

    if (!country) {
      console.error('📦 [SHIPPING DB] Country not found:', { countryId });
      throw new Error(`Country with ID ${countryId} not found`);
    }

    console.log('📦 [SHIPPING DB] Found country:', {
      countryName: country.name,
      countryCode: country.iso2,
      currency: country.currency,
      currencySymbol: country.currencySymbol
    });

    // Check if we have a specific shipping rate for this country
    const shippingRate = country.shippingRates[0];
    
    let rate = 25; // Default fallback rate in dollars
    let freeShippingThreshold = 400; // Default threshold in dollars

    if (shippingRate) {
      rate = shippingRate.rate / 100; // Convert from cents to dollars
      freeShippingThreshold = shippingRate.freeShippingThreshold / 100;
      
      console.log('📦 [SHIPPING DB] Found shipping rate in database:', {
        rateDollars: rate,
        freeShippingThresholdDollars: freeShippingThreshold,
        rateCents: shippingRate.rate,
        freeShippingThresholdCents: shippingRate.freeShippingThreshold
      });
    } else {
      console.warn('📦 [SHIPPING DB] No shipping rate found, using fallback:', {
        fallbackRateDollars: rate,
        fallbackThresholdDollars: freeShippingThreshold,
        countryCode: country.iso2
      });
    }

    const isFreeShipping = subtotal >= freeShippingThreshold;

    console.log('📦 [SHIPPING DB] Final calculation result:', {
      subtotalDollars: subtotal,
      rateDollars: rate,
      freeShippingThresholdDollars: freeShippingThreshold,
      isFreeShipping,
      finalRateDollars: isFreeShipping ? 0 : rate,
      countryName: country.name,
      countryCode: country.iso2,
      currency: country.currency,
      currencySymbol: country.currencySymbol,
      shortfallDollars: isFreeShipping ? 0 : (freeShippingThreshold - subtotal)
    });

    return {
      rate: isFreeShipping ? 0 : rate,
      freeShippingThreshold,
      isFreeShipping,
      countryName: country.name,
      countryCode: country.iso2,
      currency: country.currency || 'USD',
      currencySymbol: country.currencySymbol || '$',
    };

  } catch (error) {
    console.error('📦 [SHIPPING DB] Database error:', {
      error: error instanceof Error ? error.message : String(error),
      countryId,
      market,
      timestamp: new Date().toISOString()
    });

    // Return fallback values
    console.log('📦 [SHIPPING DB] Returning fallback values due to error');
    return {
      rate: subtotal >= 400 ? 0 : 25, // $25 fallback, free over $400
      freeShippingThreshold: 400,
      isFreeShipping: subtotal >= 400,
      countryName: 'Fallback Country',
      countryCode: 'ZZ',
      currency: 'USD',
      currencySymbol: '$',
    };
  }
}

/**
 * Calculate LASCO market shipping (Jamaica parishes)
 */
function calculateLascoShipping(
  subtotal: number, 
  parish?: string
): ShippingCalculationResult {
  const freeShippingThreshold = 200; // $200 USD
  const isFreeShipping = subtotal >= freeShippingThreshold;

  // Parish-specific rates (in USD)
  const parishRates: Record<string, number> = {
    'Kingston': 8,
    'St. Andrew': 8,
    'Spanish Town': 10,
    'Portmore': 10,
    'St. Catherine': 12,
    'Clarendon': 15,
    'Manchester': 15,
    'St. Elizabeth': 18,
    'Westmoreland': 20,
    'Hanover': 22,
    'St. James': 20,
    'Trelawny': 18,
    'St. Ann': 16,
    'St. Mary': 18,
    'Portland': 20,
    'St. Thomas': 16,
  };

  const rate = parish ? (parishRates[parish] || 15) : 15; // Default $15

  return {
    rate: isFreeShipping ? 0 : rate,
    freeShippingThreshold,
    isFreeShipping,
    countryName: 'Jamaica',
    countryCode: 'JM',
    currency: 'USD',
    currencySymbol: '$',
  };
}

/**
 * Calculate fallback shipping rates for countries without specific rates
 */
function calculateFallbackShipping(
  country: any,
  subtotal: number
): ShippingCalculationResult {
  const freeShippingThreshold = 400; // Default $400 USD
  const isFreeShipping = subtotal >= freeShippingThreshold;

  // Region-based fallback rates
  const regionRates: Record<string, number> = {
    'North America': 15,
    'Europe': 25,
    'Asia': 30,
    'South America': 35,
    'Africa': 40,
    'Oceania': 35,
    'Antarctica': 100, // Just in case! 🐧
  };

  const rate = regionRates[country.region] || 25; // Default $25

  return {
    rate: isFreeShipping ? 0 : rate,
    freeShippingThreshold,
    isFreeShipping,
    countryName: country.name,
    countryCode: country.iso2,
    currency: country.currency || 'USD',
    currencySymbol: country.currencySymbol || '$',
  };
}

/**
 * Get all available shipping countries with their rates
 */
export async function getShippingCountries(): Promise<Array<{
  id: number;
  name: string;
  iso2: string;
  emoji: string;
  rate: number;
  freeShippingThreshold: number;
  hasStates: boolean;
}>> {
  try {
    const countries = await prisma.country.findMany({
      where: { 
        isActive: true,
        OR: [
          { shippingRates: { some: { isActive: true } } },
          { region: { not: null } } // Countries with regions get fallback rates
        ]
      },
      include: {
        shippingRates: {
          where: { isActive: true },
          take: 1
        }
      },
      orderBy: { name: 'asc' }
    });

    return countries.map(country => {
      const shippingRate = country.shippingRates[0];
      
      if (shippingRate) {
        return {
          id: country.id,
          name: country.name,
          iso2: country.iso2,
          emoji: country.emoji || '',
          rate: shippingRate.rate / 100,
          freeShippingThreshold: shippingRate.freeShippingThreshold / 100,
          hasStates: country.hasStates,
        };
      }

      // Fallback rates
      const regionRates: Record<string, number> = {
        'North America': 15,
        'Europe': 25,
        'Asia': 30,
        'South America': 35,
        'Africa': 40,
        'Oceania': 35,
      };

      return {
        id: country.id,
        name: country.name,
        iso2: country.iso2,
        emoji: country.emoji || '',
        rate: regionRates[country.region || ''] || 25,
        freeShippingThreshold: 400,
        hasStates: country.hasStates,
      };
    });
  } catch (error) {
    console.error('Error fetching shipping countries:', error);
    return [];
  }
}

/**
 * Get shipping rate by country ISO2 code (for backward compatibility)
 */
export async function getShippingRateByCountryCode(
  countryCode: string,
  subtotal: number
): Promise<ShippingCalculationResult> {
  try {
    const country = await prisma.country.findUnique({
      where: { iso2: countryCode.toUpperCase() },
      include: {
        shippingRates: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!country) {
      throw new Error(`Country with code ${countryCode} not found`);
    }

    return calculateShippingDB({
      subtotal,
      market: 'GLOBAL',
      countryId: country.id
    });
  } catch (error) {
    console.error('Error getting shipping rate by country code:', error);
    throw error;
  }
} 