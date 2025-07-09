'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExternalLink, MapPin, Heart, ShoppingCart, AlertCircle, Globe } from 'lucide-react'
import Image from 'next/image'

interface Product {
    id: string
    name: string
    description: string
    image: string
    price: {
        us: string
        uk: string
    }
    links: {
        us: string
        uk: string
    }
}

const products: Product[] = [
    {
        id: 'pbc-tshirt',
        name: 'PBC T-Shirt',
        description: 'Premium quality cotton t-shirt with unique PBC design. Comfortable fit and durable print.',
        image: '/images/PBC_T-Shirt.png',
        price: {
            us: '$19.99',
            uk: '£16.99'
        },
        links: {
            us: 'https://a.co/d/7VNUOBV', // Replace with actual Amazon US link
            uk: 'https://amazon.com'  // Replace with actual Amazon UK link
        }
    },
    {
        id: 'always-tshirt',
        name: 'Premium Pullover',
        description: 'Cozy pullover perfect for casual wear. Soft fabric with a modern design that fits any style.',
        image: '/images/T-Shirt.png',
        price: {
            us: '$29.99',
            uk: '£24.99'
        },
        links: {
            us: 'https://amazon.com', // Replace with actual Amazon US link
            uk: 'https://amazon.com'  // Replace with actual Amazon UK link
        }
    },
    {
        id: 'pullover',
        name: 'Premium Pullover',
        description: 'Cozy pullover perfect for casual wear. Soft fabric with a modern design that fits any style.',
        image: '/images/Pullover.png',
        price: {
            us: '$29.99',
            uk: '£24.99'
        },
        links: {
            us: 'https://amazon.com', // Replace with actual Amazon US link
            uk: 'https://amazon.com'  // Replace with actual Amazon UK link
        }
    }
]

type Region = 'us' | 'uk' | 'canada'

