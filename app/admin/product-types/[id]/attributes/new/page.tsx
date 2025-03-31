import { Metadata } from "next";
import { AttributeForm } from "@/app/admin/product-types/components/attribute-form";
import { getProductTypeById, createProductTypeAttribute } from "@/lib/actions/product-type.actions";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AttributeType } from "@prisma/client";

export const metadata: Metadata = {
    title: "Admin | New Attribute",
    description: "Create new attribute for product type",
};

interface NewAttributePageProps {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{ for?: string }>;
}

// Define attribute form values type here instead of importing it
interface AttributeFormValues {
    name: string;
    displayName: string;
    description?: string | null;
    type: string;
    isRequired: boolean;
    options?: string | null;
    isForProduct: boolean;
}

export default async function NewAttributePage({ params, searchParams }: NewAttributePageProps) {
    // Ensure params and searchParams are awaited before accessing properties
    const { id: productTypeId } = await Promise.resolve(params);
    const resolvedSearchParams = await Promise.resolve(searchParams);

    // Default isForProduct based on the URL query parameter
    const isForProduct = resolvedSearchParams.for !== "inventory";
    const attributeType = isForProduct ? "Product" : "Inventory";

    // Fetch product type to make sure it exists
    const result = await getProductTypeById(productTypeId);

    if (!result.success || !result.data) {
        notFound();
    }

    const productType = result.data;

    // Create the onSubmit handler for form submission
    const handleCreateAttribute = async (data: AttributeFormValues) => {
        'use server';

        // Process options if provided
        let options: string[] | undefined;
        if (data.options && (data.type === 'SELECT' || data.type === 'MULTI_SELECT')) {
            options = data.options
                .split('\n')
                .map(option => option.trim())
                .filter(option => option.length > 0);
        }

        // Convert UI type to Prisma AttributeType enum
        // This mapping must match the exact enum values in Prisma schema
        const typeMapping: Record<string, AttributeType> = {
            'TEXT': AttributeType.STRING,
            'NUMBER': AttributeType.NUMBER,
            'BOOLEAN': AttributeType.BOOLEAN,
            'SELECT': AttributeType.ARRAY,
            'MULTI_SELECT': AttributeType.ARRAY,
            'DATE': AttributeType.DATE,
            'COLOR': AttributeType.COLOR,
            'DIMENSION': AttributeType.DIMENSION,
            'WEIGHT': AttributeType.WEIGHT
        };

        try {
            const result = await createProductTypeAttribute({
                productTypeId,
                name: data.name,
                displayName: data.displayName,
                description: data.description || null,
                type: typeMapping[data.type], // Map UI type to Prisma enum value
                isRequired: data.isRequired,
                options,
                isForProduct: data.isForProduct,
            });

            if (result && !result.success) {
                throw new Error(result.error || "Failed to create attribute");
            }

            redirect(`/admin/product-types/${productTypeId}/attributes`);
        } catch (error) {
            console.error("Error creating attribute:", error);
            throw new Error((error as Error).message || "Failed to create attribute");
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/product-types/${productTypeId}/attributes`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Add {attributeType} Attribute
                    </h2>
                    <p className="text-muted-foreground">
                        Create a new {attributeType.toLowerCase()} attribute for {productType.name}
                    </p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto mt-6">
                <AttributeForm
                    onSubmit={handleCreateAttribute}
                    initialData={{ isForProduct }}
                />
            </div>
        </div>
    );
} 