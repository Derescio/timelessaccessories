'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, Plus, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface PrintifyBlueprint {
    id: number;
    title: string;
    description: string;
    brand: string;
    model: string;
    images: string[];
}

export default function PrintifyCatalog() {
    const [blueprints, setBlueprints] = useState<PrintifyBlueprint[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState<string>('all');
    const [importing, setImporting] = useState<number | null>(null);
    const [categories, setCategories] = useState<any[]>([]);

    // Get unique brands
    const brands = Array.from(new Set(blueprints.map(bp => bp.brand))).sort();

    // Filter blueprints
    const filteredBlueprints = blueprints.filter(bp => {
        const matchesSearch = bp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bp.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBrand = selectedBrand === 'all' || bp.brand === selectedBrand;
        return matchesSearch && matchesBrand;
    });

    useEffect(() => {
        fetchCatalog();
        fetchCategories();
    }, []);

    const fetchCatalog = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/printify/catalog');

            if (!response.ok) {
                throw new Error('Failed to fetch catalog');
            }

            const data = await response.json();
            setBlueprints(data.blueprints || []);
        } catch (error) {
            console.error('Error fetching catalog:', error);
            toast.error('Failed to load Printify catalog');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/admin/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            // Don't show error toast for categories as it's not critical
        }
    };

    const handleImportProduct = async (blueprintId: number) => {
        try {
            setImporting(blueprintId);

            // Get the first available category or use a default
            const defaultCategory = categories.length > 0 ? categories[0].id : null;

            if (!defaultCategory) {
                toast.error('No categories available. Please create a category first.');
                return;
            }

            const importData = {
                blueprintId,
                printProviderId: 1, // Default print provider
                categoryId: defaultCategory,
                markup: 150 // 150% markup (50% profit)
            };

            const response = await fetch('/api/admin/printify/import-product', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(importData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Import API Error:', errorData);
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to import product`);
            }

            const result = await response.json();
            toast.success(`Product "${result.product.name}" imported successfully!`);

        } catch (error) {
            console.error('Error importing product:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to import product');
        } finally {
            setImporting(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-40 w-full mb-4" />
                                <Skeleton className="h-8 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by brand" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Brands</SelectItem>
                        {brands.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                                {brand}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Results Count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                Showing {filteredBlueprints.length} of {blueprints.length} products
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBlueprints.map((blueprint) => (
                    <Card key={blueprint.id} className="group hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-sm font-medium line-clamp-2">
                                        {blueprint.title}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {blueprint.brand} • {blueprint.model}
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                    POD
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Product Image */}
                            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                {blueprint.images && blueprint.images.length > 0 ? (
                                    <img
                                        src={blueprint.images[0]}
                                        alt={blueprint.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Package className="h-12 w-12 text-muted-foreground" />
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {blueprint.description}
                            </p>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleImportProduct(blueprint.id)}
                                    disabled={importing === blueprint.id}
                                    className="flex-1"
                                >
                                    {importing === blueprint.id ? (
                                        <>Importing...</>
                                    ) : (
                                        <>
                                            <Plus className="h-3 w-3 mr-1" />
                                            Import
                                        </>
                                    )}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(`https://printify.com/catalog/product/${blueprint.id}`, '_blank')}
                                >
                                    <ExternalLink className="h-3 w-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {filteredBlueprints.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No products found</h3>
                    <p className="text-muted-foreground">
                        Try adjusting your search terms or filters
                    </p>
                </div>
            )}
        </div>
    );
} 