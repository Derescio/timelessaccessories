import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, ShoppingCart, Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Product {
    id: string
    name: string
    description: string
    image: string
    price: {
        us: string
        uk: string
    }
}

// Featured products for home page preview
const featuredProducts: Product[] = [
    {
        id: 'pbc-tshirt',
        name: 'PBC T-Shirt',
        description: 'Premium quality cotton t-shirt with unique PBC design.',
        image: 'https://6qve25pmkn.ufs.sh/f/kHBAST0eCUiRe1QJ6CE6gJctEQmypDOwv4rWUTY9fhVi0on8',
        price: {
            us: '$19.99',
            uk: '£16.99'
        }
    },
    {
        id: 'always-tshirt',
        name: 'Premium Pullover',
        description: 'Cozy pullover perfect for casual wear.',
        image: 'https://6qve25pmkn.ufs.sh/f/kHBAST0eCUiR8c5AEZaynJRpkYjLvsQxZV3AmTiGWr6PXMdO',
        price: {
            us: '$29.99',
            uk: '£24.99'
        }
    },
    {
        id: 'gymlife',
        name: 'Gym Life Tee',
        description: 'Perfect for your workout sessions.',
        image: 'https://6qve25pmkn.ufs.sh/f/kHBAST0eCUiRl23i1JTWAEhTzr5quwHZJYo3dnL69NmvsB1U',
        price: {
            us: '$24.99',
            uk: '£19.99'
        }
    }
]

const AmazonMerch = () => {
    return (
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Amazon Merch Collection</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                        Support our small business with premium quality apparel available on Amazon.
                        Each purchase helps us continue creating unique designs.
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <Heart className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium">Supporting Small Business</span>
                    </div>
                </div>

                {/* Products Preview Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {featuredProducts.map((product) => (
                        <Link key={product.id} href="/amazon-merch" className="group">
                            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group-hover:scale-105">
                                <div className="aspect-square overflow-hidden">
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        width={400}
                                        height={400}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                </div>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        {product.name}
                                        <Badge variant="secondary">
                                            {product.price.us}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription className="text-sm text-gray-600">
                                        {product.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Available on Amazon</span>
                                        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Call to Action */}
                <div className="text-center">
                    <Link href="/amazon-merch">
                        <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3">
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            View Full Collection
                            <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                    <p className="text-sm text-gray-500 mt-4">
                        Available in United States & United Kingdom
                    </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-12 border-t">
                    <div className="text-center">
                        <Heart className="h-8 w-8 text-red-500 mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">Small Business</h3>
                        <p className="text-sm text-gray-600">Supporting independent creators and entrepreneurs</p>
                    </div>
                    <div className="text-center">
                        <ShoppingCart className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">Quality Products</h3>
                        <p className="text-sm text-gray-600">Premium materials and printing through Amazon</p>
                    </div>
                    <div className="text-center">
                        <ExternalLink className="h-8 w-8 text-green-500 mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">Global Reach</h3>
                        <p className="text-sm text-gray-600">Available in US & UK with Amazon's reliable shipping</p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default AmazonMerch
