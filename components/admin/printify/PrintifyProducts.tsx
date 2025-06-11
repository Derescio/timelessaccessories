'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Package, ExternalLink, Trash2, RefreshCw } from 'lucide-react';

interface PrintifyProduct {
    id: string;
    title: string;
    description: string;
    images: string[];
    printifyProductId?: string;
    fulfillmentType: string;
    createdAt: string;
    updatedAt: string;
}

export default function PrintifyProducts() {
    const [products, setProducts] = useState<PrintifyProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/printify/products');

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load Printify products');
        } finally {
            setLoading(false);
        }
    };

    const syncProduct = async (productId: string) => {
        try {
            setSyncing(productId);

            const response = await fetch(`/api/admin/printify/sync-product`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId }),
            });

            if (!response.ok) {
                throw new Error('Failed to sync product');
            }

            toast.success('Product synced successfully!');
            fetchProducts(); // Refresh the list

        } catch (error) {
            console.error('Error syncing product:', error);
            toast.error('Failed to sync product');
        } finally {
            setSyncing(null);
        }
    };

    const deleteProduct = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }

        try {
            setDeleting(productId);

            const response = await fetch(`/api/admin/printify/products/${productId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete product');
            }

            toast.success('Product deleted successfully!');
            fetchProducts(); // Refresh the list

        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-40 w-full mb-4" />
                            <div className="flex gap-2">
                                <Skeleton className="h-8 flex-1" />
                                <Skeleton className="h-8 w-10" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Printify products yet</h3>
                <p className="text-muted-foreground mb-4">
                    Import products from the catalog to get started
                </p>
                <Button onClick={() => window.location.href = '/admin/printify?tab=catalog'}>
                    Browse Catalog
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {products.length} Printify product{products.length !== 1 ? 's' : ''}
                </p>
                <Button onClick={fetchProducts} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                    <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-sm font-medium line-clamp-2">
                                        {product.title}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Created {new Date(product.createdAt).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                    {product.fulfillmentType === 'PRINTIFY_POD' ? 'POD' : 'Mixed'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Product Image */}
                            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                {product.images && product.images.length > 0 ? (
                                    <img
                                        src={product.images[0]}
                                        alt={product.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Package className="h-12 w-12 text-muted-foreground" />
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {product.description}
                            </p>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => syncProduct(product.id)}
                                    disabled={syncing === product.id}
                                    className="flex-1"
                                >
                                    {syncing === product.id ? (
                                        <>Syncing...</>
                                    ) : (
                                        <>
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                            Sync
                                        </>
                                    )}
                                </Button>

                                {product.printifyProductId && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(`https://printify.com/app/products/${product.printifyProductId}`, '_blank')}
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                    </Button>
                                )}

                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteProduct(product.id)}
                                    disabled={deleting === product.id}
                                >
                                    {deleting === product.id ? (
                                        <>...</>
                                    ) : (
                                        <Trash2 className="h-3 w-3" />
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
} 