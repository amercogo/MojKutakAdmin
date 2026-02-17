"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";

type ViewStats = {
    date_d: string;
    view_count: number;
};

export default function DashboardChart() {
    const [data, setData] = useState<ViewStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: views, error } = await supabase.rpc("get_views_by_day", {
                days_d: days,
            });

            if (error) {
                console.error("Error fetching views:", error);
            } else if (views) {
                // Format date to a readable string like "Mon 15"
                const formattedData = views.map((item: any) => ({
                    ...item,
                    date_d: new Date(item.date_d).toLocaleDateString("en-US", {
                        weekday: "short",
                        day: "numeric",
                    }),
                }));
                setData(formattedData);
            }
            setLoading(false);
        };

        fetchData();
    }, [days, supabase]);

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Views Overview</h3>
                <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium"
                >
                    <option value={7}>Last 7 Days</option>
                    <option value={30}>Last 30 Days</option>
                </select>
            </div>

            <div className="h-[300px] w-full flex items-center justify-center">
                {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                ) : data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#E5E7EB"
                            />
                            <XAxis
                                dataKey="date_d"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#6B7280", fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#6B7280", fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: "12px",
                                    boxShadow:
                                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                }}
                                itemStyle={{ color: "#1F2937", fontWeight: 600 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="view_count"
                                stroke="#2563EB"
                                strokeWidth={3}
                                dot={{ fill: "#2563EB", r: 4, strokeWidth: 0 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-gray-500 text-sm">No data available for this period</p>
                )}
            </div>
        </div>
    );
}
