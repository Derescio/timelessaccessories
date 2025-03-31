// app/admin/product-types/page.tsx
import { Metadata } from "next";
import { getProductTypes } from "@/lib/actions/product-type.actions";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Admin | Product Types",
    description: "Manage product types",
};

export default async function ProductTypesPage() {
    const productTypesResult = await getProductTypes();
    const productTypes = productTypesResult.success ? productTypesResult.data : [];

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Product Types</h2>
                    <p className="text-muted-foreground">
                        Define different types of products and their attributes
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/product-types/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Product Type
                    </Link>
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Products</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {productTypes?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        No product types found. Create your first product type to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                productTypes?.map((type) => (
                                    <TableRow key={type.id}>
                                        <TableCell className="font-medium">{type.name}</TableCell>
                                        <TableCell>{type.description || "No description"}</TableCell>
                                        <TableCell>{type._count?.products || 0}</TableCell>
                                        <TableCell>{format(new Date(type.createdAt), "MMM d, yyyy")}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button asChild variant="ghost" size="sm">
                                                    <Link href={`/admin/product-types/${type.id}`}>Edit</Link>
                                                </Button>
                                                <Button asChild variant="ghost" size="sm">
                                                    <Link href={`/admin/product-types/${type.id}/attributes`}>Attributes</Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}