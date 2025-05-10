"use client";

import { Suspense } from "react";
import { getProducts } from "@/lib/actions/product.actions";
import { ProductCard } from "@/components/cards/ProductCardNew";
import ProductsFilter from "@/components/cards/Products-Filter";
import { useCallback, useEffect, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { type ClientProduct } from "@/lib/types/product.types";

const DEFAULT_PER_PAGE = 5;

function ProductSkeleton() {
    return (
        <div className="flex flex-col space-y-3">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-8 w-24 rounded-full" />
            </div>
        </div>
    );
}

function ProductsPageContent() {
    const searchParams = useSearchParams();
    const categoryId = searchParams.get('category');

    const [products, setProducts] = useState<ClientProduct[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ClientProduct[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("name_asc");
    const [isLoading, setIsLoading] = useState(true);

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const rawProducts = await getProducts();
            // console.log(rawProducts);

            const transformedProducts = rawProducts.data?.map((rawProduct) => {
                const firstInventory = rawProduct.inventories?.[0] || {};
                const hasDiscount = firstInventory.hasDiscount && firstInventory.discountPercentage && firstInventory.compareAtPrice;
                const price = hasDiscount
                    ? Number(firstInventory.compareAtPrice) * (1 - (firstInventory.discountPercentage || 0) / 100)
                    : Number(firstInventory.retailPrice) || 0;

                return {
                    id: rawProduct.id,
                    name: rawProduct.name,
                    description: rawProduct.description,
                    price,
                    categoryId: rawProduct.categoryId,
                    inventory: firstInventory.quantity || 0,
                    createdAt: rawProduct.createdAt,
                    updatedAt: rawProduct.updatedAt,
                    numReviews: rawProduct.numReviews || 0,
                    rating: rawProduct.rating || 0,
                    compareAtPrice: firstInventory.compareAtPrice ? Number(firstInventory.compareAtPrice) : null,
                    discountPercentage: firstInventory.discountPercentage,
                    hasDiscount: firstInventory.hasDiscount || false,
                    isActive: rawProduct.isActive,
                    isFeatured: Boolean(rawProduct.metadata) || null,
                    metadata: rawProduct.metadata,
                    sku: firstInventory.sku || "",
                    slug: rawProduct.slug,
                    category: {
                        id: rawProduct.category.id,
                        name: rawProduct.category.name,
                        slug: rawProduct.category.slug,
                        description: rawProduct.category.description,
                        imageUrl: rawProduct.category.imageUrl,
                        parentId: rawProduct.category.parentId,
                    },
                    images: (rawProduct.inventories || []).flatMap((inv) =>
                        (inv?.images || []).map((url: string, index: number) => ({
                            id: `${inv.id}-image-${index}`,
                            url: url.startsWith('http') ? url : `/uploads/${url}`,
                            alt: `${rawProduct.name} - Image ${index + 1}`,
                            position: index,
                        }))
                    ),
                    mainImage: firstInventory.images?.[0] || "/images/placeholder.svg",
                    inventories: (rawProduct.inventories || []).map((inv) => ({
                        id: inv.id,
                        productId: rawProduct.id,
                        retailPrice: Number(inv.retailPrice),
                        costPrice: Number(inv.costPrice),
                        compareAtPrice: inv.compareAtPrice ? Number(inv.compareAtPrice) : null,
                        discountPercentage: inv.discountPercentage,
                        hasDiscount: inv.hasDiscount || false,
                        images: inv.images || [],
                        quantity: inv.quantity || 0,
                        sku: inv.sku || "",
                        lowStock: 5,
                        isDefault: false,
                        attributes: null
                    })),
                    reviews: rawProduct.reviews || [],
                } as ClientProduct;
            });
            setProducts(transformedProducts || []);

        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        let filtered = products;

        // Apply category filter if present
        if (categoryId) {
            filtered = filtered.filter(product => product.categoryId === categoryId);
        }

        // Apply search filter
        filtered = filtered.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Apply sorting
        filtered = [...filtered].sort((a, b) => {
            switch (sortOrder) {
                case "name_asc":
                    return a.name.localeCompare(b.name);
                case "name_desc":
                    return b.name.localeCompare(a.name);
                case "price_asc":
                    return Number(a.price) - Number(b.price);
                case "price_desc":
                    return Number(b.price) - Number(a.price);
                default:
                    return 0;
            }
        });

        setFilteredProducts(filtered);
        setCurrentPage(1); // Reset to first page when filtering or sorting
    }, [products, searchQuery, sortOrder, categoryId]);

    const handleSearch = useCallback((value: string) => {
        setSearchQuery(value);
    }, []);

    const handlePerPageChange = useCallback((value: number) => {
        setPerPage(value);
        setCurrentPage(1); // Reset to first page when changing items per page
    }, []);

    const handleSortChange = useCallback((value: string) => {
        setSortOrder(value);
    }, []);

    // Pagination calculations
    const totalPages = Math.ceil(filteredProducts.length / perPage);
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    return (
        <main className="flex flex-col gap-6 max-w-6xl mx-auto px-4 py-10">
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold">
                    {categoryId && currentProducts.length > 0
                        ? `${currentProducts[0]?.category.name || 'Category'} Products`
                        : 'All Products'
                    }
                </h1>
                <ProductsFilter
                    onSearch={handleSearch}
                    onPerPageChange={handlePerPageChange}
                    onSortChange={handleSortChange}
                />
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: DEFAULT_PER_PAGE }).map((_, index) => (
                        <ProductSkeleton key={index} />
                    ))}
                </div>
            ) : currentProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {currentProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No products found</p>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </main>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProductsPageContent />
        </Suspense>
    );
}
