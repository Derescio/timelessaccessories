import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import ShippingRateForm from '../components/shipping-rate-form'

export default function NewShippingRatePage() {
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
                    <h1 className="text-3xl font-bold">Add Shipping Rate</h1>
                    <p className="text-muted-foreground mt-2">
                        Create a new shipping rate for a country
                    </p>
                </div>
            </div>

            <Card className="p-6">
                <ShippingRateForm />
            </Card>
        </div>
    )
} 