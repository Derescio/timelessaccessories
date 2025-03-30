"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "../../components/search-input";
import Link from "next/link";
import { Category } from "@prisma/client";

interface CategoriesClientProps {
    initialCategories: Category[];
}

export default function CategoriesClient({ initialCategories }: CategoriesClientProps) {
    const [search, setSearch] = useState("");
    const [categories] = useState<Category[]>(initialCategories);

    // Filter categories based on search
    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(search.toLowerCase())
    );

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

            <div className="grid gap-4">
                {filteredCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h3 className="font-medium">{category.name}</h3>
                            {category.description && (
                                <p className="text-sm text-muted-foreground">{category.description}</p>
                            )}
                        </div>
                        <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/categories/${category.id}`}>Edit</Link>
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
} 