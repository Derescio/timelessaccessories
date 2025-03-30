"use client";

import { useState } from "react";
import Link from "next/link";
import { ClientProduct } from "@/lib/types/product.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";

interface ProductInfoProps {
    product: ClientProduct;
}

export function ProductInfo({ product }: ProductInfoProps) {
    const [quantity, setQuantity] = useState(1);

    const handleQuantityChange = (value: number) => {
        const newQuantity = Math.max(1, Math.min(value, product.inventory));
        setQuantity(newQuantity);
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <Link href={`/categories/${product.category.slug}`}>
                    <Badge variant="secondary" className="mb-2">
                        {product.category.name}
                    </Badge>
                </Link>
                <h1 className="text-3xl font-bold">{product.name}</h1>
                <div className="mt-4 flex items-baseline gap-4">
                    <span className="text-2xl font-semibold">
                        {formatPrice(product.price)}
                    </span>
                    {product.hasDiscount && product.compareAtPrice && (
                        <span className="text-lg text-muted-foreground line-through">
                            {formatPrice(product.compareAtPrice)}
                        </span>
                    )}
                    {product.hasDiscount && product.discountPercentage && (
                        <Badge variant="destructive">
                            {product.discountPercentage}% OFF
                        </Badge>
                    )}
                </div>
            </div>

            <div className="prose prose-sm">
                <p>{product.description}</p>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <label htmlFor="quantity" className="font-medium">
                        Quantity
                    </label>
                    <input
                        type="number"
                        id="quantity"
                        min="1"
                        max={product.inventory}
                        value={quantity}
                        onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                        className="w-20 rounded-md border px-3 py-2"
                    />
                    <span className="text-sm text-muted-foreground">
                        {product.inventory} available
                    </span>
                </div>

                <Button size="lg" className="w-full">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                </Button>
            </div>

            <div className="border-t pt-6">
                <h2 className="text-lg font-semibold mb-4">Product Details</h2>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="font-medium">SKU</dt>
                        <dd className="text-muted-foreground">{product.sku}</dd>
                    </div>
                    <div>
                        <dt className="font-medium">Category</dt>
                        <dd className="text-muted-foreground">{product.category.name}</dd>
                    </div>
                    {product.metadata && Object.entries(product.metadata).map(([key, value]) => (
                        <div key={key}>
                            <dt className="font-medium">{key}</dt>
                            <dd className="text-muted-foreground">{String(value)}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
} 