'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, Heart, ShoppingCart, Globe } from 'lucide-react'
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
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC15JinwTAaREc4eLuUvAfnNk19BIyhYi7qTj2P',
        price: '$27.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/prayer+breaks+chains-A68a23259415e485ba7fb6c8d?productType=210&sellable=EmAaG1N8dOTzJDnVe097-210-7&appearance=2',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/prayer+breaks+chains?idea=68a23259415e485ba7fb6c8d'
    },
    {
        id: 'love-dogs',
        name: 'Love Dogs T-Shirt',
        description: 'Show off your pup pride with this playful tee! Featuring a heartbeat design and the message “Don’t Make Me Choose,” it’s a fun nod to the bond between you and your furry best friend. Lightweight and comfy for walks, playdates, or lounging.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1zSWYvxZGMipIkaYwoR457lqtWbcZxu3ASgC8',
        price: '$27.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/dog+lover+top-A68a21b07d8225447c222f19d?productType=210&sellable=G7d4xxMw8gskEVGN5g4a-210-7&appearance=231',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/dog+lover+top?idea=68a21b07d8225447c222f19d'
    },
    {
        id: 'put-god-first',
        name: 'Put God First T-Shirt',
        description: 'Keep your priorities clear. The globe-inspired design symbolizes God’s presence everywhere, while the message calls you to live centered in faith. Crafted with premium cotton, great for both worship and casual wear.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1UVtthYrwsyEB8mJO4du0V3CxnePaqlkSfzKR',
        price: '$27.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/always+put+god+at+the+center-A68a2168943e5e7595330bf94?productType=210&sellable=doQBnO7DDQf97dxw0lqv-210-7&appearance=22',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/always+put+god+at+the+center?idea=68a2168943e5e7595330bf94'
    },

    {
        id: 'gym-life',
        name: 'Gym Life T-Shirt',
        description: 'For those who love the grind. Bold red and black graphics declare “Gym Life – I Love It Here” while soft, durable cotton keeps you comfortable through every rep. A perfect mix of strength and style.',
        image: 'https://6qve25pmkn.ufs.sh/f/kHBAST0eCUiRCaBtJuwwksW79zbgyLlJmSCdjXAfZDYKFIVG',
        price: '$27.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/gym+life+t-shirt-A68dd7dbad468d755a5fa2ee6?productType=347&sellable=BvJbRzdQ9ef58gNN90BR-347-8&appearance=17',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/gym+t-shirt?idea=68a211bd415e485ba72d692f'
    },
    {
        id: 'cat-tshirt',
        name: 'Cat Lover T-Shirt',
        description: 'Purrfect for cat people. With its heartbeat graphic and cheeky “Don’t Make Me Choose” message, this tee captures the love only cat owners understand. Cozy, fun, and made for everyday wear.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1Lb9FE9I9JrGl8gQzSMPTmXfRZtNsaBiEVYxc',
        price: '$27.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/cat+love-A68a145cfd8225447c2df1d94?productType=210&sellable=G7d4nMOwnzfkEVGBpEn0-210-7&appearance=231',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/cat+love?idea=68a145cfd8225447c2df1d94'
    },

    {
        id: 'prayer-breaks-chains-crewneck',
        name: 'Prayer Breaks Chains Crewneck',
        description: 'Make a statement of faith and fashion. This crewneck delivers the same powerful message as the tee, in a warm, premium cotton blend. Perfect for cool nights, prayer walks, or casual layering.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1rVvXXIwklcBvxSCIKuHgWT5zDo3Mey8XPw0t',
        price: '$48.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/prayer+breaks+chains-A68a23259415e485ba7fb6c8d?productType=512&sellable=EmAaG1N8dOTzJDnVe097-512-27&appearance=1',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/prayer+breaks+chains?idea=68a23259415e485ba7fb6c8d'
    },
    {
        id: 'love-dogs-crewneck',
        name: 'Love Dogs Crewneck',
        description: 'Wrap yourself in comfort while repping your love for dogs. The witty “Don’t Make Me Choose” design meets soft, durable fabric — a must-have for every dog parent.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1jqLqZXHzTl6wHDVBg71Zh4Y9XUfp5AmObd2N',
        price: '$48.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/dog+lover+top-A68a21b07d8225447c222f19d?productType=512&sellable=G7d4xxMw8gskEVGN5g4a-512-27&appearance=1',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/dog+lover+top?idea=68a21b07d8225447c222f19d'
    },
    {
        id: 'put-god-first-crewneck',
        name: 'Put God First Crewneck',
        description: 'Carry your faith wherever you go. Featuring the globe-inspired design, this crewneck is soft, versatile, and ideal for Sunday mornings, Bible study, or daily wear.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1zNCoKoZGMipIkaYwoR457lqtWbcZxu3ASgC8',
        price: '$48.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/always+put+god+at+the+center-A68a2168943e5e7595330bf94?productType=512&sellable=doQBnO7DDQf97dxw0lqv-512-26&appearance=2',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/always+put+god+at+the+center?idea=68a2168943e5e7595330bf94'
    },

    {
        id: 'love-cat-crewneck',
        name: 'Cat Lover Crewneck',
        description: 'Cozy up with your cat and this fun-loving crewneck. The playful design celebrates the unbreakable bond between you and your feline friend — stylish, comfortable, and perfect for cat lovers.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1EGvI6sQewmSvfgJ7Gn4YCA1rFyRXo09iIc5H',
        price: '$48.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/cat+love-A68a145cfd8225447c2df1d94?productType=512&sellable=G7d4nMOwnzfkEVGBpEn0-512-27&appearance=1',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/cat+love?idea=68a145cfd8225447c2df1d94'
    },
    {
        id: 'put-god-first-hoodie',
        name: 'Put God First Hoodie',
        description: 'Faith meets warmth. This hoodie’s globe-inspired artwork symbolizes God at the center of everything, while its premium fabric keeps you cozy. Ideal for cool days, prayer walks, or reflection time.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1rmaT3awklcBvxSCIKuHgWT5zDo3Mey8XPw0t',
        price: '$53.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/always+put+god+at+the+center-A68a2168943e5e7595330bf94?productType=405&sellable=doQBnO7DDQf97dxw0lqv-405-23&appearance=129',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/always+put+god+at+the+center?idea=68a2168943e5e7595330bf94'
    },
    {
        id: 'love-dogs-hoodie',
        name: 'Love Dogs Hoodie',
        description: 'Show your dog love loud and proud. Featuring the “Don’t Make Me Choose” heartbeat graphic, this hoodie is equal parts playful and cozy — made for park strolls, chilly evenings, and pup cuddles.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1jD13clzTl6wHDVBg71Zh4Y9XUfp5AmObd2NP',
        price: '$53.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/dog+lover+top-A68a21b07d8225447c222f19d?productType=111&sellable=G7d4xxMw8gskEVGN5g4a-111-22&appearance=231',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/dog+lover+top?idea=68a21b07d8225447c222f19d'
    },
    {
        id: 'gym-life-hoodie',
        name: 'Gym Life Hoodie',
        description: 'Level up your gym fit. The “Gym Life – I Love It Here” design pairs bold style with lasting comfort. Perfect for pre-workout warmth, post-training chill, or just repping your love for the grind.',
        image: 'https://6qve25pmkn.ufs.sh/f/kHBAST0eCUiR28pwCd613QkbvWgU2Gs4wl85IKV7AqXo1HNZ',
        price: '$53.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/gym+life+t-shirt-A68dd7dbad468d755a5fa2ee6?productType=111&sellable=BvJbRzdQ9ef58gNN90BR-111-22&appearance=8',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/gym+life+t-shirt-A68dd7dbad468d755a5fa2ee6?productType=111&sellable=BvJbRzdQ9ef58gNN90BR-111-22&appearance=8'
    },
]

