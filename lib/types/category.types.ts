import { z } from "zod";

export const categorySchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    slug: z.string().min(1, "Slug is required"),
    imageUrl: z.string().optional(),
    isActive: z.boolean().default(true),
    parentId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Category = z.infer<typeof categorySchema>;

export type CategoryFormValues = Omit<Category, "id" | "createdAt" | "updatedAt">; 