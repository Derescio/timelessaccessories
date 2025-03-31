'use server';

import { deleteProductTypeAttribute } from "@/lib/actions/product-type.actions";

export async function deleteAttribute(formData: FormData) {
    const attributeId = formData.get('attributeId') as string;
    const productTypeId = formData.get('productTypeId') as string;

    if (!attributeId || !productTypeId) {
        throw new Error("Missing required parameters");
    }

    try {
        const result = await deleteProductTypeAttribute(attributeId, productTypeId);

        if (!result.success) {
            throw new Error(result.error || "Failed to delete attribute");
        }

        // Let any errors propagate to the client
    } catch (error) {
        console.error("Error deleting attribute:", error);
        throw error;
    }
} 