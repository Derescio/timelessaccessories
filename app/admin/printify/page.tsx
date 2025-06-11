import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PrintifyCatalog from '@/components/admin/printify/PrintifyCatalog';
import PrintifyProducts from '@/components/admin/printify/PrintifyProducts';
import PrintifyOrders from '@/components/admin/printify/PrintifyOrders';
import PrintifySettings from '@/components/admin/printify/PrintifySettings';

export const metadata: Metadata = {
    title: 'Printify Management | Admin Dashboard',
    description: 'Manage Printify print-on-demand products and orders',
};

export default function PrintifyAdminPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Printify Management</h1>
                <p className="text-muted-foreground">
                    Manage your print-on-demand products, orders, and catalog
                </p>
            </div>

            <Tabs defaultValue="catalog" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="catalog">Browse Catalog</TabsTrigger>
                    <TabsTrigger value="products">My Products</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="catalog" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Printify Product Catalog</CardTitle>
                            <CardDescription>
                                Browse and import products from Printify's catalog of 1,100+ products
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PrintifyCatalog />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="products" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Printify Products</CardTitle>
                            <CardDescription>
                                Manage products you've created and imported from Printify
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PrintifyProducts />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="orders" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Printify Orders</CardTitle>
                            <CardDescription>
                                Track and manage orders sent to Printify for fulfillment
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PrintifyOrders />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Printify Settings</CardTitle>
                            <CardDescription>
                                Configure your Printify integration and webhooks
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PrintifySettings />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 