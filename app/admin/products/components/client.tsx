"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "../../components/search-input";
import Link from "next/link";
import { ProductsTable } from "./products-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductListItem } from "@/lib/types/product.types";

interface ProductClientProps {
    initialProducts: ProductListItem[];
    success: boolean;
    error?: string;
}

export function ProductClient({ initialProducts, success, error }: ProductClientProps) {
    const [search, setSearch] = useState("");

    // Filter products based on search
    const filteredProducts = useMemo(() => {
        if (!search) return initialProducts;

        const searchLower = search.toLowerCase();
        return initialProducts.filter(product =>
            product.name.toLowerCase().includes(searchLower) ||
            product.category?.name.toLowerCase().includes(searchLower) ||
            product.slug.toLowerCase().includes(searchLower) ||
            product.inventories.some(inv =>
                inv.retailPrice.toString().includes(searchLower) ||
                inv.quantity.toString().includes(searchLower)
            )
        );
    }, [search, initialProducts]);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Products</h2>
                    <p className="text-muted-foreground">Manage your product inventory</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <SearchInput
                        placeholder="Search products by name, category, price, or stock..."
                        value={search}
                        onChange={setSearch}
                    />
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/admin/products/new">Add Product</Link>
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Products Management</CardTitle>
                </CardHeader>
                <CardContent>
                    {!success || error ? (
                        <div className="p-8 text-center">
                            <p className="text-muted-foreground">
                                {error || "Failed to load products. Please try again."}
                            </p>
                        </div>
                    ) : (
                        <ProductsTable products={filteredProducts} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 