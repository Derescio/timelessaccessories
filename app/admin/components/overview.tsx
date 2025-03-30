"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/card";

const data = [
    {
        name: "Jan",
        total: 1200,
    },
    {
        name: "Feb",
        total: 2800,
    },
    {
        name: "Mar",
        total: 3200,
    },
    {
        name: "Apr",
        total: 4800,
    },
    {
        name: "May",
        total: 3900,
    },
    {
        name: "Jun",
        total: 4800,
    },
    {
        name: "Jul",
        total: 5600,
    },
    {
        name: "Aug",
        total: 6800,
    },
    {
        name: "Sep",
        total: 5900,
    },
    {
        name: "Oct",
        total: 7200,
    },
    {
        name: "Nov",
        total: 7900,
    },
    {
        name: "Dec",
        total: 9800,
    },
];

export function Overview() {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                    tickMargin={8}
                />
                <Tooltip
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                                <Card className="p-2 shadow-lg border bg-background">
                                    <div className="text-sm font-medium">
                                        ${payload[0].value?.toLocaleString()}
                                    </div>
                                </Card>
                            );
                        }
                        return null;
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: "#8884d8", stroke: "white", strokeWidth: 2 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
} 