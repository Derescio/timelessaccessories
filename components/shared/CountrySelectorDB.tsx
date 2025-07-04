'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Check, ChevronDown, Loader2, Globe, MapPin, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

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

interface CountrySelectorDBProps {
    selectedCountry?: Country;
    selectedState?: State;
    selectedCity?: string;
    onCountryChange: (country: Country | null) => void;
    onStateChange: (state: State | null) => void;
    onCityChange: (city: string) => void;
    disabled?: boolean;
    onShippingCalculation?: (countryId: number, stateId?: number) => void;
    showRegions?: boolean;
    placeholder?: {
        country?: string;
        state?: string;
        city?: string;
    };
}

export function CountrySelectorDB({
    selectedCountry,
    selectedState,
    selectedCity,
    onCountryChange,
    onStateChange,
    onCityChange,
    disabled = false,
    onShippingCalculation,
    showRegions = false,
    placeholder = {}
}: CountrySelectorDBProps) {
    const [countries, setCountries] = useState<Country[]>([]);
    const [states, setStates] = useState<State[]>([]);

    const [countryOpen, setCountryOpen] = useState(false);
    const [stateOpen, setStateOpen] = useState(false);

    const [countrySearch, setCountrySearch] = useState('');
    const [stateSearch, setStateSearch] = useState('');

    const debouncedCountrySearch = useDebounce(countrySearch, 300);
    const debouncedStateSearch = useDebounce(stateSearch, 300);

    const [loading, setLoading] = useState({
        countries: false,
        states: false,
    });

    // Load countries on mount and when search changes
    const loadCountries = useCallback(async (search?: string) => {
        setLoading(prev => ({ ...prev, countries: true }));
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            params.append('limit', '100');

            const response = await fetch(`/api/geographical/countries?${params}`);
            const data = await response.json();

            if (data.success) {
                setCountries(data.data);
            } else {
                console.error('Failed to load countries:', data.error);
            }
        } catch (error) {
            console.error('Error loading countries:', error);
        } finally {
            setLoading(prev => ({ ...prev, countries: false }));
        }
    }, []);

    // Load states when country changes or search changes
    const loadStates = useCallback(async (countryId: number, search?: string) => {
        setLoading(prev => ({ ...prev, states: true }));
        try {
            const params = new URLSearchParams();
            params.append('countryId', countryId.toString());
            if (search) params.append('search', search);
            params.append('limit', '100');

            const response = await fetch(`/api/geographical/states?${params}`);
            const data = await response.json();

            if (data.success) {
                setStates(data.data);
            } else {
                console.error('Failed to load states:', data.error);
            }
        } catch (error) {
            console.error('Error loading states:', error);
        } finally {
            setLoading(prev => ({ ...prev, states: false }));
        }
    }, []);

    // Load countries on mount
    useEffect(() => {
        loadCountries();
    }, [loadCountries]);

    // Load countries when search changes
    useEffect(() => {
        if (debouncedCountrySearch !== '') {
            loadCountries(debouncedCountrySearch);
        } else {
            loadCountries();
        }
    }, [debouncedCountrySearch, loadCountries]);

    // Load states when country changes
    useEffect(() => {
        if (selectedCountry?.hasStates) {
            loadStates(selectedCountry.id);
            // Trigger shipping calculation when country changes
            if (onShippingCalculation) {
                onShippingCalculation(selectedCountry.id);
            }
        } else {
            setStates([]);
            onStateChange(null);
            onCityChange(''); // Clear city when country changes
            // Trigger shipping calculation for countries without states
            if (onShippingCalculation && selectedCountry) {
                onShippingCalculation(selectedCountry.id);
            }
        }
    }, [selectedCountry, loadStates, onStateChange, onCityChange, onShippingCalculation]);

    // Load states when search changes
    useEffect(() => {
        if (selectedCountry?.hasStates && debouncedStateSearch !== '') {
            loadStates(selectedCountry.id, debouncedStateSearch);
        }
    }, [debouncedStateSearch, selectedCountry, loadStates]);

    // Trigger shipping calculation when state changes
    useEffect(() => {
        if (selectedState && selectedCountry && onShippingCalculation) {
            onShippingCalculation(selectedCountry.id, selectedState.id);
        }
    }, [selectedState, selectedCountry, onShippingCalculation]);

    const handleCountrySelect = (country: Country) => {
        onCountryChange(country);
        setCountryOpen(false);
        setCountrySearch('');
        // Reset dependent selections
        onStateChange(null);
        onCityChange(''); // Clear city when country changes
    };

    const handleStateSelect = (state: State) => {
        onStateChange(state);
        setStateOpen(false);
        setStateSearch('');
        // Clear city when state changes (optional)
        // onCityChange('');
    };

    const handleCityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onCityChange(event.target.value);
    };

    return (
        <div className="space-y-4">
            {/* Country Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="inline w-4 h-4 mr-1" />
                    Country *
                </label>
                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={countryOpen}
                            className="w-full justify-between"
                            disabled={disabled || loading.countries}
                        >
                            {selectedCountry ? (
                                <span className="flex items-center gap-2">
                                    <span>{selectedCountry.emoji}</span>
                                    <span>{selectedCountry.name}</span>
                                    {showRegions && selectedCountry.region && (
                                        <span className="text-xs text-gray-500">({selectedCountry.region})</span>
                                    )}
                                </span>
                            ) : (
                                placeholder.country || "Select country..."
                            )}
                            {loading.countries ? (
                                <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
                            ) : (
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                        <Command>
                            <CommandInput
                                placeholder="Search countries..."
                                value={countrySearch}
                                onValueChange={setCountrySearch}
                            />
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandList>
                                <CommandGroup className="max-h-64 overflow-auto">
                                    {countries.map((country) => (
                                        <CommandItem
                                            key={country.id}
                                            value={country.name}
                                            onSelect={() => handleCountrySelect(country)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedCountry?.id === country.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <span className="mr-2">{country.emoji}</span>
                                            <div className="flex flex-col">
                                                <span>{country.name}</span>
                                                {showRegions && country.region && (
                                                    <span className="text-xs text-gray-500">{country.region}</span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* State Selector */}
            {selectedCountry?.hasStates && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="inline w-4 h-4 mr-1" />
                        State/Province *
                    </label>
                    <Popover open={stateOpen} onOpenChange={setStateOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={stateOpen}
                                className="w-full justify-between"
                                disabled={disabled || loading.states}
                            >
                                {selectedState ? (
                                    <span className="flex items-center gap-2">
                                        <span>{selectedState.name}</span>
                                        {selectedState.stateCode && (
                                            <span className="text-xs text-gray-500">({selectedState.stateCode})</span>
                                        )}
                                    </span>
                                ) : (
                                    placeholder.state || "Select state/province..."
                                )}
                                {loading.states ? (
                                    <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
                                ) : (
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandInput
                                    placeholder="Search states..."
                                    value={stateSearch}
                                    onValueChange={setStateSearch}
                                />
                                <CommandEmpty>No state found.</CommandEmpty>
                                <CommandList>
                                    <CommandGroup className="max-h-64 overflow-auto">
                                        {states.map((state) => (
                                            <CommandItem
                                                key={state.id}
                                                value={state.name}
                                                onSelect={() => handleStateSelect(state)}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedState?.id === state.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <span>{state.name}</span>
                                                {state.stateCode && (
                                                    <span className="ml-auto text-sm text-gray-500">
                                                        {state.stateCode}
                                                    </span>
                                                )}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            )}

            {/* City Input Field */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="inline w-4 h-4 mr-1" />
                    City *
                </label>
                <Input
                    type="text"
                    value={selectedCity || ''}
                    onChange={handleCityChange}
                    placeholder={placeholder.city || "Enter your city..."}
                    disabled={disabled}
                    className="w-full"
                />
            </div>
        </div>
    );
} 