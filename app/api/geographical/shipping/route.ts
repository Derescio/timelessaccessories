import { NextRequest, NextResponse } from 'next/server';
import { calculateShippingDB } from '@/lib/utils/shipping-calculator-db';

export async function POST(request: NextRequest) {
    console.log('🚢 [SHIPPING API] Received shipping calculation request');
    
    try {
        const body = await request.json();
        const { countryId, stateId, subtotal, market = 'GLOBAL' } = body;

        console.log('🚢 [SHIPPING API] Request parameters:', {
            countryId,
            stateId,
            subtotalDollars: subtotal,
            market,
            timestamp: new Date().toISOString()
        });

        // Validate required fields
        if (!countryId || subtotal === undefined) {
            console.error('🚢 [SHIPPING API] Validation failed:', {
                missingCountryId: !countryId,
                missingSubtotal: subtotal === undefined
            });
            return NextResponse.json(
                { success: false, error: 'Country ID and subtotal are required' },
                { status: 400 }
            );
        }

        console.log('🚢 [SHIPPING API] Calling calculateShippingDB with:', {
            subtotalDollars: subtotal,
            market,
            countryId,
            stateId
        });

        // Calculate shipping using the database function
        const shippingResult = await calculateShippingDB({
            subtotal: subtotal, // Already in dollars
            market,
            countryId,
            stateId
        });

        console.log('🚢 [SHIPPING API] Database calculation result:', {
            rateDollars: shippingResult.rate,
            freeShippingThresholdDollars: shippingResult.freeShippingThreshold,
            isFreeShipping: shippingResult.isFreeShipping,
            countryName: shippingResult.countryName,
            countryCode: shippingResult.countryCode,
            currency: shippingResult.currency,
            currencySymbol: shippingResult.currencySymbol
        });

        const responseData = {
            rate: shippingResult.rate, // Keep in dollars
            freeShippingThreshold: shippingResult.freeShippingThreshold,
            isFreeShipping: shippingResult.isFreeShipping,
            countryName: shippingResult.countryName,
            countryCode: shippingResult.countryCode,
            currency: shippingResult.currency,
            currencySymbol: shippingResult.currencySymbol,
        };

        console.log('🚢 [SHIPPING API] Sending response:', {
            success: true,
            data: responseData
        });

        return NextResponse.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error('🚢 [SHIPPING API] Error:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });
        return NextResponse.json(
            { success: false, error: 'Failed to calculate shipping cost' },
            { status: 500 }
        );
    }
} 