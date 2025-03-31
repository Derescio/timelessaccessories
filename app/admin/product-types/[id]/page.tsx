// app/admin/product-types/[id]/page.tsx
import { Metadata } from "next";
import { ProductTypeForm } from "../components/product-type-form";
import { getProductTypeById, updateProductType } from "@/lib/actions/product-type.actions";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Admin | Edit Product Type",
    description: "Edit product type details",
};

interface EditProductTypePageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function EditProductTypePage({ params }: EditProductTypePageProps) {
    // Ensure params is awaited before accessing properties
    const { id: productTypeId } = await Promise.resolve(params);

    // Fetch product type
    const result = await getProductTypeById(productTypeId);

    if (!result.success || !result.data) {
        notFound();
    }

    const productType = result.data;

    // Create server action for form submission
    const handleUpdate = async (data: { name: string; description?: string }) => {
        "use server";

        const result = await updateProductType({
            id: productTypeId,
            name: data.name,
            description: data.description || null
        });

        if (result.success) {
            redirect("/admin/product-types");
        } else {
            throw new Error(result.error || "Failed to update product type");
        }
    };

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Edit Product Type</h1>
            <ProductTypeForm initialData={productType} onSubmit={handleUpdate} />
        </div>
    );
}