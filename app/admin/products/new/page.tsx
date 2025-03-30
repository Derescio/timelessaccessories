import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCategories } from "@/lib/actions/category.actions";
import { ProductForm } from "../components/product-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Add Product",
    description: "Add a new product to your store",
};

export default async function NewProductPage() {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        redirect("/");
    }

    const categories = await getCategories();

    if (!categories || categories.length === 0) {
        // If no categories were found, we might want to redirect to create a category first
        return (
            <div className="container p-6 mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>No Categories Available</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Please create at least one category before adding products.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container p-6 mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Add New Product</CardTitle>
                </CardHeader>
                <CardContent>
                    <ProductForm categories={categories} />
                </CardContent>
            </Card>
        </div>
    );
} 