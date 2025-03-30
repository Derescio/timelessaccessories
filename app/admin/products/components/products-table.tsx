"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit, Trash2, Plus, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { deleteProduct } from "@/lib/actions/product.actions";

interface Product {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    category: {
        name: string;
    } | null;
    inventories: {
        retailPrice: number;
        quantity: number;
    }[];
}

export function ProductsTable({ products }: { products: Product[] }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        try {
            setIsDeleting(true);
            setDeletingId(id);

            const result = await deleteProduct(id);

            if (result.success) {
                toast.success("Product deleted successfully");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete product");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
            console.error(error);
        } finally {
            setIsDeleting(false);
            setDeletingId(null);
        }
    };

    const getPrice = (product: Product) => {
        const defaultInventory = product.inventories?.[0];
        const price = defaultInventory?.retailPrice ?? 0;
        return typeof price === "number" ? price : Number(price);
    };

    const getStock = (product: Product) => {
        const defaultInventory = product.inventories?.[0];
        return defaultInventory?.quantity ?? 0;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Products</h2>
                <Button onClick={() => router.push("/admin/products/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No products found. Create your first product to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.category?.name || "Uncategorized"}</TableCell>
                                    <TableCell className="text-right">
                                        ${getPrice(product).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">{getStock(product)}</TableCell>
                                    <TableCell>
                                        <Badge variant={product.isActive ? "default" : "secondary"}>
                                            {product.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => router.push(`/products/${product.slug}`)}
                                                title="View product"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => router.push(`/admin/products/${product.id}`)}
                                                title="Edit product"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        title="Delete product"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the
                                                            product &quot;{product.name}&quot; and all associated data.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(product.id)}
                                                            disabled={isDeleting && deletingId === product.id}
                                                            className="bg-destructive hover:bg-destructive/90"
                                                        >
                                                            {isDeleting && deletingId === product.id
                                                                ? "Deleting..."
                                                                : "Delete"}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
} 