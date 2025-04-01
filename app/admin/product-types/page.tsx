// app/admin/product-types/page.tsx
"use client";

import { getProductTypes, deleteProductType } from "@/lib/actions/product-type.actions";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ProductType } from "@prisma/client";

interface ProductTypeWithCount extends ProductType {
    _count: {
        products: number;
    };
}

export default function ProductTypesPage() {
    const [productTypes, setProductTypes] = useState<ProductTypeWithCount[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [productTypeToDelete, setProductTypeToDelete] = useState<ProductTypeWithCount | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    // Fetch product types on component mount
    useEffect(() => {
        const fetchProductTypes = async () => {
            const result = await getProductTypes();
            if (result.success && result.data) {
                setProductTypes(result.data);
            }
        };
        fetchProductTypes();
    }, []);

    const handleDeleteClick = (type: ProductTypeWithCount) => {
        setProductTypeToDelete(type);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!productTypeToDelete) return;

        setIsDeleting(true);
        const result = await deleteProductType(productTypeToDelete.id);
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);

        if (result.success) {
            toast.success("Product type deleted", {
                description: `${productTypeToDelete.name} has been removed`,
            });
            router.refresh();
        } else {
            toast.error("Error", {
                description: result.error || "Failed to delete product type",
            });
        }
    };

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
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(type)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product Type</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {productTypeToDelete?.name}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}