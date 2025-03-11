import { Metadata } from "next";
import { getLatestNeProducts } from "@/lib/actions/product.actions";
import { ProductCard } from "@/components/cards/ProductCardNew";
import { Product } from "@/types";
import { Prisma } from "@prisma/client";

export const metadata: Metadata = {
    title: 'Products Page',
    description: 'Products Page',
};

const ProductsPage = async () => {
    const rawProducts = await getLatestNeProducts();
    //console.log('Raw Products:', rawProducts);

    const products: Product[] = rawProducts.map((rawProduct) => ({
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
        compareAtPrice: rawProduct.inventories[0]?.retailPrice || null,
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

    return (
        <main className="flex flex-col gap-10 max-w-6xl mx-auto px-4 py-10 justify-center">
            <h1>Products Page</h1>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </main>
    );
};

export default ProductsPage;




























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
