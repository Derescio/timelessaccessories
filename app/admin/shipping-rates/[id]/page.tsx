import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getShippingRateById } from '@/lib/actions/shipping.actions'
import ShippingRateForm from '../components/shipping-rate-form'

interface EditShippingRatePageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditShippingRatePage({ params }: EditShippingRatePageProps) {
    const { id } = await params
    const shippingRate = await getShippingRateById(id)

    if (!shippingRate) {
        notFound()
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/admin/shipping-rates">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Shipping Rates
                    </Link>
                </Button>

                <div>
                    <h1 className="text-3xl font-bold">Edit Shipping Rate</h1>
                    <p className="text-muted-foreground mt-2">
                        Update shipping rate for {shippingRate.countryName}
                    </p>
                </div>
            </div>

            <Card className="p-6">
                <ShippingRateForm
                    initialData={shippingRate}
                    isEditing={true}
                />
            </Card>
        </div>
    )
} 