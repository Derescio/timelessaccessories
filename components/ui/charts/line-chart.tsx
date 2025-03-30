"use client";

import { Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface LineChartProps {
    data: {
        name: string;
        value: string;
    }[];
}

export function LineChart({ data }: LineChartProps) {
    return (
        <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={data}>
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
                        tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                    />
                    <Tooltip
                        formatter={(value: string) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                        labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </RechartsLineChart>
            </ResponsiveContainer>
        </div>
    );
} 