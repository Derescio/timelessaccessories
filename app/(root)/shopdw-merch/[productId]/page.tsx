'use client'

import React from 'react'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, Heart, ShoppingCart, Globe, ArrowLeft, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Product {
    id: string
    name: string
    description: string
    image: string
    price: string
    spreadshopLink: string
    spreadshopLink2: string
    detailedDescription?: string
    features?: string[]
    materials?: string[]
    sizes?: string[]
    colors?: string[]
}

const products: Product[] = [
    {
        id: 'prayer-breaks-chains',
        name: 'Prayer Breaks Chains T-Shirt',
        description: 'Wear your faith with strength. This tee combines bold imagery with a powerful spiritual message — reminding you daily that prayer breaks all chains. Soft, breathable cotton makes it perfect for everyday wear or church gatherings.',
        detailedDescription: 'This powerful design combines faith and fashion in a meaningful way. The "Prayer Breaks Chains" message serves as a daily reminder of the transformative power of prayer. Whether you\'re attending church, meeting friends, or simply going about your day, this shirt sparks conversations and shares hope.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC15JinwTAaREc4eLuUvAfnNk19BIyhYi7qTj2P',
        price: '$27.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/prayer+breaks+chains-A68a23259415e485ba7fb6c8d?productType=210&sellable=EmAaG1N8dOTzJDnVe097-210-7&appearance=2',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/prayer+breaks+chains?idea=68a23259415e485ba7fb6c8d',
        features: ['Inspirational message design', 'Comfortable daily wear', 'Conversation starter', 'Perfect for church or casual outings'],
        materials: ['100% Premium Cotton', 'Pre-shrunk fabric', 'Tear-away label', 'Double-needle stitching'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
        colors: ['Black', 'White', 'Navy', 'Dark Gray']
    },
    {
        id: 'love-dogs',
        name: 'Love Dogs T-Shirt',
        description: 'Show off your pup pride with this playful tee! Featuring a heartbeat design and the message “Don’t Make Me Choose,” it’s a fun nod to the bond between you and your furry best friend. Lightweight and comfy for walks, playdates, or lounging.',
        detailedDescription: 'Perfect for dog lovers who know their furry friend isn\'t just a pet—they\'re family. This design captures the unbreakable bond between humans and their canine companions with a touch of humor that every dog parent will relate to.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1zSWYvxZGMipIkaYwoR457lqtWbcZxu3ASgC8',
        price: '$27.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/dog+lover+top-A68a21b07d8225447c222f19d?productType=210&sellable=G7d4xxMw8gskEVGN5g4a-210-7&appearance=231',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/dog+lover+top?idea=68a21b07d8225447c222f19d',
        features: ['Heartbeat graphic design', 'Dog lover humor', 'Soft and comfortable', 'Great conversation starter'],
        materials: ['100% Premium Cotton', 'Pre-shrunk fabric', 'Comfortable fit', 'Durable print'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Black', 'White', 'Navy', 'Red', 'Purple']
    },
    {
        id: 'put-god-first',
        name: 'Put God First T-Shirt',
        description: 'Keep your priorities clear. The globe-inspired design symbolizes God’s presence everywhere, while the message calls you to live centered in faith. Crafted with premium cotton, great for both worship and casual wear.',
        detailedDescription: 'A beautiful reminder to keep God at the center of everything you do. The globe design symbolizes God\'s universal presence and love, making this shirt both spiritually meaningful and visually appealing.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1UVtthYrwsyEB8mJO4du0V3CxnePaqlkSfzKR',
        price: '$27.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/always+put+god+at+the+center-A68a2168943e5e7595330bf94?productType=210&sellable=doQBnO7DDQf97dxw0lqv-210-7&appearance=22',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/always+put+god+at+the+center?idea=68a2168943e5e7595330bf94',
        features: ['Elegant globe design', 'Faith-centered message', 'Versatile styling', 'Premium quality'],
        materials: ['100% Premium Cotton', 'Soft hand feel', 'Pre-shrunk', 'Reinforced seams'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
        colors: ['Black', 'White', 'Navy', 'Forest Green']
    },
    {
        id: 'put-god-first-hoodie',
        name: 'Put God First Hoodie',
        description: 'Faith meets warmth. This hoodie’s globe-inspired artwork symbolizes God at the center of everything, while its premium fabric keeps you cozy. Ideal for cool days, prayer walks, or reflection time.',
        detailedDescription: 'Perfect for cooler days, prayer walks, or quiet reflection. This hoodie combines comfort with spiritual inspiration, featuring the same meaningful design as our t-shirt but with added warmth and coziness.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1rmaT3awklcBvxSCIKuHgWT5zDo3Mey8XPw0t',
        price: '$39.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/always+put+god+at+the+center-A68a2168943e5e7595330bf94?productType=405&sellable=doQBnO7DDQf97dxw0lqv-405-23&appearance=129',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/always+put+god+at+the+center?idea=68a2168943e5e7595330bf94',
        features: ['Cozy hoodie design', 'Celestial earth graphic', 'Perfect for prayer walks', 'Warm and comfortable'],
        materials: ['80% Cotton, 20% Polyester', 'Fleece-lined hood', 'Kangaroo pocket', 'Ribbed cuffs and hem'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
        colors: ['Black', 'Navy', 'Dark Gray', 'Maroon']
    },
    {
        id: 'gym-life',
        name: 'Gym Life T-Shirt',
        description: 'For those who love the grind. Bold red and black graphics declare “Gym Life – I Love It Here” while soft, durable cotton keeps you comfortable through every rep. A perfect mix of strength and style.',
        detailedDescription: 'Designed for fitness enthusiasts who live and breathe the gym lifestyle. The bold design makes a statement while the comfortable fabric keeps you moving, whether you\'re lifting heavy or just representing your passion.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC114OR9dDNn3QraJ1hwmUyzgZlFTjeRdAEW6IO',
        price: '$27.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/gym+t-shirt-A68a211bd415e485ba72d692f?productType=210&sellable=84nm9mr8v1Upw41AyDbD-210-7&appearance=1368',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/gym+t-shirt?idea=68a211bd415e485ba72d692f',
        features: ['Bold gym-inspired design', 'Workout-friendly fabric', 'Motivational message', 'Comfortable fit'],
        materials: ['100% Premium Cotton', 'Moisture-wicking', 'Breathable fabric', 'Durable construction'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
        colors: ['Black', 'Red', 'Navy', 'Charcoal']
    },
    {
        id: 'cat-tshirt',
        name: 'Cat Lover T-Shirt',
        description: 'Purrfect for cat people. With its heartbeat graphic and cheeky “Don’t Make Me Choose” message, this tee captures the love only cat owners understand. Cozy, fun, and made for everyday wear.',
        detailedDescription: 'Every cat parent knows the struggle—when it comes to choosing between your cat and anything else, there\'s really no contest. This shirt celebrates that special bond with humor and heart.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1Lb9FE9I9JrGl8gQzSMPTmXfRZtNsaBiEVYxc',
        price: '$27.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/cat+love-A68a145cfd8225447c2df1d94?productType=210&sellable=G7d4nMOwnzfkEVGBpEn0-210-7&appearance=231',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/cat+love?idea=68a145cfd8225447c2df1d94',
        features: ['Cat lover humor', 'Heartbeat design', 'Soft and comfortable', 'Perfect for cat parents'],
        materials: ['100% Premium Cotton', 'Pre-shrunk fabric', 'Comfortable fit', 'Long-lasting print'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Black', 'White', 'Purple', 'Navy', 'Pink']
    },
    {
        id: 'prayer-breaks-chains-crewneck',
        name: 'Prayer Breaks Chains Crewneck',
        description: 'Make a statement of faith and fashion. This crewneck delivers the same powerful message as the tee, in a warm, premium cotton blend. Perfect for cool nights, prayer walks, or casual layering.',
        detailedDescription: 'Perfect for cooler days, prayer walks, or quiet reflection. This hoodie combines comfort with spiritual inspiration, featuring the same meaningful design as our t-shirt but with added warmth and coziness.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1rVvXXIwklcBvxSCIKuHgWT5zDo3Mey8XPw0t',
        price: '$48.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/prayer+breaks+chains-A68a23259415e485ba7fb6c8d?productType=512&sellable=EmAaG1N8dOTzJDnVe097-512-27&appearance=1',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/prayer+breaks+chains?idea=68a23259415e485ba7fb6c8d',
        features: ['Cozy hoodie design', 'Celestial earth graphic', 'Perfect for prayer walks', 'Warm and comfortable'],
        materials: ['80% Cotton, 20% Polyester', 'Fleece-lined hood', 'Kangaroo pocket', 'Ribbed cuffs and hem'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
        colors: ['Black', 'Navy', 'Dark Gray', 'Maroon']
    },
    {
        id: 'put-god-first-crewneck',
        name: 'Put God First Crewneck',
        description: 'Carry your faith wherever you go. Featuring the globe-inspired design, this crewneck is soft, versatile, and ideal for Sunday mornings, Bible study, or daily wear.',
        detailedDescription: 'Perfect for cooler days, prayer walks, or quiet reflection. This hoodie combines comfort with spiritual inspiration, featuring the same meaningful design as our t-shirt but with added warmth and coziness.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1zNCoKoZGMipIkaYwoR457lqtWbcZxu3ASgC8',
        price: '$48.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/always+put+god+at+the+center-A68a2168943e5e7595330bf94?productType=512&sellable=doQBnO7DDQf97dxw0lqv-512-26&appearance=2',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/always+put+god+at+the+center?idea=68a2168943e5e7595330bf94',
        features: ['Cozy hoodie design', 'Celestial earth graphic', 'Perfect for prayer walks', 'Warm and comfortable'],
        materials: ['80% Cotton, 20% Polyester', 'Fleece-lined hood', 'Kangaroo pocket', 'Ribbed cuffs and hem'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
        colors: ['Black', 'Navy', 'Dark Gray', 'Maroon']
    },
    {
        id: 'love-dogs-crewneck',
        name: 'Love Dogs Crewneck',
        description: 'Wrap yourself in comfort while repping your love for dogs. The witty “Don’t Make Me Choose” design meets soft, durable fabric — a must-have for every dog parent.',
        detailedDescription: 'Perfect for cooler days, prayer walks, or quiet reflection. This hoodie combines comfort with spiritual inspiration, featuring the same meaningful design as our t-shirt but with added warmth and coziness.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1jqLqZXHzTl6wHDVBg71Zh4Y9XUfp5AmObd2N',
        price: '$48.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/dog+lover+top-A68a21b07d8225447c222f19d?productType=512&sellable=G7d4xxMw8gskEVGN5g4a-512-27&appearance=1',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/dog+lover+top?idea=68a21b07d8225447c222f19d',
        features: ['Cozy hoodie design', 'Celestial earth graphic', 'Perfect for prayer walks', 'Warm and comfortable'],
        materials: ['80% Cotton, 20% Polyester', 'Fleece-lined hood', 'Kangaroo pocket', 'Ribbed cuffs and hem'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
        colors: ['Black', 'Navy', 'Dark Gray', 'Maroon']
    },
    {
        id: 'love-cat-crewneck',
        name: 'Cat Lover Crewneck',
        description: 'Cozy up with your cat and this fun-loving crewneck. The playful design celebrates the unbreakable bond between you and your feline friend — stylish, comfortable, and perfect for cat lovers.',
        detailedDescription: 'Perfect for cooler days, prayer walks, or quiet reflection. This hoodie combines comfort with spiritual inspiration, featuring the same meaningful design as our t-shirt but with added warmth and coziness.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1EGvI6sQewmSvfgJ7Gn4YCA1rFyRXo09iIc5H',
        price: '$48.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/cat+love-A68a145cfd8225447c2df1d94?productType=512&sellable=G7d4nMOwnzfkEVGBpEn0-512-27&appearance=1',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/cat+love?idea=68a145cfd8225447c2df1d94',
        features: ['Cozy hoodie design', 'Celestial earth graphic', 'Perfect for prayer walks', 'Warm and comfortable'],
        materials: ['80% Cotton, 20% Polyester', 'Fleece-lined hood', 'Kangaroo pocket', 'Ribbed cuffs and hem'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
        colors: ['Black', 'Navy', 'Dark Gray', 'Maroon']
    },
    {
        id: 'put-god-first-hoodie',
        name: 'Put God First Hoodie',
        description: 'Faith meets warmth. This hoodie’s globe-inspired artwork symbolizes God at the center of everything, while its premium fabric keeps you cozy. Ideal for cool days, prayer walks, or reflection time.',
        detailedDescription: 'Perfect for cooler days, prayer walks, or quiet reflection. This hoodie combines comfort with spiritual inspiration, featuring the same meaningful design as our t-shirt but with added warmth and coziness.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1rmaT3awklcBvxSCIKuHgWT5zDo3Mey8XPw0t',
        price: '$53.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/always+put+god+at+the+center-A68a2168943e5e7595330bf94?productType=405&sellable=doQBnO7DDQf97dxw0lqv-405-23&appearance=129',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/always+put+god+at+the+center?idea=68a2168943e5e7595330bf94',
        features: ['Cozy hoodie design', 'Celestial earth graphic', 'Perfect for prayer walks', 'Warm and comfortable'],
        materials: ['80% Cotton, 20% Polyester', 'Fleece-lined hood', 'Kangaroo pocket', 'Ribbed cuffs and hem'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
        colors: ['Black', 'Navy', 'Dark Gray', 'Maroon']
    },
    {
        id: 'love-dogs-hoodie',
        name: 'Love Dogs Hoodie',
        description: 'Show your dog love loud and proud. Featuring the “Don’t Make Me Choose” heartbeat graphic, this hoodie is equal parts playful and cozy — made for park strolls, chilly evenings, and pup cuddles.',
        detailedDescription: 'Perfect for cooler days, prayer walks, or quiet reflection. This hoodie combines comfort with spiritual inspiration, featuring the same meaningful design as our t-shirt but with added warmth and coziness.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1jD13clzTl6wHDVBg71Zh4Y9XUfp5AmObd2NP',
        price: '$53.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/dog+lover+top-A68a21b07d8225447c222f19d?productType=111&sellable=G7d4xxMw8gskEVGN5g4a-111-22&appearance=231',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/dog+lover+top?idea=68a21b07d8225447c222f19d',
        features: ['Cozy hoodie design', 'Celestial earth graphic', 'Perfect for prayer walks', 'Warm and comfortable'],
        materials: ['80% Cotton, 20% Polyester', 'Fleece-lined hood', 'Kangaroo pocket', 'Ribbed cuffs and hem'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
        colors: ['Black', 'Navy', 'Dark Gray', 'Maroon']
    },
    {
        id: 'gym-life-hoodie',
        name: 'Gym Life Hoodie',
        description: 'Level up your gym fit. The “Gym Life – I Love It Here” design pairs bold style with lasting comfort. Perfect for pre-workout warmth, post-training chill, or just repping your love for the grind.',
        detailedDescription: 'Perfect for cooler days, prayer walks, or quiet reflection. This hoodie combines comfort with spiritual inspiration, featuring the same meaningful design as our t-shirt but with added warmth and coziness.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1xkXKTc4H6p1rXkOC8woNvYdiBHjesI0qfmP2',
        price: '$53.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/gym+t-shirt-A68a211bd415e485ba72d692f?productType=111&sellable=84nm9mr8v1Upw41AyDbD-111-22&appearance=8',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/gym+t-shirt?idea=68a211bd415e485ba72d692f',
        features: ['Cozy hoodie design', 'Celestial earth graphic', 'Perfect for prayer walks', 'Warm and comfortable'],
        materials: ['80% Cotton, 20% Polyester', 'Fleece-lined hood', 'Kangaroo pocket', 'Ribbed cuffs and hem'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
        colors: ['Black', 'Navy', 'Dark Gray', 'Maroon']
    },
]

interface ProductDetailPageProps {
    params: Promise<{
        productId: string
    }>
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
    const resolvedParams = React.use(params)
    const product = products.find(p => p.id === resolvedParams.productId)

    if (!product) {
        notFound()
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb Navigation */}
            <div className="mb-6">
                <Link
                    href="/shopdw-merch"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Collection
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
                {/* Product Image */}
                <div className="space-y-4">
                    <div className="aspect-square overflow-hidden rounded-lg border">
                        <Image
                            src={product.image}
                            alt={product.name}
                            width={600}
                            height={600}
                            className="w-full h-full object-cover"
                            priority
                        />
                    </div>
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                        <div className="flex items-center gap-4 mb-4">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-lg px-3 py-1">
                                {product.price}
                            </Badge>
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ))}
                                <span className="text-sm text-gray-600 ml-2">(Excellent Quality)</span>
                            </div>
                        </div>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            {product.detailedDescription || product.description}
                        </p>
                    </div>

                    {/* Purchase Buttons */}
                    <div className="space-y-3">
                        <a href={product.spreadshopLink} >
                            <Button
                                size="lg"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                            //onClick={() => window.open(product.spreadshopLink, '_blank')}
                            >
                                <ShoppingCart className="h-5 w-5 mr-3" />
                                Shop on Spreadshop
                                <ExternalLink className="h-5 w-5 ml-3" />
                            </Button>
                        </a>
                        <a href={product.spreadshopLink2} >
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 text-lg py-6 mt-2"
                            // onClick={() => window.open(product.spreadshopLink2, '_blank')}
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View All Variations & Colors
                            </Button>
                        </a>
                    </div>

                    {/* Support Message */}
                    <Alert className="border-green-200 bg-green-50">
                        <Heart className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            <strong>Supporting Small Businesses:</strong> Your purchase directly supports small businesses and their creativity. Thank you for supporting us!
                        </AlertDescription>
                    </Alert>
                </div>
            </div>

            {/* Product Details Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {/* Features */}
                {product.features && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Features</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {product.features.map((feature, index) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-start">
                                        <span className="text-blue-500 mr-2">•</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Materials */}
                {product.materials && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Materials</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {product.materials.map((material, index) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-start">
                                        <span className="text-green-500 mr-2">•</span>
                                        {material}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Available Sizes */}
                {product.sizes && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Available Sizes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {product.sizes.map((size, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {size}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Available Colors */}
                {product.colors && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Available Colors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {product.colors.map((color, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {color}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Why Spreadshop Section */}
            <Card className="bg-gray-50">
                <CardHeader>
                    <CardTitle className="text-xl">Why Choose Spreadshop?</CardTitle>
                    <CardDescription>
                        We've partnered with Spreadshop to provide you with the best possible shopping experience
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col items-center text-center">
                            <Globe className="h-8 w-8 text-blue-500 mb-3" />
                            <h4 className="font-semibold mb-2">Global Shipping</h4>
                            <p className="text-sm text-gray-600">Reliable worldwide delivery to your doorstep</p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <ShoppingCart className="h-8 w-8 text-green-500 mb-3" />
                            <h4 className="font-semibold mb-2">Premium Quality</h4>
                            <p className="text-sm text-gray-600">High-quality materials and professional printing</p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <Heart className="h-8 w-8 text-red-500 mb-3" />
                            <h4 className="font-semibold mb-2">Supporting Recovery</h4>
                            <p className="text-sm text-gray-600">Every purchase supports my journey to independence</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
