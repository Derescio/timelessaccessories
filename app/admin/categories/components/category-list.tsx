"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDateTime } from "@/lib/utils";
import { deleteCategory } from "@/lib/actions/category.actions";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { Edit, FolderTree, MoreHorizontal, Trash2 } from "lucide-react";

// Define the minimal parent/child category structure that we get from the database
interface CategoryParent {
    id: string;
    name: string;
    slug: string;
}

interface CategoryChild {
    id: string;
    name: string;
    slug: string;
}

// This interface represents the exact shape of data returned from the database
interface CategoryWithCount {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    parentId: string | null;
    slug: string;
    parent: CategoryParent | null;
    children: CategoryChild[];
    _count?: {
        products: number;
    };
}

interface CategoryWithLevel extends CategoryWithCount {
    level: number;
}

interface CategoryListProps {
    categories: CategoryWithCount[];
}

// Helper function to organize categories into a hierarchical structure
const organizeCategories = (categories: CategoryWithCount[]) => {
    // First, create a map of parentId to children
    const categoryMap = new Map<string | null, CategoryWithCount[]>();

    // Initialize with null (top-level categories)
    categoryMap.set(null, []);

    // Group categories by parentId
    categories.forEach(category => {
        if (!categoryMap.has(category.parentId)) {
            categoryMap.set(category.parentId, []);
        }
        categoryMap.get(category.parentId)?.push(category);
    });

    // Sort categories within each group
    categoryMap.forEach(cats => {
        cats.sort((a, b) => a.name.localeCompare(b.name));
    });

    // Function to recursively build the flat list with proper order
    const buildOrderedList = (parentId: string | null, level: number, result: CategoryWithLevel[]): CategoryWithLevel[] => {
        const children = categoryMap.get(parentId) || [];

        children.forEach(category => {
            // Add level information to the category for indentation
            result.push({ ...category, level });
            // Process children
            buildOrderedList(category.id, level + 1, result);
        });

        return result;
    };

    // Build the final list starting with top-level categories (null parentId)
    return buildOrderedList(null, 0, []);
};

export function CategoryList({ categories }: CategoryListProps) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithCount | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDeleteClick = (category: CategoryWithCount) => {
        setCategoryToDelete(category);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!categoryToDelete) return;

        setIsDeleting(true);
        const result = await deleteCategory(categoryToDelete.id);
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);

        if (result.success) {
            toast.success("Category deleted", {
                description: `${categoryToDelete.name} has been removed`,
            });
            router.refresh();
        } else {
            toast.error("Error", {
                description: result.error || "Failed to delete category",
            });
        }
    };

    const hierarchicalCategories = organizeCategories(categories);

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Parent</TableHead>
                            <TableHead>Products</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {hierarchicalCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No categories found
                                </TableCell>
                            </TableRow>
                        ) : (
                            hierarchicalCategories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell>
                                        <div className="relative h-10 w-10 rounded-md overflow-hidden">
                                            <Image
                                                src={category.imageUrl || "/placeholder.svg"}
                                                alt={category.name}
                                                fill
                                                className="object-cover"
                                                sizes="40px"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div style={{ paddingLeft: `${category.level * 1.5}rem` }} className="flex items-center">
                                            {category.level > 0 && (
                                                <span className="text-muted-foreground mr-2">└─</span>
                                            )}
                                            <span className="font-medium">{category.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{category.slug}</TableCell>
                                    <TableCell>
                                        {category.parent ? (
                                            <Badge variant="outline" className="gap-1 flex-inline items-center">
                                                <FolderTree className="h-3 w-3" />
                                                {category.parent.name}
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">Root</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {category._count?.products ? (
                                            <Badge>{category._count.products}</Badge>
                                        ) : (
                                            <Badge variant="outline">0</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {formatDateTime(category.createdAt).dateOnly}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Actions</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/categories/${category.id}`}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => handleDeleteClick(category)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you sure you want to delete this category?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {categoryToDelete?._count?.products ? (
                                <span className="text-destructive font-semibold">
                                    Warning: This category has {categoryToDelete._count.products} product(s). You need to
                                    reassign or delete these products first.
                                </span>
                            ) : categoryToDelete?.children?.length ? (
                                <span className="text-destructive font-semibold">
                                    Warning: This category has {categoryToDelete.children.length} subcategory(ies). You need to
                                    reassign or delete these subcategories first.
                                </span>
                            ) : (
                                "This action cannot be undone."
                            )}
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
        </>
    );
} 