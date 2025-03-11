"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { Category } from "@prisma/client";
import debounce from "lodash.debounce";

interface ProductsFilterProps {
    categories: Category[];
    defaultValues: {
        search: string;
        category: string;
        sort: string;
        perPage: number;
    };
}

export function ProductsFilter({ categories, defaultValues }: ProductsFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const createQueryString = useCallback(
        (params: Record<string, string | null>) => {
            const newSearchParams = new URLSearchParams(searchParams?.toString());

            for (const [key, value] of Object.entries(params)) {
                if (value === null) {
                    newSearchParams.delete(key);
                } else {
                    newSearchParams.set(key, value);
                }
            }

            // Reset to page 1 when filters change
            if (newSearchParams.has("page")) {
                newSearchParams.delete("page");
            }

            return newSearchParams.toString();
        },
        [searchParams]
    );

    const updateUrl = useCallback(
        (params: Record<string, string | null>) => {
            startTransition(() => {
                router.push(`/products?${createQueryString(params)}`);
            });
        },
        [router, createQueryString]
    );

    const debouncedUpdateUrl = debounce(updateUrl, 300);

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isPending && <div className="col-span-full">Loading...</div>}
            {/* Search input */}
            <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search products..."
                    defaultValue={defaultValues.search}
                    className="pl-9"
                    onChange={(e) => debouncedUpdateUrl({ search: e.target.value || null })}
                />
            </div>

            {/* Category select */}
            <Select
                defaultValue={defaultValues.category || "all"}
                onValueChange={(value) => updateUrl({ category: value })}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                            {category.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Sort select */}
            <Select
                defaultValue={defaultValues.sort}
                onValueChange={(value) => updateUrl({ sort: value })}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="createdAt.desc">Newest First</SelectItem>
                    <SelectItem value="retailPrice.asc">Price: Low to High</SelectItem>
                    <SelectItem value="retailPrice.desc">Price: High to Low</SelectItem>
                    <SelectItem value="name.asc">Name: A to Z</SelectItem>
                    <SelectItem value="name.desc">Name: Z to A</SelectItem>
                </SelectContent>
            </Select>

            {/* Items per page select */}
            <Select
                defaultValue={defaultValues.perPage.toString()}
                onValueChange={(value) => updateUrl({ perPage: value })}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Items per page" />
                </SelectTrigger>
                <SelectContent>
                    {[5, 10, 15, 20, 25, 50].map((value) => (
                        <SelectItem key={value} value={value.toString()}>
                            {value} items
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
} 