import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "@/components/ui/charts/line-chart";
import { BarChart } from "@/components/ui/charts/bar-chart";
import { PieChart } from "@/components/ui/charts/pie-chart";
import { getAnalytics } from "@/lib/actions/analytics.actions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "1Dashboard",
    description: "Overview of your store's performance",
};

export default async function DashboardPage() {
    // Admin USERS ONLY
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        redirect("/sign-in?message=Admin access required");
    }
    const { success, data, error } = await getAnalytics();

    if (!success || error || !data) {
        return (
            <div className="p-8 text-center">
                <p className="text-muted-foreground">
                    {error || "Failed to load analytics data. Please try again."}
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Overview of the performance of the store.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LineChart data={data.revenue} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <BarChart data={data.sales} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PieChart data={data.topProducts} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 