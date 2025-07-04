import { Metadata } from "next";
import { AttributeForm } from "@/app/admin/product-types/components/attribute-form";
import { getProductTypeById } from "@/lib/actions/product-type.actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Admin | New Attribute",
    description: "Create new attribute for product type",
};

interface NewAttributePageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function NewAttributePage({ params }: NewAttributePageProps) {
    // Ensure params is awaited before accessing properties
    const { id: productTypeId } = await Promise.resolve(params);

    // Fetch product type to make sure it exists
    const result = await getProductTypeById(productTypeId);

    if (!result.success || !result.data) {
        notFound();
    }

    const productType = result.data;

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
                        Create New Attribute
                    </h2>
                    <p className="text-muted-foreground">
                        Define a new attribute for {productType.name}
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto mt-6">
                <AttributeForm productTypeId={productTypeId} />
            </div>
        </div>
    );
} 