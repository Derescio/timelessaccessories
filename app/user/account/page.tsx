import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/sign-in');
    }

    const userName = session.user.name || 'User';

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h1 className="text-2xl font-light mb-6">MY ACCOUNT</h1>
            <p className="text-gray-600 mb-8"></p>
            Hello {userName} (not {userName}? <LogoutButton />)
            <form action={async () => {
                'use server';
                await auth();
            }} className="inline">

            </form>
            )

            <p className="text-gray-600">
                From your account dashboard you can view your{" "}
                <Link href="/user/account/orders" className="text-primary hover:underline">
                    recent orders
                </Link>
                , manage your{" "}
                <Link href="/user/account/address" className="text-primary hover:underline">
                    shipping and billing addresses
                </Link>
                , and{" "}
                <Link href="/user/account/acct-details" className="text-primary hover:underline">
                    edit your password and account details
                </Link>
                .
            </p>
            <Link href="/" className="text-primary hover:underline">
                <Button className="mt-4">Go Back Home</Button>
            </Link>
        </div>
    );
}