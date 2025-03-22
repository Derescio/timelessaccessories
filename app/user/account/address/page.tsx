'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    getUserAddresses,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress
} from "@/lib/actions/user.actions";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface Address {
    id: string;
    street: string;
    city: string;
    state: string;
    postalCode?: string | null;
    country: string;
    isUserManaged?: boolean;
}

export default function AddressesPage() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [currentAddress, setCurrentAddress] = useState<Address | null>(null);
    const [formData, setFormData] = useState<Omit<Address, 'id'>>({
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    async function fetchAddresses() {
        setIsLoading(true);
        try {
            const data = await getUserAddresses();
            setAddresses(data);
        } catch (error) {
            console.error("Error fetching addresses:", error);
            toast.error("Failed to load addresses");
        } finally {
            setIsLoading(false);
        }
    }

    function handleEdit(address: Address) {
        setCurrentAddress(address);
        setFormData({
            street: address.street,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode || "",
            country: address.country,
        });
        setFormOpen(true);
    }

    function handleAddNew() {
        setCurrentAddress(null);
        setFormData({
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
        });
        setFormOpen(true);
    }

    function handleDelete(address: Address) {
        setCurrentAddress(address);
        setDeleteDialogOpen(true);
    }

    async function confirmDelete() {
        if (!currentAddress?.id) return;

        try {
            const result = await deleteUserAddress(currentAddress.id);
            if (result.success) {
                toast.success("Address deleted successfully");
                fetchAddresses();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error("Error deleting address:", error);
            toast.error("Failed to delete address");
        } finally {
            setDeleteDialogOpen(false);
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    async function handleSubmit() {
        try {
            let result;

            if (currentAddress?.id) {
                // Update existing address
                result = await updateUserAddress(currentAddress.id, formData);
            } else {
                // Add new address
                result = await addUserAddress(formData);
            }

            if (result.success) {
                toast.success(result.message);
                fetchAddresses();
                setFormOpen(false);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error("Error saving address:", error);
            toast.error("Failed to save address");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-light">YOUR ADDRESSES</h1>
                <Button onClick={handleAddNew} className="flex items-center gap-2">
                    <PlusCircle size={16} />
                    Add New Address
                </Button>
            </div>

            <p className="text-gray-600">
                Manage your addresses for shipping and billing purposes.
            </p>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
            ) : addresses.length === 0 ? (
                <div className="bg-muted/30 rounded-lg p-12 text-center">
                    <h3 className="text-lg font-medium mb-2">No addresses found</h3>
                    <p className="text-gray-500 mb-6">Add your first address to make checkout easier.</p>
                    <Button onClick={handleAddNew}>Add Address</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {addresses.map((address) => (
                        <Card key={address.id} className="overflow-hidden">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Shipping Address</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="space-y-1 text-gray-600">
                                    <p>{address.street}</p>
                                    <p>
                                        {address.city}, {address.state} {address.postalCode}
                                    </p>
                                    <p>{address.country}</p>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4 flex justify-between">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(address)}>
                                    <Pencil size={14} className="mr-2" /> Edit
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(address)}>
                                    <Trash2 size={14} className="mr-2" /> Delete
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Address Form Dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {currentAddress ? "Edit Address" : "Add New Address"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="street" className="text-sm font-medium">
                                Street Address
                            </label>
                            <Input
                                id="street"
                                name="street"
                                value={formData.street}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="city" className="text-sm font-medium">
                                City
                            </label>
                            <Input
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="state" className="text-sm font-medium">
                                State/Province
                            </label>
                            <Input
                                id="state"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="postalCode" className="text-sm font-medium">
                                Postal/Zip Code
                            </label>
                            <Input
                                id="postalCode"
                                name="postalCode"
                                value={formData.postalCode || ""}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="country" className="text-sm font-medium">
                                Country
                            </label>
                            <Input
                                id="country"
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this address. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}