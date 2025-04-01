// app/admin/product-types/new/page.tsx
import { Metadata } from "next";
import { ProductTypeForm } from "../components/product-type-form";
import { createProductType } from "@/lib/actions/product-type.actions";

export const metadata: Metadata = {
    title: "Admin | New Product Type",
    description: "Create a new product type",
};

export default function NewProductTypePage() {
    async function handleCreate(data: { name: string; description?: string }) {
        "use server";

        console.log("Server action handleCreate called with data:", data);

        const result = await createProductType(data.name, data.description);
        console.log("createProductType result:", result);

        if (result.success) {
            console.log("Product type created successfully");
            return { success: true };
        } else {
            console.error("Failed to create product type:", result.error);
            throw new Error(result.error || "Failed to create product type");
        }
    }

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Create New Product Type</h1>
            <ProductTypeForm onSubmit={handleCreate} />
        </div>
    );
}