// app/admin/product-types/components/product-type-form.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ProductType } from "@prisma/client";

// Define schema for product type
const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductTypeFormProps {
    initialData?: Partial<ProductType>;
    onSubmit: (data: FormValues) => Promise<void>;
}

export function ProductTypeForm({ initialData, onSubmit }: ProductTypeFormProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
        },
    });

    const handleSubmit = async (data: FormValues) => {
        try {
            setLoading(true);
            await onSubmit(data);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to save product type";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Jewelry, Clothing, Electronics" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Describe this product type..."
                                    {...field}
                                    value={field.value || ""}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : initialData ? "Update Product Type" : "Create Product Type"}
                </Button>
            </form>
        </Form>
    );
}