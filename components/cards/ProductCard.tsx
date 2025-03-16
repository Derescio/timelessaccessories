import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star } from "lucide-react";
import { ProductCardProduct } from "@/types";

interface ProductCardProps {
    product: ProductCardProduct;
}

export function ProductCard({ product }: ProductCardProps) {
    const {
        name,
        price,
        compareAtPrice,
        hasDiscount,
        discountPercentage,
        mainImage,
        slug,
        category,
        averageRating,
        reviewCount,
    } = product;

    return (
        <Card className="overflow-hidden group">
            <Link href={`/products/${slug}`} className="block">
                <div className="aspect-square relative overflow-hidden">
                    <Image
                        src={mainImage}
                        alt={name}
                        // fill
                        width={500}
                        height={500}
                        className="object-cover transition-transform group-hover:scale-105"
                    // sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    {hasDiscount && discountPercentage && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs font-semibold rounded">
                            {discountPercentage}% OFF
                        </span>
                    )}
                </div>
                <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-2">
                        {category.name}
                    </div>
                    <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {name}
                    </h3>
                    <div className="mt-2 space-x-2">
                        <span className="font-bold">${price.toFixed(2)}</span>
                        {hasDiscount && compareAtPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                                ${compareAtPrice.toFixed(2)}
                            </span>
                        )}
                    </div>
                    {averageRating !== null && (
                        <div className="mt-2 flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground">({reviewCount})</span>
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