"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchInput } from "../components/search-input";
import { getUsers, updateUserRole, deleteUser } from "@/lib/actions/user.actions";
import { Role } from "@prisma/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UsersPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [role, setRole] = useState<Role | "ALL">("ALL");
    const [page, setPage] = useState(1);

    // Define user interface
    interface User {
        id: string;
        name: string | null;
        email: string;
        role: Role;
        createdAt: string | Date;
        _count: {
            orders: number;
        };
    }

    const [users, setUsers] = useState<User[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getUsers({
                page,
                limit: 10,
                role: role === "ALL" ? undefined : role,
                search: search || undefined,
            });

            if (response.success && response.data) {
                setUsers(response.data.users);
                setTotalPages(response.data.totalPages);
            } else {
                toast.error(response.error || "Failed to fetch users");
            }
        } catch {
            toast.error("An error occurred while fetching users");
        } finally {
            setLoading(false);
        }
    }, [search, role, page]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleRoleChange = async (userId: string, newRole: Role) => {
        try {
            const response = await updateUserRole({
                id: userId,
                role: newRole,
            });

            if (response.success) {
                toast.success("User role updated successfully");
                fetchUsers();
            } else {
                toast.error(response.error || "Failed to update user role");
            }
        } catch {
            toast.error("An error occurred while updating user role");
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            const response = await deleteUser(userToDelete);

            if (response.success) {
                toast.success("User deleted successfully");
                setDeleteDialogOpen(false);
                fetchUsers();
            } else {
                toast.error(response.error || "Failed to delete user");
            }
        } catch {
            toast.error("An error occurred while deleting user");
        }
    };

    const getRoleColor = (role: Role) => {
        switch (role) {
            case Role.ADMIN:
                return "bg-red-500";
            case Role.USER:
                return "bg-blue-500";
            default:
                return "bg-gray-500";
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                    <p className="text-muted-foreground">Manage your users</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Select value={role} onValueChange={(value: Role | "ALL") => setRole(value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Users</SelectItem>
                            <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                            <SelectItem value={Role.USER}>User</SelectItem>
                        </SelectContent>
                    </Select>
                    <SearchInput
                        placeholder="Search users..."
                        value={search}
                        onChange={setSearch}
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={user.role}
                                            onValueChange={(value: Role) =>
                                                handleRoleChange(user.id, value)
                                            }
                                        >
                                            <SelectTrigger className="w-[130px]">
                                                <SelectValue>
                                                    <Badge className={getRoleColor(user.role)}>
                                                        {user.role}
                                                    </Badge>
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                                                <SelectItem value={Role.USER}>User</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>{user._count.orders}</TableCell>
                                    <TableCell>
                                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/admin/users/${user.id}`)}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => {
                                                    setUserToDelete(user.id);
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user
                            and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 