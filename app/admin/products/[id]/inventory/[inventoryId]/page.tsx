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

    // Transform the inventory data to match the expected type and ensure numeric values are JavaScript numbers
    const inventory: ProductInventoryFormValues = {
        id: inventoryData.id,
        productId: product.id,
        sku: inventoryData.sku || "",
        costPrice: typeof inventoryData.costPrice === 'object' ? Number(inventoryData.costPrice) : Number(inventoryData.costPrice) || 0,
        retailPrice: typeof inventoryData.retailPrice === 'object' ? Number(inventoryData.retailPrice) : Number(inventoryData.retailPrice) || 0,
        compareAtPrice: inventoryData.compareAtPrice
            ? (typeof inventoryData.compareAtPrice === 'object' ? Number(inventoryData.compareAtPrice) : Number(inventoryData.compareAtPrice))
            : null,
        discountPercentage: inventoryData.discountPercentage !== null ? Number(inventoryData.discountPercentage) : null,
        hasDiscount: Boolean(inventoryData.hasDiscount),
        quantity: Number(inventoryData.quantity || 0),
        lowStock: Number(inventoryData.lowStock || 5),
        images: Array.isArray(inventoryData.images) ? inventoryData.images : [],
        attributes: typeof inventoryData.attributes === 'object'
            ? JSON.parse(JSON.stringify(inventoryData.attributes))
            : {},
        isDefault: Boolean(inventoryData.isDefault),
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