const Amazon = () => {
    const [selectedRegion, setSelectedRegion] = useState<Region>('us')
    const [detectedRegion, setDetectedRegion] = useState<Region | null>(null)

    useEffect(() => {
        // Enhanced region detection
        const detectRegion = (): Region => {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
            const locale = navigator.language

            // Enhanced timezone-based detection
            const canadianTimezones = [
                'America/Toronto', 'America/Vancouver', 'America/Montreal', 'America/Halifax',
                'America/Winnipeg', 'America/Calgary', 'America/Edmonton', 'America/Regina',
                'America/St_Johns', 'America/Moncton', 'America/Thunder_Bay', 'America/Iqaluit',
                'America/Yellowknife', 'America/Whitehorse', 'America/Dawson_Creek',
                'America/Fort_Nelson', 'America/Creston', 'America/Atikokan'
            ]

            const ukTimezones = [
                'Europe/London', 'Europe/Belfast', 'Europe/Dublin', 'Europe/Edinburgh',
                'Europe/Cardiff', 'Atlantic/Reykjavik'
            ]

            const usTimezones = [
                'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
                'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'America/Detroit',
                'America/Indianapolis', 'America/Kentucky/Louisville', 'America/Kentucky/Monticello',
                'America/North_Dakota/Center', 'America/North_Dakota/New_Salem', 'America/North_Dakota/Beulah'
            ]

            // Check exact timezone matches first
            if (canadianTimezones.includes(timezone)) {
                return 'canada'
            }
            if (ukTimezones.includes(timezone)) {
                return 'uk'
            }
            if (usTimezones.includes(timezone)) {
                return 'us'
            }

            // Fallback to locale-based detection
            if (locale.includes('en-CA') || locale.includes('fr-CA')) {
                return 'canada'
            }
            if (locale.includes('en-GB') || locale.includes('en-IE')) {
                return 'uk'
            }

            // Check broader timezone patterns
            if (timezone.includes('America/')) {
                // Check if it's likely Canada based on locale or other indicators
                if (locale.includes('CA') || timezone.includes('Montreal') || timezone.includes('Toronto')) {
                    return 'canada'
                }
                return 'us'
            }
            if (timezone.includes('Europe/')) {
                return 'uk'
            }

            // Final fallback - try to detect based on currency/number formatting
            try {
                const currencyFormatter = new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency: 'USD'
                })
                const formatted = currencyFormatter.format(1)

                if (formatted.includes('CA$') || formatted.includes('C$')) {
                    return 'canada'
                }
                if (formatted.includes('£')) {
                    return 'uk'
                }
            } catch (error) {
                // Ignore formatting errors
            }

            // Default to US if nothing else matches
            return 'us'
        }

        const detected = detectRegion()
        setDetectedRegion(detected)
        setSelectedRegion(detected)
    }, [])

    const renderCanadianMessage = () => (
        <Alert className="mb-8 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
                <strong>Canadian Customers:</strong> Unfortunately, Amazon Merch is not available in Canada.
                However, you can still support our small business by purchasing similar designs from our TeePublic store!
                <Button
                    variant="link"
                    className="p-0 h-auto ml-2 text-yellow-700 underline"
                    onClick={() => window.open('https://www.teepublic.com/user/shopdw', '_blank')}
                >
                    <Heart className="h-4 w-4 mr-1" />
                    Shop Our TeePublic Store
                </Button>
            </AlertDescription>
        </Alert>
    )

    const renderProductCard = (product: Product) => (
        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="relative aspect-square">
                <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                />
            </div>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    {product.name}
                    <Badge variant="secondary">
                        {selectedRegion === 'us' ? product.price.us : product.price.uk}
                    </Badge>
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                    {product.description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {selectedRegion !== 'canada' ? (
                        <Button
                            className="w-full"
                            onClick={() => window.open(
                                selectedRegion === 'us' ? product.links.us : product.links.uk,
                                '_blank'
                            )}
                        >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Buy on Amazon {selectedRegion === 'us' ? 'US' : 'UK'}
                            <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            className="w-full"
                            onClick={() => window.open('https://www.teepublic.com/user/shopdw', '_blank')}
                        >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Buy on TeePublic
                            <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                    )}

                    {/* <Button
                        variant="outline"
                        className="w-full text-sm"
                        onClick={() => window.open(
                            selectedRegion === 'canada'
                                ? 'https://www.teepublic.com/user/shopdw'
                                : selectedRegion === 'us'
                                    ? product.links.us
                                    : product.links.uk,
                            '_blank'
                        )}
                    >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        View Product Details
                    </Button> */}
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Amazon Merch Collection</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                    Support our small business with premium quality apparel available on Amazon.
                    Each purchase helps us continue creating unique designs and growing our brand.
                </p>

                {/* Region Selector */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Select your region:</span>
                        <Select value={selectedRegion} onValueChange={(value: Region) => setSelectedRegion(value)}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="us">🇺🇸 United States</SelectItem>
                                <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                                <SelectItem value="canada">🇨🇦 Canada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {detectedRegion && (
                    <p className="text-sm text-gray-500 mb-6">
                        <Globe className="h-4 w-4 inline mr-1" />
                        Auto-detected region: {detectedRegion === 'us' ? 'United States' : detectedRegion === 'uk' ? 'United Kingdom' : 'Canada'}
                        {selectedRegion === detectedRegion && (
                            <Badge variant="outline" className="ml-2 text-xs">
                                Auto-selected
                            </Badge>
                        )}
                    </p>
                )}
            </div>

            {/* Canadian Customer Message */}
            {selectedRegion === 'canada' && renderCanadianMessage()}

            {/* Small Business Support Message */}
            {selectedRegion !== 'canada' && (
                <Alert className="mb-8 border-blue-200 bg-blue-50">
                    <Heart className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        <strong>Supporting Small Business:</strong> Every purchase through Amazon helps support our small business.
                        We appreciate your support in helping us grow and create more unique designs!
                    </AlertDescription>
                </Alert>
            )}

            {/* Available Regions Notice */}
            {selectedRegion !== 'canada' && (
                <div className="text-center mb-8">
                    <Badge variant="outline" className="text-sm px-4 py-2">
                        Available in United States & United Kingdom only
                    </Badge>
                </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {products.map(renderProductCard)}
            </div>

            {/* Footer Message */}
            <div className="text-center p-8 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Why Choose Our Merch?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div className="flex flex-col items-center">
                        <Heart className="h-8 w-8 text-red-500 mb-2" />
                        <h4 className="font-medium">Small Business</h4>
                        <p className="text-gray-600">Supporting independent creators and entrepreneurs</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <ShoppingCart className="h-8 w-8 text-blue-500 mb-2" />
                        <h4 className="font-medium">Quality Products</h4>
                        <p className="text-gray-600">Premium materials and printing through Amazon and teePublic</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <Globe className="h-8 w-8 text-green-500 mb-2" />
                        <h4 className="font-medium">Global Reach</h4>
                        <p className="text-gray-600">Available in US & UK with Amazon's reliable shipping</p>
                    </div>
                </div>

                {selectedRegion === 'canada' && (
                    <div className="mt-6 p-4 bg-yellow-100 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>Canadian customers:</strong> While Amazon Merch isn't available in Canada,
                            you can still support our small business through our TeePublic store with Canadian shipping options!
                            <Button
                                variant="link"
                                className="p-0 h-auto ml-2 text-yellow-700 underline text-sm"
                                onClick={() => window.open('https://www.teepublic.com/user/shopdw', '_blank')}
                            >
                                Visit TeePublic Store
                                <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Amazon