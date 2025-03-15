'use client'

import { Button } from "@/components/ui/button"
//import { auth } from "@/auth"

interface Address {
    firstName: string
    lastName: string
    company?: string
    address1: string
    address2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone: string
    email: string
}

function AddressCard({
    type,
    address,
    onEdit,
}: { type: "billing" | "shipping"; address: Address; onEdit: () => void }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-light">{type === "billing" ? "BILLING ADDRESS" : "SHIPPING ADDRESS"}</h2>
                <Button variant="outline" size="sm" onClick={onEdit}>
                    EDIT
                </Button>
            </div>
            <div className="space-y-1 text-gray-600">
                <p>
                    {address.firstName} {address.lastName}
                </p>
                {address.company && <p>{address.company}</p>}
                <p>{address.address1}</p>
                {address.address2 && <p>{address.address2}</p>}
                <p>
                    {address.city}, {address.state} {address.postalCode}
                </p>
                <p>{address.country}</p>
                <p>{address.email}</p>
                <p>{address.phone}</p>
            </div>
        </div>
    )
}

export default function AddressesPage() {
    // const user = await auth()

    const handleEditAddress = (type: "billing" | "shipping") => {
        // Handle address edit
        console.log(`Edit ${type} address`)
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-light">ADDRESSES</h1>

            <p className="text-gray-600">The following addresses will be used on the checkout page by default.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AddressCard
                    type="billing"
                    address={{
                        firstName: "Daniel",
                        lastName: "Robinson",
                        address1: "1418 River Drive, Suite 35",
                        city: "Cottonhall",
                        state: "CA",
                        postalCode: "9622",
                        country: "United States",
                        phone: "+1 246-345-0695",
                        email: "sale@uomo.com",
                    }}
                    onEdit={() => handleEditAddress("billing")}
                />

                <AddressCard
                    type="shipping"
                    address={{
                        firstName: "Daniel",
                        lastName: "Robinson",
                        address1: "1418 River Drive, Suite 35",
                        city: "Cottonhall",
                        state: "CA",
                        postalCode: "9622",
                        country: "United States",
                        phone: "+1 246-345-0695",
                        email: "sale@uomo.com",
                    }}
                    onEdit={() => handleEditAddress("shipping")}
                />
            </div>
        </div>
    )
}

