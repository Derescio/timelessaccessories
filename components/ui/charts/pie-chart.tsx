"use client";

import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts";

interface PieChartProps {
    data: {
        name: string;
        value: string;
    }[];
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#ffbb28"];

export function PieChart({ data }: PieChartProps) {
    // Convert string values to numbers and sort by value in descending order
    const sortedData = [...data]
        .map(item => ({
            ...item,
            value: Number(item.value)
        }))
        .sort((a, b) => b.value - a.value);

    // Calculate total for percentage
    const total = sortedData.reduce((sum, item) => sum + item.value, 0);

    // Ensure we have data to display
    if (!sortedData.length) {
        return (
            <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No data available</p>
            </div>
        );
    }

    return (
        <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                    <Pie
                        data={sortedData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} (${((value / total) * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        paddingAngle={2}
                        minAngle={1}
                    >
                        {sortedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                        labelFormatter={(label) => `Product: ${label}`}
                    />
                </RechartsPieChart>
            </ResponsiveContainer>
        </div>
    );
} 