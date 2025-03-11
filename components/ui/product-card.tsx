import { Product } from "@/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const displayPrice = product.inventories[0]?.hasDiscount
        ? Number(product.price) * (1 - (product.discountPercentage || 0) / 100)
        : Number(product.price);

    return (
        <Link href={`/products/${product.slug}`}>
            <Card className="group overflow-hidden">
                <CardContent className="p-0">
                    <div className="aspect-square relative overflow-hidden">
                        <Image
                            src={product.images[0]?.url || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        {product.inventories[0]?.hasDiscount && (
                            <Badge className="absolute top-2 right-2 bg-red-500">
                                {product.discountPercentage}% OFF
                            </Badge>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start p-4">
                    <p className="text-sm text-muted-foreground mb-1">
                        {product.category.name}
                    </p>
                    <h3 className="font-medium mb-2 group-hover:text-primary transition-colors">
                        {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">
                            ${displayPrice.toFixed(2)}
                        </span>
                        {product.inventories[0]?.hasDiscount && (
                            <span className="text-sm text-muted-foreground line-through">
                                ${Number(product.price).toFixed(2)}
                            </span>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
} 