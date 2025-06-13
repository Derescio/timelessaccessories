"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createPromotion } from "@/lib/actions/promotions-actions";
import { PromotionType } from "@prisma/client";

// Types
interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
}

export default function NewPromotionPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Categories and Products for targeting
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        promotionType: "PERCENTAGE_DISCOUNT",
        value: "",
        minimumOrderValue: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        isActive: false,
        couponCode: "",
        usageLimit: "",
        perUserLimit: "",
        freeItemId: "",
        applyToAllItems: true,
        selectedCategories: [] as string[],
        selectedProducts: [] as string[],
        requiresAuthentication: false
    });

    // Load categories and products for targeting
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Load categories
                const categoriesRes = await fetch('/api/categories');
                if (categoriesRes.ok) {
                    const categoriesData = await categoriesRes.json();
                    setCategories(categoriesData.categories || []);
                }

                // Load products
                const productsRes = await fetch('/api/products');
                if (productsRes.ok) {
                    const productsData = await productsRes.json();
                    setProducts(productsData.products || []);
                }
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Failed to load categories and products');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const handleInputChange = (field: string, value: string | boolean | string[]) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCategoryToggle = (categoryId: string, checked: boolean) => {
        const updatedCategories = checked
            ? [...formData.selectedCategories, categoryId]
            : formData.selectedCategories.filter(id => id !== categoryId);

        handleInputChange('selectedCategories', updatedCategories);
    };

    const handleProductToggle = (productId: string, checked: boolean) => {
        const updatedProducts = checked
            ? [...formData.selectedProducts, productId]
            : formData.selectedProducts.filter(id => id !== productId);

        handleInputChange('selectedProducts', updatedProducts);
    };

    const validateForm = (): string | null => {
        if (!formData.name.trim()) return "Promotion name is required";
        if (!formData.promotionType) return "Promotion type is required";
        if (!formData.value || parseFloat(formData.value) <= 0) return "Valid promotion value is required";
        if (!formData.startDate) return "Start date is required";
        if (!formData.endDate) return "End date is required";

        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
            return "End date must be after start date";
        }

        if (formData.promotionType === "PERCENTAGE_DISCOUNT" && parseFloat(formData.value) > 100) {
            return "Percentage discount cannot exceed 100%";
        }

        if (formData.promotionType === "FREE_ITEM" && !formData.freeItemId) {
            return "Please select a free item";
        }

        if (!formData.applyToAllItems && formData.selectedCategories.length === 0 && formData.selectedProducts.length === 0) {
            return "Please select at least one category or product when not applying to all items";
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            toast.error(validationError);
            return;
        }

        setIsSubmitting(true);

        try {
            const promotionData = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                promotionType: formData.promotionType as PromotionType,
                value: parseFloat(formData.value),
                minimumOrderValue: formData.minimumOrderValue ? parseFloat(formData.minimumOrderValue) : null,
                startDate: formData.startDate,
                endDate: formData.endDate,
                isActive: formData.isActive,
                couponCode: formData.couponCode.trim() || null,
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
                perUserLimit: formData.perUserLimit ? parseInt(formData.perUserLimit) : null,
                freeItemId: formData.freeItemId || null,
                applyToAllItems: formData.applyToAllItems,
                categoryIds: formData.applyToAllItems ? undefined : formData.selectedCategories,
                productIds: formData.applyToAllItems ? undefined : formData.selectedProducts,
                requiresAuthentication: formData.requiresAuthentication
            };

            const result = await createPromotion(promotionData);

            if (result.success) {
                toast.success("Promotion created successfully!");
                router.push("/admin/promotions");
            } else {
                toast.error(result.error || "Failed to create promotion");
            }
        } catch (error) {
            console.error("Error creating promotion:", error);
            toast.error("An error occurred while creating the promotion");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/promotions">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Promotions
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create New Promotion</h1>
                    <p className="text-muted-foreground">
                        Set up a new discount, coupon, or special offer
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Promotion Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                <TabsTrigger value="rules">Rules & Conditions</TabsTrigger>
                                <TabsTrigger value="targeting">Product Targeting</TabsTrigger>
                            </TabsList>

                            {/* Basic Info Tab */}
                            <TabsContent value="basic" className="space-y-6 mt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Promotion Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder="Summer Sale 2024"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="couponCode">Coupon Code</Label>
                                        <Input
                                            id="couponCode"
                                            value={formData.couponCode}
                                            onChange={(e) => handleInputChange('couponCode', e.target.value.toUpperCase())}
                                            placeholder="SUMMER20"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Leave blank for automatic discounts
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        placeholder="Special summer discount for all customers..."
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Start Date *</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">End Date *</Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => handleInputChange('endDate', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isActive"
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                                    />
                                    <Label htmlFor="isActive">Activate promotion immediately</Label>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="usageLimit">Usage Limit</Label>
                                    <Input
                                        id="usageLimit"
                                        type="number"
                                        value={formData.usageLimit}
                                        onChange={(e) => handleInputChange('usageLimit', e.target.value)}
                                        placeholder="Leave blank for unlimited"
                                        min="1"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Maximum number of times this promotion can be used
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="perUserLimit">Per-User Limit</Label>
                                    <Input
                                        id="perUserLimit"
                                        type="number"
                                        value={formData.perUserLimit}
                                        onChange={(e) => handleInputChange('perUserLimit', e.target.value)}
                                        placeholder="Leave blank for unlimited"
                                        min="1"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Maximum number of times each user/email can use this promotion (leave blank for unlimited)
                                    </p>
                                </div>
                            </TabsContent>

                            {/* Rules & Conditions Tab */}
                            <TabsContent value="rules" className="space-y-6 mt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="promotionType">Promotion Type *</Label>
                                    <Select
                                        value={formData.promotionType}
                                        onValueChange={(value) => handleInputChange('promotionType', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PERCENTAGE_DISCOUNT">Percentage Discount</SelectItem>
                                            <SelectItem value="FIXED_AMOUNT_DISCOUNT">Fixed Amount Discount</SelectItem>
                                            <SelectItem value="FREE_ITEM">Free Item</SelectItem>
                                            <SelectItem value="BUY_ONE_GET_ONE">Buy One Get One Free</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Promotion Value Input */}
                                {formData.promotionType === "PERCENTAGE_DISCOUNT" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="value">Discount Percentage *</Label>
                                        <div className="relative">
                                            <Input
                                                id="value"
                                                type="number"
                                                value={formData.value}
                                                onChange={(e) => handleInputChange('value', e.target.value)}
                                                placeholder="20"
                                                min="1"
                                                max="100"
                                                required
                                            />
                                            <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                                        </div>
                                    </div>
                                )}

                                {formData.promotionType === "FIXED_AMOUNT_DISCOUNT" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="value">Discount Amount *</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">$</span>
                                            <Input
                                                id="value"
                                                type="number"
                                                value={formData.value}
                                                onChange={(e) => handleInputChange('value', e.target.value)}
                                                placeholder="10.00"
                                                min="0.01"
                                                step="0.01"
                                                className="pl-8"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {formData.promotionType === "FREE_ITEM" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="freeItemId">Select Free Item *</Label>
                                        <Select
                                            value={formData.freeItemId}
                                            onValueChange={(value) => handleInputChange('freeItemId', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a product" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {isLoading ? (
                                                    <div className="p-2 text-center">
                                                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                                    </div>
                                                ) : (
                                                    products.map((product) => (
                                                        <SelectItem key={product.id} value={product.id}>
                                                            {product.name} - ${product.price}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="hidden"
                                            value="1"
                                            onChange={(e) => handleInputChange('value', e.target.value)}
                                        />
                                    </div>
                                )}

                                {formData.promotionType === "BUY_ONE_GET_ONE" && (
                                    <div className="space-y-2">
                                        <div className="p-4 bg-muted rounded-lg">
                                            <p className="text-sm">
                                                <strong>Buy One Get One Free:</strong> Customers will get two items for the price of one.
                                                This applies to the cheapest eligible items in their cart.
                                            </p>
                                        </div>
                                        <Input
                                            type="hidden"
                                            value="1"
                                            onChange={(e) => handleInputChange('value', e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="minimumOrderValue">Minimum Order Value</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">$</span>
                                        <Input
                                            id="minimumOrderValue"
                                            type="number"
                                            value={formData.minimumOrderValue}
                                            onChange={(e) => handleInputChange('minimumOrderValue', e.target.value)}
                                            placeholder="0.00"
                                            min="0.01"
                                            step="0.01"
                                            className="pl-8"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Minimum cart subtotal required to apply this promotion
                                    </p>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="requiresAuthentication"
                                        checked={formData.requiresAuthentication}
                                        onCheckedChange={(checked) => handleInputChange('requiresAuthentication', checked)}
                                    />
                                    <div className="space-y-1">
                                        <Label htmlFor="requiresAuthentication">Require User Sign-In</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Only signed-in users can use this promotion code
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Product Targeting Tab */}
                            <TabsContent value="targeting" className="space-y-6 mt-6">
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="applyToAllItems"
                                            checked={formData.applyToAllItems}
                                            onCheckedChange={(checked) => handleInputChange('applyToAllItems', checked)}
                                        />
                                        <Label htmlFor="applyToAllItems">Apply to all products</Label>
                                    </div>

                                    {!formData.applyToAllItems && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Categories */}
                                            <div className="space-y-4">
                                                <Label>Categories</Label>
                                                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                                                    {isLoading ? (
                                                        <div className="flex items-center justify-center py-4">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            <span className="ml-2 text-sm">Loading categories...</span>
                                                        </div>
                                                    ) : categories.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {categories.map((category) => (
                                                                <div key={category.id} className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`category-${category.id}`}
                                                                        checked={formData.selectedCategories.includes(category.id)}
                                                                        onCheckedChange={(checked) => handleCategoryToggle(category.id, Boolean(checked))}
                                                                    />
                                                                    <Label htmlFor={`category-${category.id}`} className="text-sm">
                                                                        {category.name}
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground text-center py-4">
                                                            No categories available
                                                        </p>
                                                    )}
                                                </div>
                                                {formData.selectedCategories.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {formData.selectedCategories.map((categoryId) => {
                                                            const category = categories.find(c => c.id === categoryId);
                                                            return category ? (
                                                                <Badge key={categoryId} variant="secondary">
                                                                    {category.name}
                                                                </Badge>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Products */}
                                            <div className="space-y-4">
                                                <Label>Products</Label>
                                                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                                                    {isLoading ? (
                                                        <div className="flex items-center justify-center py-4">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            <span className="ml-2 text-sm">Loading products...</span>
                                                        </div>
                                                    ) : products.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {products.map((product) => (
                                                                <div key={product.id} className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`product-${product.id}`}
                                                                        checked={formData.selectedProducts.includes(product.id)}
                                                                        onCheckedChange={(checked) => handleProductToggle(product.id, Boolean(checked))}
                                                                    />
                                                                    <Label htmlFor={`product-${product.id}`} className="text-sm">
                                                                        {product.name} - ${product.price}
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground text-center py-4">
                                                            No products available
                                                        </p>
                                                    )}
                                                </div>
                                                {formData.selectedProducts.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {formData.selectedProducts.map((productId) => {
                                                            const product = products.find(p => p.id === productId);
                                                            return product ? (
                                                                <Badge key={productId} variant="secondary">
                                                                    {product.name}
                                                                </Badge>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-4 pt-6 mt-6 border-t">
                            <Link href="/admin/promotions">
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Promotion"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
} 