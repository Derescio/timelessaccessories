"use client";

import Link from "next/link";
import Image from "next/image";
import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
// import { formatPrice } from "@/lib/utils";
import { Star } from "lucide-react";
import type { ProductCardProduct } from "@/types";

interface ProductCardProps {
    product: ProductCardProduct;
}

export function ProductCard({ product }: ProductCardProps) {
    return (
        <Link href={`/products/${product.slug}`}>
            <Card className="group overflow-hidden rounded-lg border-2 border-border transition-all hover:border-foreground">
                <CardContent className="p-0">
                    <div className="relative aspect-square">
                        <Image
                            src={product.mainImage}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-2 p-4">
                    {product.category && (
                        <span className="text-sm text-muted-foreground">
                            {product.category.name}
                        </span>
                    )}
                    <h3 className="line-clamp-2 text-base font-semibold">
                        {product.name}
                    </h3>
                    <div className="flex w-full items-center justify-between gap-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-semibold">
                                ${product.price.toFixed(2)}
                            </span>
                            {product.compareAtPrice && product.compareAtPrice > product.price && (
                                <span className="text-sm text-muted-foreground line-through">
                                    ${product.compareAtPrice.toFixed(2)}
                                </span>
                            )}
                        </div>
                        {product.numReviews > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="h-4 w-4 fill-primary text-primary" />
                                <span>{product.numReviews}</span>
                            </div>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
} 