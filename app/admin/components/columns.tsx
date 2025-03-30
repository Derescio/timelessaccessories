"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Product, ProductInventory } from "@prisma/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const columns: ColumnDef<Product & { inventories: ProductInventory[] }>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "inventories",
        header: "Price",
        cell: ({ row }) => {
            const defaultInventory = row.original.inventories.find(inv => inv.isDefault);
            return <div>${defaultInventory?.retailPrice.toString() || "N/A"}</div>;
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/products/${row.original.id}`}>Edit</Link>
                </Button>
            );
        },
    },
]; 