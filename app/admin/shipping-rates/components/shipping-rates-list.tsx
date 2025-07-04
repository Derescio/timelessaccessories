'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
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
} from '@/components/ui/alert-dialog'
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { deleteShippingRate, updateShippingRate } from '@/lib/actions/shipping.actions'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface ShippingRate {
    id: string
    countryCode: string
    countryName: string
    rate: number
    freeShippingThreshold: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

interface ShippingRatesListProps {
    initialRates: ShippingRate[]
}

export default function ShippingRatesList({ initialRates }: ShippingRatesListProps) {
    const [rates, setRates] = useState<ShippingRate[]>(initialRates)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [togglingId, setTogglingId] = useState<string | null>(null)

    const handleDelete = async (id: string, countryName: string) => {
        setDeletingId(id)
        try {
            const result = await deleteShippingRate(id)
            if (result.success) {
                setRates(rates.filter(rate => rate.id !== id))
                toast.success(`Shipping rate for ${countryName} deleted successfully`)
            } else {
                toast.error(result.error || 'Failed to delete shipping rate')
            }
        } catch (error) {
            console.error('Error deleting shipping rate:', error)
            toast.error('Failed to delete shipping rate')
        } finally {
            setDeletingId(null)
        }
    }

    const handleToggleActive = async (rate: ShippingRate) => {
        setTogglingId(rate.id)
        try {
            const result = await updateShippingRate(rate.id, {
                countryCode: rate.countryCode,
                countryName: rate.countryName,
                rate: rate.rate,
                freeShippingThreshold: rate.freeShippingThreshold,
                isActive: !rate.isActive
            })

            if (result.success) {
                setRates(rates.map(r =>
                    r.id === rate.id ? { ...r, isActive: !r.isActive } : r
                ))
                toast.success(`Shipping rate ${!rate.isActive ? 'activated' : 'deactivated'}`)
            } else {
                toast.error(result.error || 'Failed to update shipping rate')
            }
        } catch (error) {
            console.error('Error toggling shipping rate:', error)
            toast.error('Failed to update shipping rate')
        } finally {
            setTogglingId(null)
        }
    }

    if (rates.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No shipping rates found.</p>
                <Button asChild>
                    <Link href="/admin/shipping-rates/new">Add your first shipping rate</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Free Shipping</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rates.map((rate) => (
                        <TableRow key={rate.id}>
                            <TableCell className="font-medium">
                                {rate.countryName}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{rate.countryCode}</Badge>
                            </TableCell>
                            <TableCell>
                                {formatCurrency(rate.rate / 100)}
                            </TableCell>
                            <TableCell>
                                {formatCurrency(rate.freeShippingThreshold / 100)}
                            </TableCell>
                            <TableCell>
                                <Badge variant={rate.isActive ? "default" : "secondary"}>
                                    {rate.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {new Date(rate.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleActive(rate)}
                                        disabled={togglingId === rate.id}
                                    >
                                        {rate.isActive ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>

                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/admin/shipping-rates/${rate.id}`}>
                                            <Edit className="h-4 w-4" />
                                        </Link>
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={deletingId === rate.id}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Shipping Rate</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete the shipping rate for {rate.countryName}?
                                                    This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(rate.id, rate.countryName)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
} 