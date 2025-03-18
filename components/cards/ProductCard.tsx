'use client'
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Star } from "lucide-react";
import { ProductCardProduct } from "@/types";
import ProductCardButton from "./ProductCardButton";

interface ProductCardProps {
    product: ProductCardProduct;
}

export function ProductCard({ product }: ProductCardProps) {
    const {
        id,
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

    // ProductCardProduct doesn't have inventory SKU information
    // We should update the transformProducts function to include this
    // For now, use the product ID directly
    const inventoryId = id;

    console.warn(`Product ${id} (${name}) is using product ID as inventory ID. This should be fixed in the product transformation.`);

    return (
        <Card className="overflow-hidden group">
            <Link href={`/products/${slug}`} className="block">
                <div className="aspect-square relative overflow-hidden">
                    <Image
                        src={mainImage}
                        alt={name}
                        width={500}
                        height={500}
                        className="object-cover transition-transform group-hover:scale-105"
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
                <ProductCardButton
                    productId={id}
                    inventoryId={inventoryId}
                />
            </CardFooter>
        </Card>
    );
} 