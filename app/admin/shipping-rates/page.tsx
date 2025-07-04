import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { getShippingRates } from '@/lib/actions/shipping.actions'
import ShippingRatesList from './components/shipping-rates-list'

export default async function ShippingRatesPage() {
    let shippingRates: Awaited<ReturnType<typeof getShippingRates>> = []

    try {
        shippingRates = await getShippingRates()
    } catch (error) {
        console.error('Error loading shipping rates:', error)
        // Table might not exist yet - that's okay, we'll show empty state
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Shipping Rates</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage shipping rates for different countries
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/shipping-rates/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Shipping Rate
                    </Link>
                </Button>
            </div>

            <Card className="p-6">
                <Suspense fallback={<div>Loading shipping rates...</div>}>
                    <ShippingRatesList initialRates={shippingRates} />
                </Suspense>
            </Card>
        </div>
    )
} 