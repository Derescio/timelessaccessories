// app/admin/product-types/new/page.tsx
import { Metadata } from "next";
import { ProductTypeForm } from "../components/product-type-form";
import { createProductType } from "@/lib/actions/product-type.actions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Admin | New Product Type",
    description: "Create a new product type",
};

export default function NewProductTypePage() {
    const handleCreate = async (data: { name: string; description?: string }) => {
        "use server";

        const result = await createProductType(data.name, data.description);

        if (result.success) {
            redirect("/admin/product-types");
        } else {
            throw new Error(result.error || "Failed to create product type");
        }
    };

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Create New Product Type</h1>
            <ProductTypeForm onSubmit={handleCreate} />
        </div>
    );
}