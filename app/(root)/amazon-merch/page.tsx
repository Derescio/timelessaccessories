'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, Heart, ShoppingCart, AlertCircle, Globe } from 'lucide-react'
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
        id: 'Prayer Breaks Chains',
        name: 'PBC T-Shirt',
        description: 'Make a bold statement with the “Prayer Breaks Chains” tee. Featuring a powerful message and striking imagery, this shirt serves as both a spiritual reminder and a fashion piece. Crafted from premium cotton for durability and comfort,  perfect for those who walk in faith daily.',
        image: 'https://6qve25pmkn.ufs.sh/f/kHBAST0eCUiRe1QJ6CE6gJctEQmypDOwv4rWUTY9fhVi0on8',
        price: {
            us: 'USD $18.99',
            uk: '£16.99'
        },
        links: {
            us: 'https://a.co/d/7VNUOBV', // Replace with actual Amazon US link
            uk: 'https://www.amazon.com'  // Replace with actual Amazon UK link
        }
    },
    {
        id: 'dog',
        name: 'Love Dogs',
        description: 'Celebrate your love for dogs with this witty and heartwarming shirt. Featuring a heartbeat graphic and the message “Don’t Make Me Choose,”  perfect for dog lovers who consider their pup part of the family. Soft, breathable, and fun—just like your best friend.',
        image: 'https://6qve25pmkn.ufs.sh/f/kHBAST0eCUiRVN10kcyBdP3vs0fu5XoLRbpl8ZTkhF6rDqIS',
        price: {
            us: 'USD $18.99',
            uk: '£24.99'
        },
        links: {
            us: ' https://a.co/d/7H08nyC', // Replace with actual Amazon US link
            uk: ' https://a.co/d/7H08nyC'  // Replace with actual Amazon UK link
        }
    },
    {
        id: 'apg',
        name: 'Put God First',
        description: 'Keep your faith at the forefront with this “Always Put God at the Center” tee. The elegant globe design represents God’s presence in every part of your life. Made with soft, high-quality fabric, it’s ideal for Sunday service or everyday wear.',
        image: 'https://6qve25pmkn.ufs.sh/f/kHBAST0eCUiR8c5AEZaynJRpkYjLvsQxZV3AmTiGWr6PXMdO',
        price: {
            us: 'USD $18.99',
            uk: '£24.99'
        },
        links: {
            us: 'https://a.co/d/g0lt1yw', // Replace with actual Amazon US link
            uk: 'https://www.amazon.com' // Replace with actual Amazon UK link
        }
    },

    {
        id: 'pullover',
        name: 'Put God First Hoodie',
        description: 'Stay warm and grounded in faith with this cozy “Put God at the Center” hoodie. Featuring a celestial earth design and a clean spiritual message,  perfect for cool days, prayer walks, or quiet reflection. A must-have for anyone who leads with faith.',
        image: 'https://6qve25pmkn.ufs.sh/f/kHBAST0eCUiRfR8u6p79CFSdEtbAj5NHWgTKMRkcGLDaPYVw',
        price: {
            us: 'USD $34.99',
            uk: '£34.99'
        },
        links: {
            us: 'https://a.co/d/bmriH68', // Replace with actual Amazon US link
            uk: 'https://www.amazon.com'  // Replace with actual Amazon UK link
        }
    },
    {
        id: 'gymlife',
        name: 'Gym Life',
        description: 'For those who feel at home under the barbell, this “Gym Life - I Love It Here” tee is your perfect workout companion. The bold red and black color scheme makes a strong statement while the soft cotton keeps you moving comfortably—whether lifting or lounging.',
        image: 'https://6qve25pmkn.ufs.sh/f/kHBAST0eCUiRl23i1JTWAEhTzr5quwHZJYo3dnL69NmvsB1U',
        price: {
            us: 'USD $18.99',
            uk: '£24.99'
        },
        links: {
            us: ' https://a.co/d/648VpXP', // Replace with actual Amazon US link
            uk: 'https://amazon.com'  // Replace with actual Amazon UK link
        }
    },
    {
        id: 'cat-tshirt',
        name: 'Cat T-Shirt',
        description: 'Cat lovers rejoice! This shirt says it all with a heartbeat graphic and the clever message, “Don’t Make Me Choose.” Whether you’re curling up with your feline or heading out for a casual day, this tee brings charm, comfort, and a dash of sass.',
        image: 'https://6qve25pmkn.ufs.sh/f/kHBAST0eCUiRtb3BIujUHP9u7v1CQnfGKjwTmWOI40pLJr2i',
        price: {
            us: 'USD $18.99',
            uk: '£24.99'
        },
        links: {
            us: 'https://a.co/d/9PRSc58', // Replace with actual Amazon US link
            uk: 'https://www.amazon.com'  // Replace with actual Amazon UK link
        }
    },

]

