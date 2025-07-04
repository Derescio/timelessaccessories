// app/admin/product-types/[id]/attributes/page.tsx
import { Metadata } from "next";
import { getProductTypeById } from "@/lib/actions/product-type.actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, Pencil, Trash2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const metadata: Metadata = {
    title: "Admin | Product Type Attributes",
    description: "Manage attributes for product type",
};

interface AttributesPageProps {
    params: Promise<{
        id: string;
    }>;
}

// Move the server action to a separate file
import { deleteAttribute } from "./actions";

export default async function AttributesPage({ params }: AttributesPageProps) {
    // Ensure params is awaited before accessing properties
    const { id: productTypeId } = await Promise.resolve(params);

    // Fetch product type with attributes
    const result = await getProductTypeById(productTypeId);

    if (!result.success || !result.data) {
        notFound();
    }

    const productType = result.data;
    const productAttributes = productType.attributes.filter(attr => attr.isForProduct);
    const inventoryAttributes = productType.attributes.filter(attr => attr.isForInventory);
    const sharedAttributes = productType.attributes.filter(attr => attr.isForProduct && attr.isForInventory);

    const AttributeActions = ({ attributeId }: { attributeId: string }) => (
        <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon">
                <Link href={`/admin/product-types/${productTypeId}/attributes/${attributeId}`}>
                    <Pencil className="h-4 w-4" />
                </Link>
            </Button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this attribute and remove it from all products.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <form action={deleteAttribute}>
                            <input type="hidden" name="attributeId" value={attributeId} />
                            <input type="hidden" name="productTypeId" value={productTypeId} />
                            <AlertDialogAction type="submit" className="bg-red-500 hover:bg-red-600">
                                Delete
                            </AlertDialogAction>
                        </form>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/product-types">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Attributes for {productType.name}
                    </h2>
                    <p className="text-muted-foreground">
                        Define the attributes for this product type
                    </p>
                </div>
            </div>

            <Tabs defaultValue="all">
                <TabsList className="grid w-full md:w-96 grid-cols-3">
                    <TabsTrigger value="all">All Attributes</TabsTrigger>
                    <TabsTrigger value="product">Product Only</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory Only</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-4">
                    <div className="flex justify-between">
                        <h3 className="text-lg font-medium">All Attributes</h3>
                        <Button asChild size="sm">
                            <Link href={`/admin/product-types/${productTypeId}/attributes/new`}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Attribute
                            </Link>
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Usage</TableHead>
                                        <TableHead>Required</TableHead>
                                        <TableHead>Options</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {productType.attributes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center">
                                                No attributes defined yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        productType.attributes.map((attr) => (
                                            <TableRow key={attr.id}>
                                                <TableCell className="font-medium">{attr.displayName}</TableCell>
                                                <TableCell>{attr.type}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {attr.isForProduct && (
                                                            <Badge variant="secondary">Product</Badge>
                                                        )}
                                                        {attr.isForInventory && (
                                                            <Badge variant="outline">Inventory</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {attr.isRequired ? (
                                                        <Badge variant="default">Required</Badge>
                                                    ) : (
                                                        <Badge variant="outline">Optional</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {attr.options ? (
                                                        <span className="text-sm text-muted-foreground">
                                                            {JSON.parse(attr.options as string).length} options
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">None</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <AttributeActions attributeId={attr.id} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="product" className="space-y-4 mt-4">
                    <div className="flex justify-between">
                        <h3 className="text-lg font-medium">Product-Only Attributes</h3>
                        <Button asChild size="sm">
                            <Link href={`/admin/product-types/${productTypeId}/attributes/new`}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Attribute
                            </Link>
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Required</TableHead>
                                        <TableHead>Options</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {productAttributes.filter(attr => !attr.isForInventory).length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center">
                                                No product-only attributes defined yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        productAttributes.filter(attr => !attr.isForInventory).map((attr) => (
                                            <TableRow key={attr.id}>
                                                <TableCell className="font-medium">{attr.displayName}</TableCell>
                                                <TableCell>{attr.type}</TableCell>
                                                <TableCell>
                                                    {attr.isRequired ? (
                                                        <Badge variant="default">Required</Badge>
                                                    ) : (
                                                        <Badge variant="outline">Optional</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {attr.options ? (
                                                        <span className="text-sm text-muted-foreground">
                                                            {JSON.parse(attr.options as string).length} options
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">None</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <AttributeActions attributeId={attr.id} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="inventory" className="space-y-4 mt-4">
                    <div className="flex justify-between">
                        <h3 className="text-lg font-medium">Inventory-Only Attributes</h3>
                        <Button asChild size="sm">
                            <Link href={`/admin/product-types/${productTypeId}/attributes/new`}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Attribute
                            </Link>
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Required</TableHead>
                                        <TableHead>Options</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inventoryAttributes.filter(attr => !attr.isForProduct).length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center">
                                                No inventory-only attributes defined yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        inventoryAttributes.filter(attr => !attr.isForProduct).map((attr) => (
                                            <TableRow key={attr.id}>
                                                <TableCell className="font-medium">{attr.displayName}</TableCell>
                                                <TableCell>{attr.type}</TableCell>
                                                <TableCell>
                                                    {attr.isRequired ? (
                                                        <Badge variant="default">Required</Badge>
                                                    ) : (
                                                        <Badge variant="outline">Optional</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {attr.options ? (
                                                        <span className="text-sm text-muted-foreground">
                                                            {JSON.parse(attr.options as string).length} options
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">None</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <AttributeActions attributeId={attr.id} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}