import { getProducts } from "@/lib/actions/product.actions";
import { ProductClient } from "./components/client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Products",
    description: "Manage your products",
};

export default async function ProductsPage() {
    const { success, data: products = [], error } = await getProducts();

    return <ProductClient initialProducts={products} success={success} error={error} />;
} 