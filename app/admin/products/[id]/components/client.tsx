"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EditProductClientProps {
    product: {
        id: string;
        name: string;
        description: string;
        slug: string;
        category: {
            id: string;
            name: string;
            slug: string;
        };
        inventories: {
            id: string;
            retailPrice: number;
            costPrice: number;
            compareAtPrice: number | null;
            quantity: number;
            sku: string;
            discountPercentage: number | null;
            hasDiscount: boolean;
            isDefault: boolean;
        }[];
    };
}

const EditProductClient = ({ product }: EditProductClientProps) => {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Edit Product</h2>
                    <p className="text-muted-foreground">Make changes to your product here</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button asChild variant="outline">
                        <Link href="/admin/products">Back to Products</Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/admin/products/${product.id}/inventory/new`}>Add Inventory</Link>
                    </Button>
                </div>
            </div>
            {/* Rest of your edit product form */}
        </div>
    );
}

export default EditProductClient; 