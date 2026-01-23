"use client";

import { useState, useMemo } from "react";
import {
    BarChart3,
    TrendingUp,
    Download,
    DollarSign,
    ShoppingCart,
    Users,
    Package,
    CreditCard,
    Banknote,
    ArrowLeft,
    ArrowUpRight,
    Activity,
} from "lucide-react";
import Link from "next/link";
import { useSales } from "@/hooks/useSales";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    LabelList,
} from "recharts";

export default function ReportsPage() {
    const { sales, loading: salesLoading } = useSales();
    const { customers, loading: customersLoading } = useCustomers();
    const { products, loading: productsLoading } = useProducts();

    const [dateRange, setDateRange] = useState("month");
    const [reportType, setReportType] = useState("sales");

    // Filter sales by date range
    const filteredSales = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return sales.filter((sale) => {
            const saleDate = new Date(sale.transaction_date);

            switch (dateRange) {
                case "today":
                    return saleDate >= today;
                case "week":
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return saleDate >= weekAgo;
                case "month":
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return saleDate >= monthAgo;
                case "year":
                    const yearAgo = new Date(today);
                    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                    return saleDate >= yearAgo;
                default:
                    return true;
            }
        });
    }, [sales, dateRange]);

    // Sales Trend Data (Daily)
    const salesTrendData = useMemo(() => {
        const dailySales = new Map();

        filteredSales.forEach((sale) => {
            const date = new Date(sale.transaction_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
            });
            const current = dailySales.get(date) || { cash: 0, credit: 0, total: 0 };

            if (sale.payment_type === "CASH") {
                current.cash += sale.total_amount;
            } else {
                current.credit += sale.total_amount;
            }
            current.total += sale.total_amount;

            dailySales.set(date, current);
        });

        return Array.from(dailySales.entries())
            .map(([date, data]) => ({ date, ...data }))
            .slice(-14); // Last 14 days
    }, [filteredSales]);

    // Payment Type Distribution
    const paymentTypeData = useMemo(() => {
        const cash = filteredSales
            .filter((s) => s.payment_type === "CASH")
            .reduce((sum, s) => sum + s.total_amount, 0);
        const credit = filteredSales
            .filter((s) => s.payment_type === "CREDIT")
            .reduce((sum, s) => sum + s.total_amount, 0);

        return [
            { name: "Cash Sales", value: cash, color: "#10b981" },
            { name: "Credit Sales", value: credit, color: "#f59e0b" },
        ];
    }, [filteredSales]);

    // Hourly Sales Pattern
    const hourlySalesData = useMemo(() => {
        const hourly = Array(24).fill(0).map((_, i) => ({ hour: `${i}:00`, sales: 0, transactions: 0 }));

        filteredSales.forEach((sale) => {
            const hour = new Date(sale.transaction_date).getHours();
            hourly[hour].sales += sale.total_amount;
            hourly[hour].transactions += 1;
        });

        return hourly.filter(h => h.sales > 0);
    }, [filteredSales]);

    // Category Performance
    const categoryPerformanceData = useMemo(() => {
        const categoryMap = new Map();

        filteredSales.forEach((sale) => {
            sale.sale_items?.forEach((item: any) => {
                const product = products.find(p => p.id === item.product_id);
                if (product) {
                    const current = categoryMap.get(product.category) || { revenue: 0, quantity: 0 };
                    current.revenue += item.total_price;
                    current.quantity += item.quantity;
                    categoryMap.set(product.category, current);
                }
            });
        });

        return Array.from(categoryMap.entries()).map(([category, data]) => ({
            category,
            revenue: data.revenue,
            quantity: data.quantity,
        }));
    }, [filteredSales, products]);

    // Top Products Data
    const topProductsData = useMemo(() => {
        const productMap = new Map();

        filteredSales.forEach((sale) => {
            sale.sale_items?.forEach((item: any) => {
                const current = productMap.get(item.product_id) || { quantity: 0, revenue: 0, name: item.product_name };
                productMap.set(item.product_id, {
                    quantity: current.quantity + item.quantity,
                    revenue: current.revenue + item.total_price,
                    name: current.name,
                });
            });
        });

        return Array.from(productMap.entries())
            .map(([id, data]) => ({
                name: data.name.length > 15 ? data.name.substring(0, 15) + '...' : data.name,
                fullName: data.name,
                revenue: data.revenue,
                quantity: data.quantity
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
    }, [filteredSales]);

    // Customer Analytics
    const customerAnalytics = useMemo(() => {
        const totalCustomers = customers.length;
        const customersWithCredit = customers.filter((c) => c.credit_balance > 0).length;
        const totalCredit = customers.reduce((sum, c) => sum + c.credit_balance, 0);

        return { totalCustomers, customersWithCredit, totalCredit };
    }, [customers]);

    // Sales Analytics
    const salesAnalytics = useMemo(() => {
        const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
        const totalTransactions = filteredSales.length;
        const cashSales = filteredSales
            .filter((s) => s.payment_type === "CASH")
            .reduce((sum, sale) => sum + sale.total_amount, 0);
        const creditSales = filteredSales
            .filter((s) => s.payment_type === "CREDIT")
            .reduce((sum, sale) => sum + sale.total_amount, 0);

        return { totalSales, totalTransactions, cashSales, creditSales };
    }, [filteredSales]);

    // Export to CSV
    const exportToCSV = () => {
        let csvContent = "";
        let filename = "";

        if (reportType === "sales") {
            csvContent = "Date,Customer,Payment Type,Amount\n";
            filteredSales.forEach((sale) => {
                const date = new Date(sale.transaction_date).toLocaleDateString();
                csvContent += `${date},${sale.customer_name},${sale.payment_type},${sale.total_amount}\n`;
            });
            filename = `sales_report_${dateRange}.csv`;
        } else if (reportType === "products") {
            csvContent = "Product,Quantity Sold,Revenue\n";
            topProductsData.forEach((product) => {
                csvContent += `${product.fullName},${product.quantity},${product.revenue}\n`;
            });
            filename = `product_report_${dateRange}.csv`;
        } else if (reportType === "customers") {
            csvContent = "Customer,Credit Balance\n";
            customers.forEach((customer) => {
                csvContent += `${customer.name},${customer.credit_balance}\n`;
            });
            filename = `customer_report.csv`;
        }

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };

    const loading = salesLoading || customersLoading || productsLoading;

    const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"];

    // Custom Tooltip for Top Products
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-3 shadow-xl">
                    <p className="text-white font-semibold mb-1">{payload[0].payload.fullName}</p>
                    <p className="text-emerald-400 text-sm">Revenue: Rs {payload[0].value.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">Quantity: {payload[0].payload.quantity}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-[#101922] flex flex-col">
            <div className="flex-1 p-6">
                <div className="max-w-[1600px] mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <button className="p-2 rounded-lg bg-[#16212b] border border-[rgba(255,255,255,0.1)] hover:bg-[#1e2b38] text-white transition-colors">
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                            </Link>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Reports & Analytics</h2>
                                <p className="text-slate-400 text-sm mt-1">View detailed business insights and trends</p>
                            </div>
                        </div>
                        <button
                            onClick={exportToCSV}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-medium text-white flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Export Report
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl mb-6">
                        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#137fec]/10 rounded-lg">
                                    <BarChart3 className="h-5 w-5 text-[#137fec]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Report Filters</h3>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Date Range</label>
                                    <select
                                        value={dateRange}
                                        onChange={(e) => setDateRange(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all"
                                    >
                                        <option value="today">Today</option>
                                        <option value="week">Last 7 Days</option>
                                        <option value="month">Last 30 Days</option>
                                        <option value="year">Last Year</option>
                                        <option value="all">All Time</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Report Type</label>
                                    <select
                                        value={reportType}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all"
                                    >
                                        <option value="sales">Sales Report</option>
                                        <option value="products">Product Performance</option>
                                        <option value="customers">Customer Report</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-slate-400">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#137fec] border-r-transparent mb-4"></div>
                            <p>Loading reports...</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid gap-4 md:grid-cols-4 mb-6">
                                <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2.5 bg-[#137fec]/10 rounded-lg">
                                            <DollarSign className="h-5 w-5 text-[#137fec]" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-1">Total Sales</p>
                                    <div className="text-3xl font-bold text-white mb-1">
                                        Rs {salesAnalytics.totalSales.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-slate-500">{salesAnalytics.totalTransactions} transactions</p>
                                </div>

                                <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                                            <Banknote className="h-5 w-5 text-emerald-500" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-1">Cash Sales</p>
                                    <div className="text-3xl font-bold text-white mb-1">
                                        Rs {salesAnalytics.cashSales.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {filteredSales.filter((s) => s.payment_type === "CASH").length} transactions
                                    </p>
                                </div>

                                <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2.5 bg-orange-500/10 rounded-lg">
                                            <CreditCard className="h-5 w-5 text-orange-500" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-1">Credit Sales</p>
                                    <div className="text-3xl font-bold text-white mb-1">
                                        Rs {salesAnalytics.creditSales.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {filteredSales.filter((s) => s.payment_type === "CREDIT").length} transactions
                                    </p>
                                </div>

                                <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2.5 bg-red-500/10 rounded-lg">
                                            <Users className="h-5 w-5 text-red-500" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-1">Outstanding</p>
                                    <div className="text-3xl font-bold text-white mb-1">
                                        Rs {customerAnalytics.totalCredit.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-slate-500">{customerAnalytics.customersWithCredit} customers</p>
                                </div>
                            </div>

                            {/* Charts Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Sales Trend Chart */}
                                <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[#137fec]/10 rounded-lg">
                                                <Activity className="h-5 w-5 text-[#137fec]" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">Sales Trend</h3>
                                                <p className="text-sm text-slate-400">Daily sales over time</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <AreaChart data={salesTrendData}>
                                                <defs>
                                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#137fec" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#137fec" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                                                <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "#1e293b",
                                                        border: "1px solid #334155",
                                                        borderRadius: "8px",
                                                        color: "#fff",
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="total"
                                                    stroke="#137fec"
                                                    fillOpacity={1}
                                                    fill="url(#colorTotal)"
                                                    strokeWidth={2}
                                                >
                                                    <LabelList
                                                        dataKey="total"
                                                        position="top"
                                                        fill="#94a3b8"
                                                        fontSize={10}
                                                        formatter={(value: any) => {
                                                            const num = Number(value);
                                                            return !isNaN(num) ? `Rs ${num.toLocaleString()}` : '';
                                                        }}
                                                    />
                                                </Area>
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Payment Type Distribution */}
                                <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">Payment Distribution</h3>
                                                <p className="text-sm text-slate-400">Cash vs Credit sales</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={paymentTypeData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={(entry) => {
                                                        const total = paymentTypeData.reduce((sum, item) => sum + item.value, 0);
                                                        const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
                                                        return `${entry.name}\n${percentage}%\nRs ${entry.value.toLocaleString()}`;
                                                    }}
                                                    outerRadius={90}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    style={{ fontSize: "11px", fontWeight: "600" }}
                                                >
                                                    {paymentTypeData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "#1e293b",
                                                        border: "1px solid #334155",
                                                        borderRadius: "8px",
                                                        color: "#fff",
                                                    }}
                                                    formatter={(value: any) => `Rs ${value.toLocaleString()}`}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Cash vs Credit Trend */}
                                <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                                <BarChart3 className="h-5 w-5 text-orange-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">Cash vs Credit Trend</h3>
                                                <p className="text-sm text-slate-400">Daily comparison</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={salesTrendData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                                                <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "#1e293b",
                                                        border: "1px solid #334155",
                                                        borderRadius: "8px",
                                                        color: "#fff",
                                                    }}
                                                />
                                                <Legend />
                                                <Bar dataKey="cash" fill="#10b981" name="Cash Sales" radius={[8, 8, 0, 0]}>
                                                    <LabelList
                                                        dataKey="cash"
                                                        position="top"
                                                        fill="#94a3b8"
                                                        fontSize={9}
                                                        formatter={(value: any) => {
                                                            const num = Number(value);
                                                            return !isNaN(num) && num > 0 ? `Rs ${num.toLocaleString()}` : '';
                                                        }}
                                                    />
                                                </Bar>
                                                <Bar dataKey="credit" fill="#f59e0b" name="Credit Sales" radius={[8, 8, 0, 0]}>
                                                    <LabelList
                                                        dataKey="credit"
                                                        position="top"
                                                        fill="#94a3b8"
                                                        fontSize={9}
                                                        formatter={(value: any) => {
                                                            const num = Number(value);
                                                            return !isNaN(num) && num > 0 ? `Rs ${num.toLocaleString()}` : '';
                                                        }}
                                                    />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Category Performance */}
                                {categoryPerformanceData.length > 0 && (
                                    <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden">
                                        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                                    <Package className="h-5 w-5 text-purple-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">Category Performance</h3>
                                                    <p className="text-sm text-slate-400">Revenue by category</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={categoryPerformanceData} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                    <XAxis type="number" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                                                    <YAxis
                                                        dataKey="category"
                                                        type="category"
                                                        stroke="#94a3b8"
                                                        style={{ fontSize: "12px" }}
                                                        width={100}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: "#1e293b",
                                                            border: "1px solid #334155",
                                                            borderRadius: "8px",
                                                            color: "#fff",
                                                        }}
                                                        formatter={(value: any) => `Rs ${value.toLocaleString()}`}
                                                    />
                                                    <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 8, 8, 0]}>
                                                        <LabelList
                                                            dataKey="revenue"
                                                            position="right"
                                                            fill="#94a3b8"
                                                            fontSize={10}
                                                            formatter={(value: any) => {
                                                                const num = Number(value);
                                                                return !isNaN(num) ? `Rs ${num.toLocaleString()}` : '';
                                                            }}
                                                        />
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Top Products Chart - HORIZONTAL */}
                            {topProductsData.length > 0 && (
                                <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden mb-6">
                                    <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[#137fec]/10 rounded-lg">
                                                <ShoppingCart className="h-5 w-5 text-[#137fec]" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">Top Performing Products</h3>
                                                <p className="text-sm text-slate-400">Best Products by revenue</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <ResponsiveContainer width="100%" height={400}>
                                            <BarChart data={topProductsData} layout="vertical" margin={{ left: 20, right: 100 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis
                                                    type="number"
                                                    stroke="#94a3b8"
                                                    style={{ fontSize: "12px" }}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    stroke="#94a3b8"
                                                    style={{ fontSize: "11px" }}
                                                    width={120}
                                                />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                                                    {topProductsData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                    <LabelList
                                                        dataKey="revenue"
                                                        position="right"
                                                        fill="#94a3b8"
                                                        fontSize={10}
                                                        formatter={(value: any) => {
                                                            const num = Number(value);
                                                            return !isNaN(num) ? `Rs ${num.toLocaleString()}` : '';
                                                        }}
                                                    />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Hourly Sales Pattern */}
                            {hourlySalesData.length > 0 && (
                                <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                <Activity className="h-5 w-5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">Sales by Hour</h3>
                                                <p className="text-sm text-slate-400">Peak hours analysis</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={hourlySalesData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis dataKey="hour" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                                                <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "#1e293b",
                                                        border: "1px solid #334155",
                                                        borderRadius: "8px",
                                                        color: "#fff",
                                                    }}
                                                />
                                                <Legend />
                                                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} name="Sales (Rs)" dot={{ r: 4 }}>
                                                    <LabelList
                                                        dataKey="sales"
                                                        position="top"
                                                        fill="#10b981"
                                                        fontSize={9}
                                                        formatter={(value: any) => {
                                                            const num = Number(value);
                                                            return !isNaN(num) && num > 0 ? `Rs ${num.toLocaleString()}` : '';
                                                        }}
                                                    />
                                                </Line>
                                                <Line type="monotone" dataKey="transactions" stroke="#f59e0b" strokeWidth={2} name="Transactions" dot={{ r: 4 }}>
                                                    <LabelList
                                                        dataKey="transactions"
                                                        position="bottom"
                                                        fill="#f59e0b"
                                                        fontSize={9}
                                                        formatter={(value: any) => {
                                                            const num = Number(value);
                                                            return !isNaN(num) && num > 0 ? num : '';
                                                        }}
                                                    />
                                                </Line>
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-[#16212b] border-t border-[rgba(255,255,255,0.1)] mt-auto">
                <div className="max-w-[1600px] mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-br from-[#137fec] to-blue-600 rounded-lg w-8 h-8 flex items-center justify-center">
                                <BarChart3 className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <p className="text-white text-sm font-semibold">BevPOS</p>
                                <p className="text-slate-500 text-xs">Enterprise Inventory System</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 text-xs text-slate-400">
                            <Link href="/dashboard/help" className="hover:text-white transition-colors flex items-center gap-1">
                                Help Center
                                <ArrowUpRight className="h-3 w-3" />
                            </Link>
                            <Link href="/dashboard/privacy" className="hover:text-white transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="/dashboard/terms" className="hover:text-white transition-colors">
                                Terms of Service
                            </Link>
                        </div>

                        <div className="text-xs text-slate-500">
                            © 2026 BevPOS. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