const SpreadshopMerch = () => {

    const renderProductCard = (product: Product) => (
        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
            <Link href={`/shopdw-merch/${product.id}`}>
                <div className="aspect-square overflow-hidden -mt-6 cursor-pointer">
                    <Image
                        src={product.image}
                        alt={product.name}
                        width={400}
                        height={400}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
            </Link>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <Link
                        href={`/shopdw-merch/${product.id}`}
                        className="hover:text-blue-600 transition-colors"
                    >
                        {product.name}
                    </Link>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {product.price}
                    </Badge>
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                    {product.description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <Link href={`/shopdw-merch/${product.id}`}>
                        <Button className="w-full bg-gray-800 hover:bg-gray-900">
                            View Details
                        </Button>
                    </Link>

                    {/* <a href={product.spreadshopLink} target="_blank" rel="noopener noreferrer">
                        <Button
                            variant="outline"
                            className="w-full text-sm border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                            <ShoppingCart className="h-3 w-3 mr-2" />
                            Quick Buy
                            <ExternalLink className="h-3 w-3 ml-2" />
                        </Button>
                    </a> */}
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Shop-DW Merch Collection</h1>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
                    Every t-shirt and design you see here represents more than just apparel, it represents creativity. Wear your ideas. Each design in the collection isn’t just clothing, it’s a statement of creativity, individuality, and community. Select any merch or two, and purchase them on Spreadshop!
                </p>
                <div className="flex items-center justify-center gap-2 mb-8">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium text-gray-700">
                        Support small businesses, one design at a time.
                    </span>
                </div>

            </div>

            {/* Spreadshop Benefits Message */}
            {/* <Alert className="mb-8 border-blue-200 bg-blue-50">
                <Globe className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                    <strong>Now Available Worldwide!</strong> Our collection is now exclusively available through Spreadshop,
                    offering global shipping, multiple product variations, and competitive pricing. Each purchase helps fund my
                    recovery journey and path to financial independence. Thank you for being part of my story.
                </AlertDescription>
            </Alert> */}



            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {products.map(renderProductCard)}
            </div>

            {/* Footer Message */}
            <div className="text-center p-8 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Why Choose Spreadshop?</h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    By partnering with Spreadshop, we can now offer you a better shopping experience with worldwide shipping,
                    multiple product variations, and competitive pricing—all while supporting my recovery journey.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div className="flex flex-col items-center">
                        <Globe className="h-8 w-8 text-blue-500 mb-2" />
                        <h4 className="font-medium">Global Shipping</h4>
                        <p className="text-gray-600">Available worldwide with reliable shipping to your doorstep, no matter where you are</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <ShoppingCart className="h-8 w-8 text-green-500 mb-2" />
                        <h4 className="font-medium">Multiple Variations</h4>
                        <p className="text-gray-600">Choose from various styles, colors, and sizes to find your perfect fit</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <Heart className="h-8 w-8 text-red-500 mb-2" />
                        <h4 className="font-medium">Supporting Small Businesses</h4>
                        <p className="text-gray-600">Every purchase directly supports small businesses and their creativity</p>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-blue-100 rounded-lg">
                    <p className="text-sm text-blue-800 mb-3">
                        <strong>Ready to explore our full collection?</strong>
                    </p>
                    <a href="https://shop-dw.myspreadshop.ca">
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                        // onClick={() => window.open('https://shop-dw.myspreadshop.ca', '_blank')}
                        >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Visit Our Spreadshop Store
                            <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                    </a>

                </div>
            </div>
        </div>
    )
}

export default SpreadshopMerch