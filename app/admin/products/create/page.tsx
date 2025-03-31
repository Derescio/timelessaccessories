import { UnifiedProductForm } from "@/app/admin/products/components/unified-product-form";

export default function CreateProductPage() {
    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Create Product</h2>
                </div>
                <UnifiedProductForm />
            </div>
        </div>
    );
} 