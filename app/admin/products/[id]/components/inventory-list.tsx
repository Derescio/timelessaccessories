"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

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
import { deleteInventory } from "@/lib/actions/inventory.actions";

interface InventoryItem {
    id: string;
    sku: string;
    retailPrice: number;
    costPrice: number;
    compareAtPrice: number | null;
    discountPercentage: number | null;
    hasDiscount: boolean;
    quantity: number;
    lowStock: number;
    isDefault: boolean;
}

interface InventoryListProps {
    productId: string;
    inventories: InventoryItem[];
}

export function InventoryList({ productId, inventories }: InventoryListProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        try {
            setIsDeleting(true);
            setDeletingId(id);

            const result = await deleteInventory(id);

            if (result.success) {
                toast.success("Inventory item deleted successfully");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete inventory item");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
            console.error(error);
        } finally {
            setIsDeleting(false);
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-4">
            {inventories.length === 0 ? (
                <div className="text-center py-8 border rounded-md">
                    <p className="text-muted-foreground">
                        No inventory items found. Add your first inventory to get started.
                    </p>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Stock</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inventories.map((inventory) => (
                                <TableRow key={inventory.id}>
                                    <TableCell className="font-medium flex items-center">
                                        {inventory.sku}
                                        {inventory.isDefault && (
                                            <Badge variant="outline" className="ml-2">
                                                <Check className="h-3 w-3 mr-1" /> Default
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        ${inventory.costPrice.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        ${inventory.retailPrice.toFixed(2)}
                                        {inventory.hasDiscount && inventory.compareAtPrice && (
                                            <div className="text-xs text-muted-foreground line-through">
                                                ${inventory.compareAtPrice.toFixed(2)}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={
                                            inventory.quantity <= 0
                                                ? "text-destructive"
                                                : inventory.quantity <= inventory.lowStock
                                                    ? "text-amber-500"
                                                    : ""
                                        }>
                                            {inventory.quantity}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={inventory.quantity > 0 ? "default" : "destructive"}>
                                            {inventory.quantity > 0 ? "In Stock" : "Out of Stock"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => router.push(`/admin/products/${productId}/inventory/${inventory.id}`)}
                                                title="Edit inventory"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            {!inventory.isDefault && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            title="Delete inventory"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the
                                                                inventory item with SKU &quot;{inventory.sku}&quot;.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(inventory.id)}
                                                                disabled={isDeleting && deletingId === inventory.id}
                                                                className="bg-destructive hover:bg-destructive/90"
                                                            >
                                                                {isDeleting && deletingId === inventory.id
                                                                    ? "Deleting..."
                                                                    : "Delete"}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
} 