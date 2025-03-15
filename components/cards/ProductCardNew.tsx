import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star } from "lucide-react";
import { Product } from "@/types";
import Link from "next/link";


interface ProductCardProps {
    product: Product;
}


export function ProductCard({ product }: ProductCardProps) {
    const {
        name,
        description,
        slug,
        // category,
        inventories,
        mainImage,
        averageRating,
        reviewCount,
        price,
        compareAtPrice,
        hasDiscount,
        discountPercentage
    } = product;

    const inventory = inventories[0];

    //console.log(product)
    // <Link href={`/products/${slug}`} className="block">
    //         </Link>

    return (
        <Card key={product.id} className="p-0 flex flex-col justify-between">
            <Link href={`/products/${slug}`} className="block">
                <CardHeader className="p-0 relative">
                    {/* <div className="aspect-square relative overflow-hidden"> */}
                    <Image
                        src={inventory.images[0] || mainImage || "/path/to/default/image.jpg"}
                        alt={name}
                        width={300}
                        height={500}
                        className="w-full h-full object-cover rounded-t-lg"
                    //sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    {hasDiscount && discountPercentage && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs font-semibold rounded">
                            {discountPercentage}% OFF
                        </span>
                    )}
                    {/* </div> */}
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                        {description}
                    </p>

                    <div className="mt-2 space-x-2">
                        <span className="font-bold">${Number(price).toFixed(2)}</span>
                        {hasDiscount && compareAtPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                                ${Number(compareAtPrice).toFixed(2)}
                            </span>
                        )}
                    </div>
                    {averageRating !== null && (
                        <div className="mt-2 flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{averageRating?.toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground">({reviewCount || 0}) Reviews</span>
                        </div>
                    )}
                </CardContent>
            </Link>
            <CardFooter className="p-4 pt-0">
                <Button className="w-full" size="sm">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                </Button>
            </CardFooter>
        </Card>
    );
}