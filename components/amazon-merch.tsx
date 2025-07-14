import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, ShoppingCart, Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ShinyText from '@/components/ui/reactbits/shiny-text'
import BlurText from '@/components/ui/reactbits/blur-text'
import CircularText from '@/components/ui/reactbits/circular-text'

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
            us: 'USD $18.99',
            uk: '£16.99'
        }
    },
    {
        id: 'always-tshirt',
        name: 'Premium Pullover',
        description: 'Cozy pullover perfect for casual wear.',
        image: 'https://6qve25pmkn.ufs.sh/f/kHBAST0eCUiR8c5AEZaynJRpkYjLvsQxZV3AmTiGWr6PXMdO',
        price: {
            us: 'USD $18.99',
            uk: '£24.99'
        }
    },
    {
        id: 'gymlife',
        name: 'Gym Life Tee',
        description: 'Perfect for your workout sessions.',
        image: 'https://6qve25pmkn.ufs.sh/f/kHBAST0eCUiRl23i1JTWAEhTzr5quwHZJYo3dnL69NmvsB1U',
        price: {
            us: 'USD $18.99',
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
                    <h2 className="text-4xl font-extralight mb-4">

                        T-Shirt Collection
                        {/* className="text-3xl font-bold text-gray-900"
                            animationDuration="2.5s" */}
                        {/* <ShinyText text="T-Shirts" /> */}
                    </h2>
                    <BlurText
                        text="Support our small business with our apparel available on Amazon and TeePublic. Each purchase helps us continue creating unique designs."
                        className="text-gray-600 max-w-2xl mx-auto mb-6"
                        delay={30}
                    />
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <Heart className="h-5 w-5 text-red-500" />
                        <BlurText
                            text="Support Small Businesses."
                            className="text-sm font-medium"
                            delay={100}
                        />
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
                                        <span className="text-sm text-gray-500">View More</span>
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
                            {/* <ShoppingCart className="h-5 w-5 mr-2" /> */}
                            View Full Collection
                            <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                    {/* <p className="text-sm text-gray-500 mt-4">
                        Available in United States & United Kingdom
                    </p> */}
                </div>

                {/* Features */}
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-12 border-t">
                    <div className="text-center">
                        <div className="relative mb-4">
                            <CircularText
                                text="SUPPORT • SMALL • BUSINESS • "
                                onHover="speedUp"
                                spinDuration={15}
                                size={120}
                                fontSize={12}
                                color="#ef4444"
                                className="mx-auto"
                            />
                            <Heart className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-red-500" />
                        </div>
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
                </div> */}
            </div>
        </section>
    )
}

export default AmazonMerch
