'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { createShippingRate, updateShippingRate } from '@/lib/actions/shipping.actions'
import { toast } from 'sonner'

interface ShippingRate {
    id?: string
    countryCode: string
    countryName: string
    rate: number
    freeShippingThreshold: number
    isActive: boolean
}

interface ShippingRateFormProps {
    initialData?: ShippingRate
    isEditing?: boolean
}

export default function ShippingRateForm({ initialData, isEditing = false }: ShippingRateFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<ShippingRate>({
        countryCode: initialData?.countryCode || '',
        countryName: initialData?.countryName || '',
        rate: initialData?.rate || 0,
        freeShippingThreshold: initialData?.freeShippingThreshold || 40000, // Default $400
        isActive: initialData?.isActive ?? true
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleInputChange = (field: keyof ShippingRate, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error when field is edited
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.countryCode.trim()) {
            newErrors.countryCode = 'Country code is required'
        } else if (formData.countryCode.length < 2) {
            newErrors.countryCode = 'Country code must be at least 2 characters'
        }

        if (!formData.countryName.trim()) {
            newErrors.countryName = 'Country name is required'
        }

        if (formData.rate < 0) {
            newErrors.rate = 'Rate must be positive'
        }

        if (formData.freeShippingThreshold < 0) {
            newErrors.freeShippingThreshold = 'Free shipping threshold must be positive'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setIsLoading(true)
        try {
            const result = isEditing && initialData?.id
                ? await updateShippingRate(initialData.id, formData)
                : await createShippingRate(formData)

            if (result.success) {
                toast.success(
                    isEditing
                        ? 'Shipping rate updated successfully'
                        : 'Shipping rate created successfully'
                )
                router.push('/admin/shipping-rates')
                router.refresh()
            } else {
                toast.error(result.error || 'Failed to save shipping rate')
            }
        } catch (error) {
            console.error('Error saving shipping rate:', error)
            toast.error('Failed to save shipping rate')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="countryCode">Country Code *</Label>
                    <Input
                        id="countryCode"
                        value={formData.countryCode}
                        onChange={(e) => handleInputChange('countryCode', e.target.value.toUpperCase())}
                        placeholder="US, CA, GB, etc."
                        className={errors.countryCode ? 'border-red-500' : ''}
                        maxLength={10}
                    />
                    {errors.countryCode && (
                        <p className="text-red-500 text-sm">{errors.countryCode}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Use ISO 2-letter codes (US, CA, GB) or FALLBACK for default
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="countryName">Country Name *</Label>
                    <Input
                        id="countryName"
                        value={formData.countryName}
                        onChange={(e) => handleInputChange('countryName', e.target.value)}
                        placeholder="United States, Canada, etc."
                        className={errors.countryName ? 'border-red-500' : ''}
                    />
                    {errors.countryName && (
                        <p className="text-red-500 text-sm">{errors.countryName}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="rate">Shipping Rate (in cents) *</Label>
                    <Input
                        id="rate"
                        type="number"
                        value={formData.rate}
                        onChange={(e) => handleInputChange('rate', parseInt(e.target.value) || 0)}
                        placeholder="1500"
                        className={errors.rate ? 'border-red-500' : ''}
                        min="0"
                    />
                    {errors.rate && (
                        <p className="text-red-500 text-sm">{errors.rate}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Enter amount in cents (1500 = $15.00). Current: ${(formData.rate / 100).toFixed(2)}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (in cents) *</Label>
                    <Input
                        id="freeShippingThreshold"
                        type="number"
                        value={formData.freeShippingThreshold}
                        onChange={(e) => handleInputChange('freeShippingThreshold', parseInt(e.target.value) || 0)}
                        placeholder="40000"
                        className={errors.freeShippingThreshold ? 'border-red-500' : ''}
                        min="0"
                    />
                    {errors.freeShippingThreshold && (
                        <p className="text-red-500 text-sm">{errors.freeShippingThreshold}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Enter amount in cents (40000 = $400.00). Current: ${(formData.freeShippingThreshold / 100).toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Active</Label>
                <p className="text-xs text-muted-foreground">
                    Only active shipping rates will be used for calculations
                </p>
            </div>

            <div className="flex gap-4 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isEditing ? 'Update Shipping Rate' : 'Create Shipping Rate'}
                </Button>
            </div>
        </form>
    )
} 