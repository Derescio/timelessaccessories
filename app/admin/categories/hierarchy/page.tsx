import { getCategories } from "@/lib/actions/category.actions";
import { CategoryHierarchyClient } from "./client";

export default async function CategoryHierarchyPage() {
    const categories = await getCategories();

    return <CategoryHierarchyClient initialCategories={categories} />;
} 