// app/admin/products/experimental/new/page.tsx
import { Metadata } from "next";
import { EnhancedProductForm } from "@/app/admin/products/[id]/components/enhanced-product-form";
import { getCategories } from "@/lib/actions/category.actions";
import { getProductTypes } from "@/lib/actions/product-type.actions";
import { createProductWithAttributes } from "@/lib/actions/product.actions";
import { redirect } from "next/navigation";
import { ExtendedProductFormValues } from "@/lib/types/product.types";

export const metadata: Metadata = {
    title: "Admin | New Product (Experimental)",
    description: "Create a new product with enhanced features",
};

export default async function NewExperimentalProductPage() {
    // Fetch categories and product types for dropdown menus
    const [categories, productTypesResult] = await Promise.all([
        getCategories(),
        getProductTypes()
    ]);

    const productTypes = productTypesResult.success ? productTypesResult.data : [];

    // Create server action for form submission
    const handleCreateProduct = async (data: ExtendedProductFormValues) => {
        "use server";

        const result = await createProductWithAttributes(data);

        if (result.success) {
            redirect('/admin/products');
        } else {
            throw new Error(result.error || "Failed to create product");
        }
    };

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Create New Product (Experimental)</h1>
            <p className="text-gray-500 mb-6">
                This page includes experimental features like product types and attributes.
            </p>
            <EnhancedProductForm
                categories={categories}
                productTypes={productTypes || []}
                onSubmit={handleCreateProduct}
                useProductTypes={true}
            />
        </div>
    );
}