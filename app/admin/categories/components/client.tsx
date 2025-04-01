"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "../../components/search-input";
import Link from "next/link";
import { Category } from "@prisma/client";
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
import { Trash2 } from "lucide-react";

interface CategoriesClientProps {
    initialCategories: Category[];
}

export default function CategoriesClient({ initialCategories }: CategoriesClientProps) {
    const [search, setSearch] = useState("");
    const [categories] = useState<Category[]>(initialCategories);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    // Filter categories based on search
    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleDeleteClick = (category: Category) => {
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

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
                    <p className="text-muted-foreground">
                        Manage your product categories
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Search categories..."
                    />
                    <Button asChild>
                        <Link href="/admin/categories/new">Add Category</Link>
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {filteredCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h3 className="font-medium">{category.name}</h3>
                            {category.description && (
                                <p className="text-sm text-muted-foreground">{category.description}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button asChild variant="ghost" size="sm">
                                <Link href={`/admin/categories/${category.id}`}>Edit</Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(category)}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {categoryToDelete?.name}? This action cannot be undone.
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