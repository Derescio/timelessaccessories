import { getProducts } from "@/lib/actions/product.actions";
import { ProductClient } from "./components/client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Products",
    description: "Manage your products",
};

export default async function ProductsPage() {
    const { success, data: products = [], error } = await getProducts();

    return <ProductClient initialProducts={products.map(p => ({
        ...p,
        numReviews: p.numReviews ?? 0,
        rating: p.rating ?? 0,
    }))} success={success} error={error} />;
} 