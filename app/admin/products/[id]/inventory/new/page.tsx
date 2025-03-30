import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { InventoryForm } from "@/app/admin/products/components/inventory-form";
import { getProductById } from "@/lib/actions/product.actions";

export const metadata: Metadata = {
    title: "Add Product Inventory",
    description: "Add inventory to an existing product",
};

interface NewInventoryPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function NewInventoryPage({ params }: NewInventoryPageProps) {
    const resolvedParams = await params;
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        redirect("/");
    }

    const productResult = await getProductById(resolvedParams.id);

    if (!productResult.success || !productResult.data) {
        notFound();
    }

    const { data: product } = productResult;

    return (
        <div className="container p-6 mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Add Inventory</h1>
                <p className="text-muted-foreground">
                    for product: <span className="font-medium">{product.name}</span>
                </p>
            </div>
            <InventoryForm productId={product.id} />
        </div>
    );
} 