"use client";

import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface BarChartProps {
    data: {
        name: string;
        value: number;
    }[];
}

export function BarChart({ data }: BarChartProps) {
    return (
        <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={data}>
                    <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                        formatter={(value: number) => [`${value} orders`, "Sales"]}
                        labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Bar
                        dataKey="value"
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                    />
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
} 