type Region = 'us' | 'uk' | 'canada' | 'jamaica'

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
            if (timezone === 'America/Jamaica' || locale.includes('jm') || locale.includes('JM')) {
                return 'jamaica'
            }
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
                <strong>Thank you, Canadian friends!</strong> While Amazon Merch isn't available in Canada,
                you can still be part of my recovery journey by supporting our designs on TeePublic.
                Every purchase, no matter the platform, helps me rebuild and creates meaningful impact.
                <Button
                    variant="link"
                    className="p-0 h-auto ml-2 text-yellow-700 underline"
                    onClick={() => window.open('https://www.teepublic.com/user/shopdw', '_blank')}
                >
                    <Heart className="h-4 w-4 mr-1" />
                    Support on TeePublic
                </Button>
            </AlertDescription>
        </Alert>
    )

    const renderProductCard = (product: Product) => (
        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="aspect-square overflow-hidden -mt-6">
                <Image
                    src={product.image}
                    alt={product.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                />
            </div>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    {product.name}
                    <Badge variant="secondary">
                        {selectedRegion === 'uk' ? product.price.uk : product.price.us}
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
                                selectedRegion === 'uk' ? product.links.uk : product.links.us,
                                '_blank'
                            )}
                        >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Buy on Amazon {selectedRegion === 'uk' ? 'UK' : 'US'}
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
                <h1 className="text-4xl font-bold mb-4">Support Small Business Collection</h1>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
                    Every t-shirt and design you see here represents more than just apparel—it's part of my journey to rebuild
                    after a life-changing accident. Your support helps me create passive income and continue my path to independence
                    through resilience and creativity.
                </p>
                <div className="flex items-center justify-center gap-2 mb-8">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium text-gray-700">
                        Supporting recovery, one design at a time
                    </span>
                </div>
            </div>

            {/* Canadian Customer Message */}
            {selectedRegion === 'canada' && renderCanadianMessage()}

            {/* Personal Support Message */}
            {selectedRegion !== 'canada' && (
                <Alert className="mb-8 border-blue-200 bg-blue-50">
                    <Heart className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        <strong>Your Support Makes a Difference:</strong> Each purchase helps fund my recovery journey and
                        path to financial independence. When you buy these designs, you're directly contributing to someone
                        rebuilding their life after a life-changing accident. Thank you for being part of my story.
                    </AlertDescription>
                </Alert>
            )}



            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {products.map(renderProductCard)}
            </div>

            {/* Footer Message */}
            <div className="text-center p-8 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">The Impact of Your Support</h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    When you purchase from this collection, you're not just buying apparel—you're investing in someone's
                    recovery journey and helping turn adversity into opportunity through creativity and determination.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div className="flex flex-col items-center">
                        <Heart className="h-8 w-8 text-red-500 mb-2" />
                        <h4 className="font-medium">Personal Journey</h4>
                        <p className="text-gray-600">Every purchase directly supports recovery and independence after a life-changing accident</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <ShoppingCart className="h-8 w-8 text-blue-500 mb-2" />
                        <h4 className="font-medium">Quality Designs</h4>
                        <p className="text-gray-600">Each design is created with care and printed on premium materials through trusted platforms</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <Globe className="h-8 w-8 text-green-500 mb-2" />
                        <h4 className="font-medium">Meaningful Impact</h4>
                        <p className="text-gray-600">Your support helps create passive income and financial stability during recovery</p>
                    </div>
                </div>

                {selectedRegion === 'canada' && (
                    <div className="mt-6 p-4 bg-yellow-100 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>Canadian supporters:</strong> While Amazon Merch isn't available in Canada,
                            you can still be part of my recovery journey through our TeePublic store with Canadian shipping!
                            <Button
                                variant="link"
                                className="p-0 h-auto ml-2 text-yellow-700 underline text-sm"
                                onClick={() => window.open('https://www.teepublic.com/user/shopdw', '_blank')}
                            >
                                Support on TeePublic
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