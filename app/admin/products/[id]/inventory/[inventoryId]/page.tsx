import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { InventoryForm } from "@/app/admin/products/components/inventory-form";
import { getProductById } from "@/lib/actions/product.actions";
import { getInventoryById } from "@/lib/actions/inventory.actions";
import { ProductInventoryFormValues } from "@/lib/types/product.types";

export const metadata: Metadata = {
    title: "Edit Product Inventory",
    description: "Edit inventory for an existing product",
};

interface EditInventoryPageProps {
    params: Promise<{
        id: string;
        inventoryId: string;
    }>;
}

export default async function EditInventoryPage({ params }: EditInventoryPageProps) {
    const session = await auth();
    const resolvedParams = await params;

    if (!session || session.user?.role !== "ADMIN") {
        redirect("/");
    }

    const [productResult, inventoryResult] = await Promise.all([
        getProductById(resolvedParams.id),
        getInventoryById(resolvedParams.inventoryId),
    ]);

    if (!productResult.success || !productResult.data) {
        notFound();
    }

    if (!inventoryResult.success || !inventoryResult.data) {
        notFound();
    }

    const { data: product } = productResult;
    const { data: inventoryData } = inventoryResult;

    // Transform the inventory data to match the expected type
    const inventory: ProductInventoryFormValues = {
        id: inventoryData.id,
        productId: product.id,
        sku: inventoryData.sku || "",
        costPrice: inventoryData.costPrice || 0,
        retailPrice: inventoryData.retailPrice || 0,
        compareAtPrice: inventoryData.compareAtPrice || null,
        discountPercentage: inventoryData.discountPercentage || null,
        hasDiscount: inventoryData.hasDiscount || false,
        quantity: inventoryData.quantity || 0,
        lowStock: inventoryData.lowStock || 5,
        images: inventoryData.images || [],
        attributes: inventoryData.attributes ?
            (typeof inventoryData.attributes === 'object' ? inventoryData.attributes : {}) :
            {},
        isDefault: inventoryData.isDefault || false,
    };

    return (
        <div className="container p-6 mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Edit Inventory</h1>
                <p className="text-muted-foreground">
                    for product: <span className="font-medium">{product.name}</span>
                </p>
            </div>
            <InventoryForm
                productId={product.id}
                inventory={inventory}
            />
        </div>
    );
} 