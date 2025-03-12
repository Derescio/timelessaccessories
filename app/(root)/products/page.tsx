"use client";

import { Suspense } from "react";
import { getLatestNeProducts } from "@/lib/actions/product.actions";
import { ProductCard } from "@/components/cards/ProductCardNew";
import { Product } from "@/types";
import { Prisma } from "@prisma/client";
import ProductsFilter from "@/components/cards/Products-Filter";
import { useCallback, useEffect, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useSearchParams } from "next/navigation";

const DEFAULT_PER_PAGE = 12;

function ProductsPageContent() {
    const searchParams = useSearchParams();
    const categoryId = searchParams.get('category');

    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("name_asc");

    const fetchProducts = useCallback(async () => {
        const rawProducts = await getLatestNeProducts();
        const transformedProducts = rawProducts.map((rawProduct) => ({
            id: rawProduct.id,
            name: rawProduct.name,
            description: rawProduct.description,
            price: rawProduct.inventories[0]?.hasDiscount && rawProduct.inventories[0]?.discountPercentage
                ? new Prisma.Decimal(Number(rawProduct.inventories[0].retailPrice) * (1 - rawProduct.inventories[0].discountPercentage / 100))
                : rawProduct.inventories[0]?.retailPrice || new Prisma.Decimal(0),
            inventory: rawProduct.inventories[0]?.quantity || 0,
            discountPercentage: rawProduct.inventories[0]?.discountPercentage,
            category: {
                ...rawProduct.category,
                description: rawProduct.category.description || undefined,
                imageUrl: rawProduct.category.imageUrl || undefined,
                parentId: rawProduct.category.parentId || undefined
            },
            inventories: rawProduct.inventories,
            reviews: rawProduct.reviews,
            compareAtPrice: rawProduct.inventories[0]?.compareAtPrice || new Prisma.Decimal(0),
            categoryId: rawProduct.categoryId,
            isActive: rawProduct.isActive,
            isFeatured: Boolean(rawProduct.metadata) || null,
            sku: rawProduct.inventories[0]?.sku || "",
            createdAt: rawProduct.createdAt,
            updatedAt: rawProduct.updatedAt,
            hasDiscount: rawProduct.inventories[0]?.hasDiscount || false,
            slug: rawProduct.slug,
            mainImage: rawProduct.inventories[0]?.images[0] || "/images/placeholder.svg",
            images: (rawProduct.inventories[0]?.images || []).map((url, index) => ({
                id: `${rawProduct.id}-image-${index}`,
                url,
                alt: null,
                position: index
            })),
        }));
        setProducts(transformedProducts);
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
                    {categoryId ? `${currentProducts[0]?.category.name || 'Category'} Products` : 'All Products'}
                </h1>
                <ProductsFilter
                    onSearch={handleSearch}
                    onPerPageChange={handlePerPageChange}
                    onSortChange={handleSortChange}
                />
            </div>

            {currentProducts.length > 0 ? (
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



























// import { prisma } from "@/lib/prisma";
// import { ProductCard } from "@/components/cards/ProductCard";
// import { Pagination } from "@/components/ui/pagination";
// import { Button } from "@/components/ui/button";
// import { Prisma } from "@prisma/client";
// import type { ProductCardProduct } from "@/types";
// import { ProductsFilter } from "@/components/products/products-filter";
// import Link from "next/link";

// const DEFAULT_PER_PAGE = 12;

// interface ProductsPageProps {
//     searchParams: Record<string, string | string[] | undefined>;
// }

//  default async function ProductsPage({
//     searchParams = {},
// }: ProductsPageProps) {
//     // Ensure searchParams is awaited
//     const getValidatedParams = async () => {
//         return {
//             page: Number(Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page ?? "1"),
//             search: Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search ?? "",
//             category: Array.isArray(searchParams.category)
//                 ? searchParams.category[0] === "all" ? "" : searchParams.category[0]
//                 : searchParams.category === "all" ? "" : searchParams.category ?? "",
//             minPrice: Array.isArray(searchParams.minPrice)
//                 ? parseFloat(searchParams.minPrice[0])
//                 : searchParams.minPrice ? parseFloat(searchParams.minPrice) : 0,
//             maxPrice: Array.isArray(searchParams.maxPrice)
//                 ? parseFloat(searchParams.maxPrice[0])
//                 : searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : Number.MAX_SAFE_INTEGER,
//             sort: Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort ?? "createdAt.desc",
//             perPage: Number(Array.isArray(searchParams.perPage) ? searchParams.perPage[0] : searchParams.perPage) || DEFAULT_PER_PAGE,
//         };
//     };

//     const validatedParams = await getValidatedParams();
//     console.log(validatedParams)

//     // Fetch categories
//     const categories = await prisma.category.findMany({
//         orderBy: { name: "asc" },
//     });

//     // Build where clause for filtering
//     const where: Prisma.ProductWhereInput = {
//         AND: [
//             validatedParams.search
//                 ? {
//                     OR: [
//                         {
//                             name: {
//                                 contains: validatedParams.search,
//                                 mode: "insensitive",
//                             },
//                         },
//                         {
//                             description: {
//                                 contains: validatedParams.search,
//                                 mode: "insensitive",
//                             },
//                         },
//                     ],
//                 }
//                 : {},
//             validatedParams.category ? { categoryId: validatedParams.category } : {},
//             {
//                 inventories: {
//                     some: {
//                         AND: [
//                             { isDefault: true },
//                             {
//                                 retailPrice: {
//                                     gte: validatedParams.minPrice,
//                                     lte: validatedParams.maxPrice,
//                                 },
//                             },
//                         ],
//                     },
//                 },
//             },
//             { isActive: true },
//         ],
//     };

//     // Get total count for pagination
//     const totalItems = await prisma.product.count({ where });
//     const totalPages = Math.ceil(totalItems / validatedParams.perPage);

//     // Determine sort order
//     const [sortField, sortOrder] = validatedParams.sort.split(".");

//     // Fetch products with pagination
//     let products = await prisma.product.findMany({
//         where,
//         orderBy: sortField === "retailPrice"
//             ? { id: "asc" }  // Default order when sorting by price
//             : { [sortField]: sortOrder as Prisma.SortOrder },
//         skip: sortField === "retailPrice" ? 0 : (validatedParams.page - 1) * validatedParams.perPage,
//         take: sortField === "retailPrice" ? undefined : validatedParams.perPage,
//         include: {
//             category: true,
//             inventories: {
//                 where: { isDefault: true },
//                 select: {
//                     retailPrice: true,
//                     compareAtPrice: true,
//                     discountPercentage: true,
//                     hasDiscount: true,
//                     images: true,
//                 },
//             },
//             reviews: {
//                 select: {
//                     rating: true,
//                 },
//             },
//         },
//     });

//     // Handle price sorting in memory if needed
//     if (sortField === "retailPrice") {
//         products = products.sort((a, b) => {
//             const priceA = Number(a.inventories[0]?.retailPrice || 0);
//             const priceB = Number(b.inventories[0]?.retailPrice || 0);
//             return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
//         });

//         // Apply pagination after sorting
//         const start = (validatedParams.page - 1) * validatedParams.perPage;
//         products = products.slice(start, start + validatedParams.perPage);
//     }

//     // Transform products to match ProductCardProduct type
//     const serializedProducts: ProductCardProduct[] = products.map((product) => {
//         const defaultInventory = product.inventories[0];
//         const ratings = product.reviews.map(r => r.rating);
//         const averageRating = ratings.length > 0
//             ? ratings.reduce((a, b) => a + b, 0) / ratings.length
//             : null;

//         return {
//             id: product.id,
//             name: product.name,
//             price: Number(defaultInventory.retailPrice),
//             compareAtPrice: defaultInventory.compareAtPrice ? Number(defaultInventory.compareAtPrice) : null,
//             discountPercentage: defaultInventory.discountPercentage || null,
//             hasDiscount: defaultInventory.hasDiscount,
//             slug: product.slug,
//             mainImage: defaultInventory.images[0] || `/images/placeholder.svg`,
//             images: defaultInventory.images.map((url: string) => ({ url })),
//             category: {
//                 name: product.category.name,
//                 slug: product.category.slug,
//             },
//             averageRating,
//             reviewCount: ratings.length,
//         };
//     });

//     return (
//         <div className="container py-8">
//             <div className="mb-8 flex flex-col gap-4">
//                 <h1 className="text-3xl font-bold">Products</h1>
//                 <ProductsFilter
//                     categories={categories}
//                     defaultValues={validatedParams}
//                 />
//             </div>

//             {serializedProducts.length > 0 ? (
//                 <>
//                     <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//                         {serializedProducts.map((product) => (
//                             <ProductCard key={product.id} product={product} />
//                         ))}
//                     </div>
//                     {totalPages > 1 && (
//                         <div className="mt-8 flex flex-col items-center gap-4">
//                             <Pagination
//                                 currentPage={validatedParams.page}
//                                 totalPages={totalPages}
//                                 baseUrl="/products"
//                                 searchParams={searchParams}
//                             />
//                             <Button variant="outline" asChild>
//                                 <Link href="/products">View All Products</Link>
//                             </Button>
//                         </div>
//                     )}
//                 </>
//             ) : (
//                 <div className="text-center">
//                     <p className="text-lg text-muted-foreground">No products found.</p>
//                 </div>
//             )}
//         </div>
//     );
// }
