"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryChild {
    id: string;
    name: string;
    slug: string;
}

interface Category {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    userId: string | null;
    _count?: {
        products: number;
    };
    parent?: CategoryChild | null;
    children?: CategoryChild[];
}

// interface CategoryNodeProps {
//     category: Category;
//     onMove: (categoryId: string, direction: "up" | "down") => void;
//     isFirst: boolean;
//     isLast: boolean;
// }

interface CategoryHierarchyClientProps {
    initialCategories: Category[];
}

// Function to build a tree structure from flat list of categories
function buildCategoryTree(categories: Category[]) {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // First pass - create category objects
    categories.forEach(category => {
        categoryMap.set(category.id, {
            ...category,
            children: []
        });
    });

    // Second pass - build hierarchy
    categories.forEach(category => {
        const categoryWithChildren = categoryMap.get(category.id)!;

        if (category.parentId) {
            const parent = categoryMap.get(category.parentId);
            if (parent) {
                parent.children = parent.children || [];
                parent.children.push({
                    id: categoryWithChildren.id,
                    name: categoryWithChildren.name,
                    slug: categoryWithChildren.slug
                });
            } else {
                rootCategories.push(categoryWithChildren);
            }
        } else {
            rootCategories.push(categoryWithChildren);
        }
    });

    // Sort categories by name
    const sortCategories = (cats: Category[]) => {
        cats.sort((a, b) => a.name.localeCompare(b.name));
        cats.forEach(cat => {
            if (cat.children && cat.children.length > 0) {
                cat.children.sort((a, b) => a.name.localeCompare(b.name));
            }
        });
    };

    sortCategories(rootCategories);
    return rootCategories;
}

// Recursive component to render the category tree
function CategoryTreeItem({ category, level = 0 }: { category: Category | CategoryChild; level?: number }) {
    const isFullCategory = 'description' in category;
    const hasChildren = 'children' in category && category.children && category.children.length > 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
                {isFullCategory && category.imageUrl && (
                    <Image
                        src={category.imageUrl}
                        alt={category.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                    />
                )}
                <span className="font-medium">{category.name}</span>
                {isFullCategory && category._count?.products !== undefined && (
                    <div className="text-muted-foreground text-sm ml-2">
                        ({category._count.products || 0} products)
                    </div>
                )}
            </div>
            {hasChildren && (
                <div className="space-y-2">
                    {category.children!.map((child) => (
                        <CategoryTreeItem key={child.id} category={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function CategoryHierarchy({ initialCategories }: { initialCategories: Category[] }) {
    const [categories, setCategories] = useState<Category[]>(buildCategoryTree(initialCategories));

    const moveCategory = (categoryId: string, direction: 'up' | 'down') => {
        setCategories(prevCategories => {
            const flatCategories = flattenCategories(prevCategories);
            const categoryIndex = flatCategories.findIndex(cat => cat.id === categoryId);

            if (categoryIndex === -1) return prevCategories;

            const newIndex = direction === 'up' ? categoryIndex - 1 : categoryIndex + 1;
            if (newIndex < 0 || newIndex >= flatCategories.length) return prevCategories;

            const newFlatCategories = [...flatCategories];
            [newFlatCategories[categoryIndex], newFlatCategories[newIndex]] =
                [newFlatCategories[newIndex], newFlatCategories[categoryIndex]];

            return rebuildHierarchy(newFlatCategories);
        });
    };

    const flattenCategories = (cats: Category[]): Category[] => {
        return cats.reduce((acc: Category[], cat) => {
            acc.push(cat);
            if (cat.children && cat.children.length > 0) {
                acc.push(...flattenCategories(cat.children.map(child => ({
                    ...cat,
                    id: child.id,
                    name: child.name,
                    slug: child.slug,
                    children: []
                }))));
            }
            return acc;
        }, []);
    };

    const rebuildHierarchy = (flatCategories: Category[]): Category[] => {
        const categoryMap = new Map<string, Category>();
        const rootCategories: Category[] = [];

        flatCategories.forEach(category => {
            categoryMap.set(category.id, {
                ...category,
                children: []
            });
        });

        flatCategories.forEach(category => {
            const categoryWithChildren = categoryMap.get(category.id)!;

            if (category.parentId) {
                const parent = categoryMap.get(category.parentId);
                if (parent) {
                    parent.children = parent.children || [];
                    parent.children.push({
                        id: categoryWithChildren.id,
                        name: categoryWithChildren.name,
                        slug: categoryWithChildren.slug
                    });
                } else {
                    rootCategories.push(categoryWithChildren);
                }
            } else {
                rootCategories.push(categoryWithChildren);
            }
        });

        return rootCategories;
    };

    return (
        <div className="space-y-4">
            {categories.map((category) => (
                <div key={category.id} className="relative">
                    <CategoryTreeItem category={category} />
                    <div className="absolute right-0 top-0 flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveCategory(category.id, 'up')}
                        >
                            Move Up
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveCategory(category.id, 'down')}
                        >
                            Move Down
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function CategoryHierarchyClient({ initialCategories }: CategoryHierarchyClientProps) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Category Hierarchy</h2>
                <Button asChild>
                    <Link href="/admin/categories/new">Add Category</Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Categories</CardTitle>
                </CardHeader>
                <CardContent>
                    <CategoryHierarchy initialCategories={initialCategories} />
                </CardContent>
            </Card>
        </div>
    );
} 