import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ClientProduct } from "@/lib/types/product.types";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
    product: ClientProduct;
}

export function ProductCard({ product }: ProductCardProps) {
    const {
        id,
        name,
        description,
        slug,
        inventories,
        mainImage,
        averageRating,
        reviewCount,
        price,
        compareAtPrice,
        hasDiscount,
        discountPercentage
    } = product;

    const [isHovered, setIsHovered] = useState(false);
    const inventory = inventories[0];
    const isOutOfStock = !inventory?.quantity || inventory.quantity <= 0;

    // Calculate the display price
    const displayPrice = hasDiscount && compareAtPrice && discountPercentage
        ? (Number(compareAtPrice) - (Number(compareAtPrice) * Number(discountPercentage) / 100))
        : price;

    // Determine what price to display as the original price (for strikethrough)
    let originalPrice = null;
    if (hasDiscount && compareAtPrice) {
        originalPrice = Number(compareAtPrice);
    }

    return (
        <Card
            className="group overflow-hidden transition-all duration-300 hover:shadow-lg border-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative">
                <Link href={`/products/${slug}`} className="block">
                    <div className="aspect-square relative overflow-hidden">
                        <Image
                            src={inventory?.images?.[0]?.startsWith('http') ? inventory.images[0] : `/uploads/${inventory?.images?.[0]}` || mainImage || "/images/placeholder.svg"}
                            alt={name}
                            width={500}
                            height={500}
                            className={cn(
                                "object-cover transition-transform duration-500",
                                isHovered ? "scale-105" : "scale-100"
                            )}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {hasDiscount && discountPercentage && (
                            <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs font-semibold rounded-full">
                                {discountPercentage}% OFF
                            </span>
                        )}

                        {isOutOfStock && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="bg-white text-black px-3 py-1 rounded-full text-sm font-medium">
                                    Out of Stock
                                </span>
                            </div>
                        )}
                    </div>

                    <CardContent className="p-4">
                        <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors mb-1">
                            {name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {description}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                {originalPrice ? (
                                    <>
                                        <span className="text-lg font-bold">${Number(displayPrice).toFixed(2)}</span>
                                        <span className="text-sm text-muted-foreground line-through">${Number(originalPrice).toFixed(2)}</span>
                                    </>
                                ) : (
                                    <span className="text-lg font-bold">${Number(displayPrice).toFixed(2)}</span>
                                )}
                            </div>

                            {averageRating !== null && (
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-medium">{averageRating?.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Link>

                <CardFooter className="p-4 pt-0">
                    {isOutOfStock ? (
                        <Button
                            variant="outline"
                            className="w-full opacity-50 cursor-not-allowed"
                            disabled
                        >
                            Out of Stock
                        </Button>
                    ) : (
                        <Button
                            variant="default"
                            className="w-full group-hover:bg-primary/90 transition-colors"
                            asChild
                        >
                            <Link href={`/products/${slug}`}>
                                View More
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    )}
                </CardFooter>
            </div>
        </Card>
    );
}