'use client';

import React, { useState, useCallback } from 'react';
import { CountrySelectorDB } from '@/components/shared/CountrySelectorDB';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

// Define interfaces to match the API response
interface ShippingCalculationResult {
    rate: number;
    freeShippingThreshold: number;
    isFreeShipping: boolean;
    countryName: string;
    countryCode?: string;
    currency: string;
    currencySymbol: string;
}

interface Country {
    id: number;
    name: string;
    iso2: string;
    emoji: string;
    hasStates: boolean;
    region?: string;
    capital?: string;
}

interface State {
    id: number;
    name: string;
    stateCode: string;
    hasCities: boolean;
}

export default function TestGeographicalDBPage() {
    const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(undefined);
    const [selectedState, setSelectedState] = useState<State | undefined>(undefined);
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [shippingResult, setShippingResult] = useState<ShippingCalculationResult | null>(null);
    const [shippingLoading, setShippingLoading] = useState(false);
    const [subtotal] = useState(250); // Example subtotal

    // Create wrapper functions to handle null to undefined conversion
    const handleCountryChange = useCallback((country: Country | null) => {
        setSelectedCountry(country || undefined);
    }, []);

    const handleStateChange = useCallback((state: State | null) => {
        setSelectedState(state || undefined);
    }, []);

    const handleShippingCalculation = async (countryId: number, stateId?: number) => {
        setShippingLoading(true);
        try {
            // Call the shipping API endpoint
            const response = await fetch('/api/geographical/shipping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    countryId,
                    stateId,
                    subtotal: subtotal * 100, // Convert to cents
                    market: 'GLOBAL'
                })
            });

            const result = await response.json();

            if (result.success) {
                setShippingResult({
                    rate: result.data.rate / 100, // Convert back to dollars
                    freeShippingThreshold: result.data.freeShippingThreshold / 100,
                    isFreeShipping: result.data.isFreeShipping,
                    countryName: result.data.countryName,
                    countryCode: result.data.countryCode,
                    currency: result.data.currency,
                    currencySymbol: result.data.currencySymbol,
                });
            } else {
                throw new Error(result.error || 'Failed to calculate shipping');
            }
        } catch (error) {
            console.error('Error calculating shipping:', error);
            setShippingResult(null);
        } finally {
            setShippingLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">🌍 Geographical Database Test</h1>
                    <p className="text-gray-600">
                        Testing the new database-driven geographical system with real-time shipping calculation
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Country Selector */}
                    <Card>
                        <CardHeader>
                            <CardTitle>🗺️ Location Selection</CardTitle>
                            <CardDescription>
                                Select a country, state/province, and city using the database-driven system
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CountrySelectorDB
                                selectedCountry={selectedCountry}
                                selectedState={selectedState}
                                selectedCity={selectedCity}
                                onCountryChange={handleCountryChange}
                                onStateChange={handleStateChange}
                                onCityChange={setSelectedCity}
                                onShippingCalculation={handleShippingCalculation}
                                showRegions={true}
                                placeholder={{
                                    country: "🌍 Choose your country...",
                                    state: "🏛️ Choose your state/province...",
                                    city: "🏙️ Enter your city...",
                                }}
                            />
                        </CardContent>
                    </Card>

                    {/* Selection Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>📋 Selection Summary</CardTitle>
                            <CardDescription>
                                Current geographical selection and shipping information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Country Info */}
                            {selectedCountry ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{selectedCountry.emoji}</span>
                                        <div>
                                            <div className="font-semibold">{selectedCountry.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {selectedCountry.iso2} • {selectedCountry.region}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={selectedCountry.hasStates ? "default" : "secondary"}>
                                        {selectedCountry.hasStates ? "Has States/Provinces" : "No States/Provinces"}
                                    </Badge>
                                </div>
                            ) : (
                                <div className="text-gray-500 italic">No country selected</div>
                            )}

                            <Separator />

                            {/* State Info */}
                            {selectedState ? (
                                <div className="space-y-2">
                                    <div className="font-semibold">{selectedState.name}</div>
                                    {selectedState.stateCode && (
                                        <div className="text-sm text-gray-500">Code: {selectedState.stateCode}</div>
                                    )}
                                    <Badge variant={selectedState.hasCities ? "default" : "secondary"}>
                                        {selectedState.hasCities ? "Has Cities" : "No Cities"}
                                    </Badge>
                                </div>
                            ) : selectedCountry?.hasStates ? (
                                <div className="text-gray-500 italic">No state/province selected</div>
                            ) : null}

                            {selectedState && <Separator />}

                            {/* City Info */}
                            {selectedCity ? (
                                <div className="space-y-2">
                                    <div className="font-semibold">{selectedCity}</div>
                                    <Badge variant="outline">City Entered</Badge>
                                </div>
                            ) : (
                                <div className="text-gray-500 italic">No city entered</div>
                            )}

                            {/* Shipping Calculation */}
                            {(selectedCountry && !selectedCountry.hasStates) ||
                                (selectedCountry && selectedState) ? (
                                <>
                                    <Separator />
                                    <div className="space-y-3">
                                        <h4 className="font-semibold">🚚 Shipping Calculation</h4>
                                        <div className="text-sm text-gray-600">
                                            Subtotal: <span className="font-medium">${subtotal.toFixed(2)}</span>
                                        </div>

                                        {shippingLoading ? (
                                            <div className="flex items-center gap-2 text-blue-600">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Calculating shipping...</span>
                                            </div>
                                        ) : shippingResult ? (
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Shipping Rate:</span>
                                                    <span className="font-medium">
                                                        {shippingResult.currencySymbol}{shippingResult.rate.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Free Shipping At:</span>
                                                    <span className="font-medium">
                                                        {shippingResult.currencySymbol}{shippingResult.freeShippingThreshold.toFixed(2)}
                                                    </span>
                                                </div>
                                                <Badge variant={shippingResult.isFreeShipping ? "default" : "secondary"}>
                                                    {shippingResult.isFreeShipping ? "✅ Free Shipping!" : "💰 Shipping Required"}
                                                </Badge>
                                            </div>
                                        ) : null}
                                    </div>
                                </>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>

                {/* Database Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>📊 Database Statistics</CardTitle>
                        <CardDescription>
                            Information about the geographical database
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-blue-600">250+</div>
                                <div className="text-sm text-gray-600">Countries</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-600">4,800+</div>
                                <div className="text-sm text-gray-600">States/Provinces</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-purple-600">150,000+</div>
                                <div className="text-sm text-gray-600">Cities</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-orange-600">Real-time</div>
                                <div className="text-sm text-gray-600">Search & Shipping</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Features */}
                <Card>
                    <CardHeader>
                        <CardTitle>✨ Features Demonstrated</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h4 className="font-semibold">🔍 Search Capabilities</h4>
                                <ul className="text-sm space-y-1 text-gray-600">
                                    <li>• Real-time country search</li>
                                    <li>• State/province filtering</li>
                                    <li>• City search with pagination</li>
                                    <li>• Debounced API calls</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold">🚚 Shipping Integration</h4>
                                <ul className="text-sm space-y-1 text-gray-600">
                                    <li>• Database-driven rates</li>
                                    <li>• Region-based fallbacks</li>
                                    <li>• Free shipping thresholds</li>
                                    <li>• Multi-currency support</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold">🌍 Global Coverage</h4>
                                <ul className="text-sm space-y-1 text-gray-600">
                                    <li>• ISO country codes</li>
                                    <li>• Flag emojis</li>
                                    <li>• Regional grouping</li>
                                    <li>• Hierarchical structure</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold">⚡ Performance</h4>
                                <ul className="text-sm space-y-1 text-gray-600">
                                    <li>• Optimized database queries</li>
                                    <li>• Efficient indexing</li>
                                    <li>• Batch processing</li>
                                    <li>• Lazy loading</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 