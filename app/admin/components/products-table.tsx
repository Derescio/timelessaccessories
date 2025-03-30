"use client";

import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

export default function ProductsTable() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <DataTable columns={columns} data={[]} />
        </div>
    );
} 