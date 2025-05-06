// app/admin/product-types/components/product-type-form.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
    onSubmit: (data: FormValues) => Promise<{ success: boolean }>;
}

export function ProductTypeForm({ initialData, onSubmit }: ProductTypeFormProps) {
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const mounted = useRef(false);
    const router = useRouter();

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
        },
    });

    const onSubmitForm = async (data: FormValues) => {
        //console.log("Form submission started", { loading, isSubmitting, data });

        if (loading || isSubmitting || !mounted.current) {
            // console.log("Form submission prevented", { loading, isSubmitting, mounted: mounted.current });
            return;
        }

        try {
            // console.log("Setting submission states");
            setLoading(true);
            setIsSubmitting(true);
            //  console.log("Calling onSubmit with data:", data);
            const result = await onSubmit(data);
            //  console.log("onSubmit completed successfully", result);

            if (result.success) {
                //   console.log("Redirecting to product types list");
                router.push("/admin/product-types");
            }
        } catch (error) {
            console.error("Error in form submission:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to save product type";
            toast.error(errorMessage);
        } finally {
            //  console.log("Resetting submission states");
            setLoading(false);
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    //   console.log("Form submit event triggered");
                    if (!isSubmitting) {
                        form.handleSubmit(onSubmitForm)(e);
                    }
                }}
                className="space-y-4"
            >
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

                <Button type="submit" disabled={loading || isSubmitting}>
                    {loading || isSubmitting ? "Saving..." : initialData ? "Update Product Type" : "Create Product Type"}
                </Button>
            </form>
        </Form>
    );
}