import { getProductTypeAttributeById } from "@/lib/actions/product-type.actions";
import { notFound } from "next/navigation";
import { AttributeForm } from "@/app/admin/product-types/components/attribute-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface EditAttributePageProps {
    params: Promise<{
        id: string;
        attributeId: string;
    }>;
}

export default async function EditAttributePage({ params }: EditAttributePageProps) {
    const { id: productTypeId, attributeId } = await Promise.resolve(params);

    try {
        const result = await getProductTypeAttributeById(attributeId);

        if (!result.success || !result.data) {
            notFound();
        }

        const attribute = result.data;

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
                            Edit Attribute: {attribute.displayName}
                        </h2>
                        <p className="text-muted-foreground">
                            Modify the attribute details below
                        </p>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto mt-6">
                    <AttributeForm
                        productTypeId={productTypeId}
                        attribute={attribute}
                    />
                </div>
            </div>
        );
    } catch (error) {
        console.error("Error loading attribute:", error);
        notFound();
    }
}