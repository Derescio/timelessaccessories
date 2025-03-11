// import { getAllProducts } from "@/lib/actions/product.actions";
// import { ProductCard } from "@/components/ui/product-card";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";

// interface ProductsPageProps {
//     searchParams: {
//         page?: string;
//     };
// }

// export default async function ProductsPage({
//     searchParams,
// }: ProductsPageProps) {
//     const currentPage = Number(searchParams.page) || 1;
//     const { products, totalPages, currentPage: page } = await getAllProducts(currentPage);

//     return (
//         <div className="container mx-auto px-4 py-16">
//             <h1 className="text-4xl font-extralight text-gray-800 mb-8 text-center">
//                 All Products
//             </h1>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                 {products.map((product) => (
//                     <ProductCard key={product.id} product={product} />
//                 ))}
//             </div>

//             {totalPages > 1 && (
//                 <div className="flex justify-center gap-2 mt-8">
//                     {currentPage > 1 && (
//                         <Button variant="outline" asChild>
//                             <Link href={`/products?page=${currentPage - 1}`}>
//                                 Previous
//                             </Link>
//                         </Button>
//                     )}
//                     {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
//                         <Button
//                             key={pageNum}
//                             variant={pageNum === currentPage ? "default" : "outline"}
//                             asChild
//                         >
//                             <Link href={`/products?page=${pageNum}`}>
//                                 {pageNum}
//                             </Link>
//                         </Button>
//                     ))}
//                     {currentPage < totalPages && (
//                         <Button variant="outline" asChild>
//                             <Link href={`/products?page=${currentPage + 1}`}>
//                                 Next
//                             </Link>
//                         </Button>
//                     )}
//                 </div>
//             )}
//         </div>
//     );
// } 