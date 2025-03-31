"use client";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { UnifiedProductForm } from "../components/unified-product-form";


export default function NewProductPage() {


    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <Heading title="Create New Product" description="Add a new product to your store" />
            </div>
            <Separator />
            <UnifiedProductForm />
        </div>
    );
} 