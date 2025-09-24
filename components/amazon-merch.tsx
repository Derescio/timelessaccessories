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
    price: string
    spreadshopLink: string,
    spreadshopLink2: string
}

// Featured products for home page preview
const featuredProducts: Product[] = [
    //https://shop-dw.myspreadshop.ca/prayer+breaks+chains-A68a23259415e485ba7fb6c8d?productType=812&sellable=EmAaG1N8dOTzJDnVe097-812-7&appearance=2
    //https://shop-dw.myspreadshop.ca/prayer+breaks+chains-A68a23259415e485ba7fb6c8d?productType=813&sellable=EmAaG1N8dOTzJDnVe097-813-8&appearance=648
    {
        id: 'love-dogs',
        name: 'Love Dogs T-Shirt',
        description: 'Celebrate your love for dogs with this witty and heartwarming shirt. Featuring a heartbeat graphic and the message "Don\'t Make Me Choose," perfect for dog lovers who consider their pup part of the family. Soft, breathable, and fun—just like your best friend.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1zSWYvxZGMipIkaYwoR457lqtWbcZxu3ASgC8',
        price: '$27.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/dog+lover+top-A68a21b07d8225447c222f19d?productType=210&sellable=G7d4xxMw8gskEVGN5g4a-210-7&appearance=231',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/dog+lover+top?idea=68a21b07d8225447c222f19d'
    },
    {
        id: 'put-god-first-crewneck',
        name: 'Put God First Crewneck',
        description: 'Keep your faith at the forefront with this "Always Put God at the Center" crewneck. The elegant globe design represents God\'s presence in every part of your life. Made with soft, high-quality fabric, it\'s ideal for Sunday service or everyday wear.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC1zNCoKoZGMipIkaYwoR457lqtWbcZxu3ASgC8',
        price: '$48.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/always+put+god+at+the+center-A68a2168943e5e7595330bf94?productType=512&sellable=doQBnO7DDQf97dxw0lqv-512-26&appearance=2',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/always+put+god+at+the+center?idea=68a2168943e5e7595330bf94'
    },
    {
        id: 'gym-life',
        name: 'Gym Life T-Shirt',
        description: 'For those who feel at home under the barbell, this "Gym Life - I Love It Here" tee is your perfect workout companion. The bold red and black color scheme makes a strong statement while the soft cotton keeps you moving comfortably—whether lifting or lounging.',
        image: 'https://z8rvk24gry.ufs.sh/f/wfxchweshiC114OR9dDNn3QraJ1hwmUyzgZlFTjeRdAEW6IO',
        price: '$27.99',
        spreadshopLink: 'https://shop-dw.myspreadshop.ca/gym+t-shirt-A68a211bd415e485ba72d692f?productType=210&sellable=84nm9mr8v1Upw41AyDbD-210-7&appearance=1368',
        spreadshopLink2: 'https://shop-dw.myspreadshop.ca/gym+t-shirt?idea=68a211bd415e485ba72d692f'
    },
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
                        <div key={product.id}>
                            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group-hover:scale-105 p-0">
                                <div className="aspect-square overflow-hidden border-b border-gray-200 shadow-md">
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
                                            {product.price}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription className="text-sm text-gray-600">
                                        {product.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href={`/shopdw-merch/${product.id}`} className="group">
                                        <div className="flex items-center justify-center">
                                            <span className="text-sm w-full mb-6 bg-gray-800 text-white px-2 py-1 rounded-md text-center">View More</span>
                                            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                                        </div>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>

                    ))}
                </div>

                {/* Call to Action */}
                <div className="text-center">
                    <Link href="/shopdw-merch">
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