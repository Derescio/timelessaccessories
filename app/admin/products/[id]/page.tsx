// import { Metadata } from "next";
// import { redirect, notFound } from "next/navigation";
// import { auth } from "@/auth";
import { getProductById } from "@/lib/actions/product.actions";
import { getCategories } from "@/lib/actions/category.actions";
import { ProductForm } from "../components/product-form";
import { InventoryList } from "./components/inventory-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EditProductPageProps {
    params: Promise<{
        id: string;
    }>;
}

// export async function generateMetadata({ params }: EditProductPageProps): Promise<Metadata> {
//     return {
//         title: "Edit Product",
//         description: "Edit product details",
//     };
// }

export default async function EditProductPage({ params }: EditProductPageProps) {
    // Ensure params is awaited before accessing properties
    const { id: productId } = await Promise.resolve(params);

    const { success, data: product, error } = await getProductById(productId);
    const categories = await getCategories();

    if (!success || error || !product) {
        return (
            <div className="p-8 text-center">
                <p className="text-muted-foreground">
                    {error || "Failed to load product. Please try again."}
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Edit Product</h2>
                    <p className="text-muted-foreground">Make changes to your product here</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button asChild variant="outline">
                        <Link href="/admin/products">Back to Products</Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/admin/products/${product.id}/inventory/new`}>Add Inventory</Link>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="details" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="details">Product Details</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ProductForm
                                initialData={product}
                                categories={categories}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="inventory">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inventory Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <InventoryList
                                productId={product.id}
                                inventories={product.inventories}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 