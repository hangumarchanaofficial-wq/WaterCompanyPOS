"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DollarSign,
    ShoppingCart,
    TrendingUp,
    AlertTriangle,
    Package,
    Plus,
    ArrowUpRight,
    MoreHorizontal,
    User,
    ChevronLeft,
    ChevronRight,
    Wallet,
    Activity
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useSalesSummary, useTodaySales } from '@/hooks/useSales';
import { useLowStockProducts } from '@/hooks/useProducts';
import { useCustomersWithCredit } from '@/hooks/useCustomers';

export default function DashboardPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(10);

    // Fetch real data from Supabase
    const { summary, loading: summaryLoading } = useSalesSummary();
    const { sales: todaySales, loading: todayLoading } = useTodaySales();
    const { products: lowStock, loading: stockLoading } = useLowStockProducts();
    const { customers: creditCustomers, loading: customersLoading } = useCustomersWithCredit();

    // Calculate today's data
    const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const todayCash = todaySales
        .filter(s => s.payment_type === 'CASH')
        .reduce((sum, sale) => sum + sale.total_amount, 0);
    const todayCredit = todaySales
        .filter(s => s.payment_type === 'CREDIT')
        .reduce((sum, sale) => sum + sale.total_amount, 0);

    // Total outstanding credit
    const outstandingCredit = creditCustomers.reduce((sum, customer) => sum + customer.credit_balance, 0);

    // Generate 7-day sparkline data from real sales
    const salesSparklineData = useMemo(() => {
        if (todaySales.length === 0) return [];

        // Get last 7 days
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (6 - i));
            date.setHours(0, 0, 0, 0);
            return date;
        });

        // Group sales by day
        const dailyData = last7Days.map(day => {
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);

            const dayTotal = todaySales
                .filter(sale => {
                    const saleDate = new Date(sale.transaction_date);
                    return saleDate >= day && saleDate <= dayEnd;
                })
                .reduce((sum, sale) => sum + sale.total_amount, 0);

            return dayTotal;
        });

        return dailyData;
    }, [todaySales]);

    // Generate 7-day transaction count sparkline
    const transactionSparklineData = useMemo(() => {
        if (todaySales.length === 0) return [];

        // Get last 7 days
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (6 - i));
            date.setHours(0, 0, 0, 0);
            return date;
        });

        // Group transaction counts by day
        const dailyData = last7Days.map(day => {
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);

            const dayCount = todaySales.filter(sale => {
                const saleDate = new Date(sale.transaction_date);
                return saleDate >= day && saleDate <= dayEnd;
            }).length;

            return dayCount;
        });

        return dailyData;
    }, [todaySales]);

    // Generate 7-day credit sparkline (using credit distribution as proxy for trend)
    const creditSparklineData = useMemo(() => {
        if (creditCustomers.length === 0) return [];

        // Create a simulated 7-day trend based on current credit data
        // In a real scenario, you'd query historical credit data
        const sorted = [...creditCustomers].sort((a, b) => a.credit_balance - b.credit_balance);

        // Create 7 data points from credit distribution
        const step = Math.max(1, Math.floor(sorted.length / 7));
        const creditTrend = Array.from({ length: 7 }, (_, i) => {
            const startIdx = i * step;
            const endIdx = Math.min(startIdx + step, sorted.length);
            const segment = sorted.slice(startIdx, endIdx);
            return segment.reduce((sum, c) => sum + c.credit_balance, 0);
        });

        return creditTrend;
    }, [creditCustomers]);

    // Helper function to generate SVG path from data
    const generateSparklinePath = (data: number[], height = 40, width = 100) => {
        if (data.length === 0) return { line: '', fill: '' };

        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        const points = data.map((value, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((value - min) / range) * height;
            return `${x},${y}`;
        });

        const pathData = points.map((point, index) =>
            index === 0 ? `M${point}` : `L${point}`
        ).join(' ');

        const fillPath = `${pathData} L${width},${height} L0,${height} Z`;

        return { line: pathData, fill: fillPath };
    };

    const salesPath = generateSparklinePath(salesSparklineData);
    const transactionPath = generateSparklinePath(transactionSparklineData);
    const creditPath = generateSparklinePath(creditSparklineData);

    // Calculate real percentage changes (comparing first 3 days vs last 3 days)
    const calculateChange = (data: number[]) => {
        if (data.length < 4) return 0;
        const firstHalf = data.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const secondHalf = data.slice(-3).reduce((a, b) => a + b, 0) / 3;
        return firstHalf === 0 ? 0 : ((secondHalf - firstHalf) / firstHalf) * 100;
    };

    const salesChange = calculateChange(salesSparklineData);
    const creditChange = calculateChange(creditSparklineData);
    const transactionChange = calculateChange(transactionSparklineData);

    // Get recent sales
    const recentSales = todaySales.slice(0, 50);

    // Pagination
    const totalPages = Math.ceil(recentSales.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedSales = recentSales.slice(startIndex, endIndex);

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    // Get top 3 debtors
    const topDebtors = creditCustomers
        .sort((a, b) => b.credit_balance - a.credit_balance)
        .slice(0, 3);

    return (
        <div className="min-h-screen bg-[#101922] flex flex-col">
            <div className="flex-1 p-6">
                <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
                    {/* Headline */}
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h2>
                            <p className="text-slate-400 text-sm mt-1">Real-time inventory and sales metrics for today.</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 bg-[#1e2b38] hover:bg-white/10 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-colors">
                                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </button>
                            <Link href="/dashboard/sales/new">
                                <button className="px-4 py-2 bg-[#137fec] hover:bg-blue-600 rounded-lg text-sm font-medium text-white flex items-center gap-2 shadow-lg shadow-[#137fec]/20 transition-colors">
                                    <Plus className="h-4 w-4" />
                                    New Sale
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Cards with 7-Day Sparklines */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Card 1: Today's Sales with 7-Day Sparkline */}
                        <div className="p-5 rounded-xl bg-[#16212b] border border-[rgba(255,255,255,0.08)] relative overflow-hidden">
                            <div className="absolute right-4 top-4 opacity-20">
                                <DollarSign className="h-12 w-12 text-[#137fec]" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-slate-400 text-sm font-medium mb-3">Today's Sales</p>
                                <div className="flex items-baseline gap-3 mb-2">
                                    <h3 className="text-3xl font-bold text-white">
                                        {todayLoading ? '...' : `Rs ${todayTotal.toLocaleString()}`}
                                    </h3>
                                    {salesChange !== 0 && (
                                        <span className={`text-sm font-bold flex items-center ${salesChange > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            <TrendingUp className={`h-3 w-3 mr-1 ${salesChange < 0 ? 'rotate-180' : ''}`} />
                                            {Math.abs(salesChange).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                                {/* 7-Day Sparkline Chart */}
                                <div className="h-10 mt-3 -mx-2">
                                    {salesSparklineData.length > 0 ? (
                                        <svg className="w-full h-full text-[#137fec]" preserveAspectRatio="none" viewBox="0 0 100 40">
                                            <defs>
                                                <linearGradient id="grad-sales" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" style={{stopColor: 'currentColor', stopOpacity: 0.2}} />
                                                    <stop offset="100%" style={{stopColor: 'currentColor', stopOpacity: 0}} />
                                                </linearGradient>
                                            </defs>
                                            <path d={salesPath.line}
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                  vectorEffect="non-scaling-stroke" />
                                            <path d={salesPath.fill}
                                                  fill="url(#grad-sales)"
                                                  stroke="none" />
                                        </svg>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                                            No data yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Outstanding Credit with 7-Day Sparkline */}
                        <div className="p-5 rounded-xl bg-[#16212b] border border-[rgba(255,255,255,0.08)] relative overflow-hidden">
                            <div className="absolute right-4 top-4 opacity-20">
                                <Wallet className="h-12 w-12 text-amber-500" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-slate-400 text-sm font-medium mb-3">Outstanding Credit</p>
                                <div className="flex items-baseline gap-3 mb-2">
                                    <h3 className="text-3xl font-bold text-white">
                                        {customersLoading ? '...' : `Rs ${outstandingCredit.toLocaleString()}`}
                                    </h3>
                                    {creditChange !== 0 && (
                                        <span className={`text-sm font-bold flex items-center ${creditChange > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            {creditChange > 0 ? '+' : ''}{creditChange.toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                                {/* 7-Day Sparkline Chart */}
                                <div className="h-10 mt-3 -mx-2">
                                    {creditSparklineData.length > 0 ? (
                                        <svg className="w-full h-full text-amber-500" preserveAspectRatio="none" viewBox="0 0 100 40">
                                            <defs>
                                                <linearGradient id="grad-credit" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" style={{stopColor: 'currentColor', stopOpacity: 0.2}} />
                                                    <stop offset="100%" style={{stopColor: 'currentColor', stopOpacity: 0}} />
                                                </linearGradient>
                                            </defs>
                                            <path d={creditPath.line}
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                  vectorEffect="non-scaling-stroke" />
                                            <path d={creditPath.fill}
                                                  fill="url(#grad-credit)"
                                                  stroke="none" />
                                        </svg>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                                            No data yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Low Stock Alerts with Progress Bars */}
                        <div className="p-5 rounded-xl bg-[#16212b] border border-[rgba(255,255,255,0.08)] relative overflow-hidden">
                            <div className="absolute right-4 top-4 opacity-20">
                                <Package className="h-12 w-12 text-rose-500" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-slate-400 text-sm font-medium mb-3">Low Stock Alerts</p>
                                <div className="flex items-baseline gap-3 mb-2">
                                    <h3 className="text-3xl font-bold text-white">
                                        {stockLoading ? '...' : `${lowStock.length} Items`}
                                    </h3>
                                    {lowStock.length > 0 && (
                                        <span className="text-rose-500 text-sm font-bold bg-rose-500/10 px-2 py-0.5 rounded">
                                            +{lowStock.length} new
                                        </span>
                                    )}
                                </div>
                                {/* Progress Bars based on real stock levels */}
                                <div className="mt-4 flex gap-1">
                                    {[...Array(4)].map((_, i) => {
                                        const hasStock = i < Math.min(lowStock.length, 4);
                                        return (
                                            <div
                                                key={i}
                                                className={`h-1.5 rounded-full flex-1 ${
                                                    hasStock
                                                        ? i === 0 ? 'bg-rose-500' : 'bg-rose-500/40'
                                                        : 'bg-[#1e2b38] border border-white/5'
                                                }`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Card 4: Today's Transactions with 7-Day Sparkline */}
                        <div className="p-5 rounded-xl bg-[#16212b] border border-[rgba(255,255,255,0.08)] relative overflow-hidden">
                            <div className="absolute right-4 top-4 opacity-20">
                                <Activity className="h-12 w-12 text-blue-400" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-slate-400 text-sm font-medium mb-3">Today's Transactions</p>
                                <div className="flex items-baseline gap-3 mb-2">
                                    <h3 className="text-3xl font-bold text-white">
                                        {todayLoading ? '...' : todaySales.length}
                                    </h3>
                                    {transactionChange !== 0 && (
                                        <span className={`text-sm font-bold bg-[#1e2b38] px-2 py-0.5 rounded flex items-center ${
                                            transactionChange > 0 ? 'text-emerald-500' : 'text-slate-400'
                                        }`}>
                                            {transactionChange > 0 ? '+' : ''}{transactionChange.toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                                {/* 7-Day Sparkline Chart */}
                                <div className="h-10 mt-3 -mx-2">
                                    {transactionSparklineData.length > 0 ? (
                                        <svg className="w-full h-full text-blue-400" preserveAspectRatio="none" viewBox="0 0 100 40">
                                            <defs>
                                                <linearGradient id="grad-transactions" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" style={{stopColor: 'currentColor', stopOpacity: 0.2}} />
                                                    <stop offset="100%" style={{stopColor: 'currentColor', stopOpacity: 0}} />
                                                </linearGradient>
                                            </defs>
                                            <path d={transactionPath.line}
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                  vectorEffect="non-scaling-stroke" />
                                            <path d={transactionPath.fill}
                                                  fill="url(#grad-transactions)"
                                                  stroke="none" />
                                        </svg>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                                            No data yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Grid: Table & Debtors Panel */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Left Column: Recent Sales Table */}
                        <div className="xl:col-span-2 flex flex-col bg-[#16212b] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">Recent Sales</h3>
                                <Link href="/dashboard/sales">
                                    <button className="text-sm text-[#137fec] font-medium hover:text-blue-400 transition-colors">
                                        View All
                                    </button>
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                {todayLoading ? (
                                    <div className="text-center py-12 text-slate-400">Loading...</div>
                                ) : paginatedSales.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No sales today yet</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                        <tr className="bg-[#1e2b38]/50 border-b border-[rgba(255,255,255,0.08)] text-slate-400 text-xs uppercase tracking-wider">
                                            <th className="px-6 py-3 font-semibold">Customer</th>
                                            <th className="px-6 py-3 font-semibold">Date</th>
                                            <th className="px-6 py-3 font-semibold text-right">Total</th>
                                            <th className="px-6 py-3 font-semibold text-center">Status</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[rgba(255,255,255,0.08)] text-sm">
                                        {paginatedSales.map((sale: any) => (
                                            <tr key={sale.id} className="hover:bg-[#1e2b38]/30 transition-colors group">
                                                <td className="px-6 py-4 font-medium text-white">
                                                    {sale.customer_name || 'Cash'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-400">
                                                    {new Date(sale.transaction_date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-white">
                                                    Rs {sale.total_amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {sale.payment_type === 'CREDIT' ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                            Credit
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                            Paid
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            {/* Pagination Footer */}
                            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                                <span className="text-sm text-slate-400">
                                    Showing <span className="text-white font-medium">{startIndex + 1}-{Math.min(endIndex, recentSales.length)}</span> of <span className="text-white font-medium">{recentSales.length}</span>
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                        className="p-1 rounded bg-[#1e2b38] hover:bg-white/10 text-slate-400 transition-colors disabled:opacity-50"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages || recentSales.length === 0}
                                        className="p-1 rounded bg-[#1e2b38] hover:bg-white/10 text-white transition-colors disabled:opacity-50"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Top Debtors Panel */}
                        <div className="bg-[#16212b] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 h-fit">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-white">Top Debtors</h3>
                                <button className="p-1.5 rounded-lg hover:bg-[#1e2b38] text-slate-400 transition-colors">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </div>
                            {customersLoading ? (
                                <div className="text-center py-8 text-slate-400">Loading...</div>
                            ) : topDebtors.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No outstanding credit</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    {topDebtors.map((debtor, index) => {
                                        const riskLevel = debtor.credit_balance > 5000 ? 'high' :
                                            debtor.credit_balance > 2000 ? 'medium' : 'low';

                                        const riskColors = {
                                            high: { bg: 'bg-rose-500/20', text: 'text-rose-500', border: 'border-rose-500/20', bar: 'bg-rose-500', label: 'text-rose-400' },
                                            medium: { bg: 'bg-amber-500/20', text: 'text-amber-500', border: 'border-amber-500/20', bar: 'bg-amber-500', label: 'text-amber-400' },
                                            low: { bg: 'bg-emerald-500/20', text: 'text-emerald-500', border: 'border-emerald-500/20', bar: 'bg-emerald-500', label: 'text-emerald-400' }
                                        };

                                        const colors = riskColors[riskLevel];
                                        const utilization = Math.min((debtor.credit_balance / 10000) * 100, 100);

                                        return (
                                            <div key={debtor.id}>
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#137fec] to-blue-600 flex items-center justify-center border border-white/10">
                                                                <User className="h-5 w-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="text-white text-sm font-semibold">{debtor.name}</p>
                                                                <p className="text-slate-500 text-xs">Outstanding balance</p>
                                                            </div>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${colors.bg} ${colors.text} border ${colors.border} uppercase tracking-wide`}>
                                                            {riskLevel === 'high' ? 'High' : riskLevel === 'medium' ? 'Med' : 'Low'} Risk
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-slate-400">Utilization</span>
                                                            <span className={`font-medium ${colors.label}`}>
                                                                Rs {debtor.credit_balance.toLocaleString()} / 10k
                                                            </span>
                                                        </div>
                                                        <div className="h-2 w-full bg-[#1e2b38] rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${colors.bar} rounded-full`}
                                                                style={{ width: `${utilization}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-1">
                                                        <button className="flex-1 py-1.5 rounded bg-[#1e2b38] hover:bg-white/10 text-xs text-white font-medium border border-[rgba(255,255,255,0.08)] transition-colors">
                                                            View Profile
                                                        </button>
                                                        <button className="flex-1 py-1.5 rounded bg-[#1e2b38] hover:bg-white/10 text-xs text-white font-medium border border-[rgba(255,255,255,0.08)] transition-colors flex items-center justify-center gap-1">
                                                            Remind
                                                        </button>
                                                    </div>
                                                </div>
                                                {index < topDebtors.length - 1 && (
                                                    <div className="h-px bg-[rgba(255,255,255,0.08)] w-full mt-6"></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <button className="w-full mt-6 py-2 rounded-lg border border-[rgba(255,255,255,0.08)] text-sm text-slate-400 hover:text-white hover:bg-[#1e2b38] transition-colors flex items-center justify-center gap-2">
                                View Risk Report
                                <ArrowUpRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Low Stock Alert */}
                    {!stockLoading && lowStock.length > 0 && (
                        <div className="bg-[#16212b] border-2 border-orange-500/20 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center gap-3">
                                <div className="p-2 bg-orange-500/20 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Low Stock Items</h3>
                                    <p className="text-sm text-slate-400">These products are below minimum threshold</p>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid gap-4 md:grid-cols-3">
                                    {lowStock.slice(0, 6).map((product) => (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#1e2b38]/50 p-4 hover:bg-[#1e2b38] transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-orange-500/20 rounded-lg">
                                                    <Package className="h-5 w-5 text-orange-500" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-white">{product.name}</p>
                                                    <p className="text-xs text-slate-400">
                                                        Stock: <span className="font-bold text-orange-500">{product.stock}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {lowStock.length > 6 && (
                                    <Link href="/dashboard/inventory" className="flex items-center justify-center pt-4">
                                        <button className="text-slate-400 hover:text-white hover:bg-[#1e2b38] px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                                            View all low stock items ({lowStock.length})
                                            <ArrowUpRight className="h-4 w-4" />
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-[#16212b] border-t border-[rgba(255,255,255,0.08)] mt-auto">
                <div className="max-w-[1600px] mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-br from-[#137fec] to-blue-600 rounded-lg w-8 h-8 flex items-center justify-center">
                                <ShoppingCart className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <p className="text-white text-sm font-semibold">BevPOS</p>
                                <p className="text-slate-500 text-xs">Enterprise Inventory System</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 text-xs text-slate-400">
                            <Link href="/dashboard/help" className="hover:text-white transition-colors">
                                Help Center
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
