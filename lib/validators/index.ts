import { z } from "zod";

export const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    slug: z.string().min(1, "Slug is required"),
    categoryId: z.string().min(1, "Category is required"),
    isActive: z.boolean().default(true),
    metadata: z.record(z.any()).optional(),
    isFeatured: z.boolean().optional(),
    productTypeId: z.string().nullable().optional(),
}); 