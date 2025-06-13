"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Ticket, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getPromotions, deletePromotion } from "@/lib/actions/promotions-actions";

// Types
type Promotion = {
    id: string;
    name: string;
    description: string | null;
    promotionType: string;
    value: number;
    minimumOrderValue: number | null;
    startDate: string | Date;
    endDate: string | Date;
    isActive: boolean;
    couponCode: string | null;
    usageCount: number;
    usageLimit: number | null;
    freeItemId: string | null;
    applyToAllItems: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
    requiresAuthentication?: boolean;
};

export default function PromotionsPage() {
    const router = useRouter();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [promotionToDelete, setPromotionToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch promotions data
    const fetchPromotions = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getPromotions();

            if (result.success && result.promotions) {
                setPromotions(result.promotions as Promotion[]);
            } else if (result.error) {
                toast.error("Failed to load promotions: " + result.error);
            }
        } catch (error) {
            console.error("Error fetching promotions:", error);
            toast.error("An error occurred while loading promotions");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial data load
    useEffect(() => {
        fetchPromotions();
    }, [fetchPromotions]);

    // Filter promotions based on search and tab
    useEffect(() => {
        let filtered = promotions;

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(promo =>
                promo.name.toLowerCase().includes(term) ||
                (promo.description && promo.description.toLowerCase().includes(term)) ||
                (promo.couponCode && promo.couponCode.toLowerCase().includes(term))
            );
        }

        // Filter by tab
        if (activeTab !== "all") {
            const now = new Date();
            filtered = filtered.filter(promo => {
                const startDate = new Date(promo.startDate);
                const endDate = new Date(promo.endDate);

                switch (activeTab) {
                    case "active":
                        return promo.isActive && now >= startDate && now <= endDate;
                    case "scheduled":
                        return promo.isActive && now < startDate;
                    case "expired":
                        return now > endDate;
                    case "inactive":
                        return !promo.isActive;
                    default:
                        return true;
                }
            });
        }

        setFilteredPromotions(filtered);
    }, [promotions, searchTerm, activeTab]);

    // Delete promotion
    const handleDelete = async () => {
        if (!promotionToDelete) return;

        setIsDeleting(true);
        try {
            const result = await deletePromotion(promotionToDelete);

            if (result.success) {
                toast.success("Promotion deleted successfully");
                fetchPromotions(); // Refresh the list
                setDeleteDialogOpen(false);
                setPromotionToDelete(null);
            } else {
                toast.error(result.error || "Failed to delete promotion");
            }
        } catch (error) {
            console.error("Error deleting promotion:", error);
            toast.error("An error occurred while deleting the promotion");
        } finally {
            setIsDeleting(false);
        }
    };

    // Helper functions
    const formatPromotionType = (type: string): string => {
        switch (type) {
            case "PERCENTAGE_DISCOUNT":
                return "Percentage Off";
            case "FIXED_AMOUNT_DISCOUNT":
                return "Fixed Amount Off";
            case "FREE_ITEM":
                return "Free Item";
            case "BUY_ONE_GET_ONE":
                return "Buy One Get One";
            default:
                return type;
        }
    };

    const formatPromotionValue = (type: string, value: number): string => {
        switch (type) {
            case "PERCENTAGE_DISCOUNT":
                return `${value}%`;
            case "FIXED_AMOUNT_DISCOUNT":
                return `$${value.toFixed(2)}`;
            default:
                return `${value}`;
        }
    };

    const getPromotionStatus = (promo: Promotion): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
        const now = new Date();
        const startDate = new Date(promo.startDate);
        const endDate = new Date(promo.endDate);

        if (!promo.isActive) return { text: "Inactive", variant: "secondary" };
        if (now < startDate) return { text: "Scheduled", variant: "outline" };
        if (now > endDate) return { text: "Expired", variant: "destructive" };
        return { text: "Active", variant: "default" };
    };

    const formatDateRange = (startDate: string | Date, endDate: string | Date): string => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground mx-auto" />
                    <p className="mt-4 text-muted-foreground">Loading promotions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
                    <p className="text-muted-foreground">
                        Manage discounts, coupons, and special offers
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={fetchPromotions} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Link href="/admin/promotions/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Promotion
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Promotions</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{promotions.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                        <Badge variant="default" className="h-4 w-4 rounded-full p-0"></Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {promotions.filter(p => {
                                const now = new Date();
                                const start = new Date(p.startDate);
                                const end = new Date(p.endDate);
                                return p.isActive && now >= start && now <= end;
                            }).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                        <Badge variant="outline" className="h-4 w-4 rounded-full p-0"></Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {promotions.filter(p => {
                                const now = new Date();
                                const start = new Date(p.startDate);
                                return p.isActive && now < start;
                            }).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                        <Badge variant="secondary" className="h-4 w-4 rounded-full p-0"></Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {promotions.reduce((sum, p) => sum + p.usageCount, 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>All Promotions</CardTitle>
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search promotions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-[300px] pl-8"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="active">Active</TabsTrigger>
                            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                            <TabsTrigger value="expired">Expired</TabsTrigger>
                            <TabsTrigger value="inactive">Inactive</TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-6">
                            {filteredPromotions.length > 0 ? (
                                <div className="rounded-md border">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium">Type</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium">Value</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium">Valid Period</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium">Usage</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPromotions.map((promotion) => {
                                                const status = getPromotionStatus(promotion);
                                                return (
                                                    <tr key={promotion.id} className="border-b">
                                                        <td className="p-4">
                                                            <div>
                                                                <div className="font-medium flex items-center gap-2">
                                                                    {promotion.name}
                                                                    {promotion.requiresAuthentication && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            Sign-in Required
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {promotion.couponCode && (
                                                                    <div className="text-sm text-muted-foreground">
                                                                        Code: <span className="font-mono">{promotion.couponCode}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-sm">{formatPromotionType(promotion.promotionType)}</td>
                                                        <td className="p-4 text-sm font-medium">
                                                            {formatPromotionValue(promotion.promotionType, promotion.value)}
                                                            {promotion.minimumOrderValue && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    Min: ${Number(promotion.minimumOrderValue).toFixed(2)}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-4">
                                                            <Badge variant={status.variant}>{status.text}</Badge>
                                                        </td>
                                                        <td className="p-4 text-sm">{formatDateRange(promotion.startDate, promotion.endDate)}</td>
                                                        <td className="p-4 text-sm">
                                                            {promotion.usageCount}
                                                            {promotion.usageLimit && `/${promotion.usageLimit}`}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <Link href={`/admin/promotions/${promotion.id}`}>
                                                                    <Button variant="ghost" size="sm">
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setPromotionToDelete(promotion.id);
                                                                        setDeleteDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-2 text-sm font-semibold">No promotions found</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {searchTerm ? "Try adjusting your search terms." : "Get started by creating your first promotion."}
                                    </p>
                                    {!searchTerm && (
                                        <div className="mt-6">
                                            <Link href="/admin/promotions/new">
                                                <Button>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add Promotion
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the promotion
                            and all associated usage data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 