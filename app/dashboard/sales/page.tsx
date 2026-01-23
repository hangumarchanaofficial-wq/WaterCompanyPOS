"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DollarSign,
    Calendar,
    Search,
    Filter,
    Eye,
    TrendingUp,
    CreditCard,
    Banknote,
    X,
    User,
    Package,
    Hash,
    Plus,
    ShoppingCart,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { useSales } from "@/hooks/useSales";

export default function SalesPage() {
    const { sales, loading } = useSales();

    const [searchQuery, setSearchQuery] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(10);

    // Filter sales based on search and filters
    const filteredSales = useMemo(() => {
        let filtered = [...sales];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(sale =>
                sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (sale.transaction_id && sale.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Payment type filter
        if (paymentFilter !== "all") {
            filtered = filtered.filter(sale => sale.payment_type === paymentFilter);
        }

        // Date filter
        if (dateFilter !== "all") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            filtered = filtered.filter(sale => {
                const saleDate = new Date(sale.transaction_date);
                saleDate.setHours(0, 0, 0, 0);

                switch (dateFilter) {
                    case "today":
                        return saleDate.getTime() === today.getTime();
                    case "week":
                        const weekAgo = new Date(today);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return saleDate >= weekAgo;
                    case "month":
                        const monthAgo = new Date(today);
                        monthAgo.setMonth(monthAgo.getMonth() - 1);
                        return saleDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, [sales, searchQuery, paymentFilter, dateFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredSales.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedSales = filteredSales.slice(startIndex, endIndex);

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    // Reset to page 1 when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery, paymentFilter, dateFilter]);

    // Calculate summary statistics
    const summary = useMemo(() => {
        const total = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
        const cash = filteredSales
            .filter(s => s.payment_type === "CASH")
            .reduce((sum, sale) => sum + sale.total_amount, 0);
        const credit = filteredSales
            .filter(s => s.payment_type === "CREDIT")
            .reduce((sum, sale) => sum + sale.total_amount, 0);

        return {
            total,
            cash,
            credit,
            count: filteredSales.length
        };
    }, [filteredSales]);

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    };

    return (
        <div className="min-h-screen bg-[#101922] flex flex-col">
            <div className="flex-1 p-6">
                <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Sales History</h2>
                            <p className="text-slate-400 text-sm mt-1">View and manage all sales transactions</p>
                        </div>
                        <Link href="/dashboard/sales/new">
                            <button className="px-4 py-2 bg-[#137fec] hover:bg-blue-600 rounded-lg text-sm font-medium text-white flex items-center gap-2 shadow-lg shadow-[#137fec]/20 transition-colors">
                                <Plus className="h-4 w-4" />
                                New Sale
                            </button>
                        </Link>
                    </div>

                    {/* Summary Cards - Enhanced with gradients */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Sales */}
                        <div className="p-5 rounded-xl bg-gradient-to-br from-[#16212b] to-[#1a2530] border border-[rgba(255,255,255,0.1)] relative overflow-hidden shadow-xl hover:shadow-2xl transition-all group">
                            <div className="absolute right-4 top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp className="h-16 w-16 text-[#137fec]" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-2 bg-[#137fec]/10 rounded-lg">
                                        <TrendingUp className="h-4 w-4 text-[#137fec]" />
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium">Total Sales</p>
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2">
                                    Rs {summary.total.toLocaleString()}
                                </h3>
                                <p className="text-xs text-slate-500">{summary.count} transactions</p>
                            </div>
                        </div>

                        {/* Cash Sales */}
                        <div className="p-5 rounded-xl bg-gradient-to-br from-[#16212b] to-[#1a2530] border border-[rgba(255,255,255,0.1)] relative overflow-hidden shadow-xl hover:shadow-2xl transition-all group">
                            <div className="absolute right-4 top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Banknote className="h-16 w-16 text-emerald-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <Banknote className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium">Cash Sales</p>
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2">
                                    Rs {summary.cash.toLocaleString()}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {filteredSales.filter(s => s.payment_type === "CASH").length} transactions
                                </p>
                            </div>
                        </div>

                        {/* Credit Sales */}
                        <div className="p-5 rounded-xl bg-gradient-to-br from-[#16212b] to-[#1a2530] border border-[rgba(255,255,255,0.1)] relative overflow-hidden shadow-xl hover:shadow-2xl transition-all group">
                            <div className="absolute right-4 top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <CreditCard className="h-16 w-16 text-amber-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-2 bg-amber-500/10 rounded-lg">
                                        <CreditCard className="h-4 w-4 text-amber-500" />
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium">Credit Sales</p>
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2">
                                    Rs {summary.credit.toLocaleString()}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {filteredSales.filter(s => s.payment_type === "CREDIT").length} transactions
                                </p>
                            </div>
                        </div>

                        {/* Average Sale */}
                        <div className="p-5 rounded-xl bg-gradient-to-br from-[#16212b] to-[#1a2530] border border-[rgba(255,255,255,0.1)] relative overflow-hidden shadow-xl hover:shadow-2xl transition-all group">
                            <div className="absolute right-4 top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <DollarSign className="h-16 w-16 text-purple-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <DollarSign className="h-4 w-4 text-purple-500" />
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium">Average Sale</p>
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2">
                                    Rs {summary.count > 0 ? Math.round(summary.total / summary.count).toLocaleString() : 0}
                                </h3>
                                <p className="text-xs text-slate-500">Per transaction</p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-[#137fec]/10 rounded-lg">
                                <Filter className="h-4 w-4 text-[#137fec]" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Filters & Search</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                    <Input
                                        placeholder="Search by customer, transaction ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 bg-[#1e2b38] border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50"
                                    />
                                </div>
                            </div>

                            {/* Payment Type Filter */}
                            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                                <SelectTrigger className="bg-[#1e2b38] border-[rgba(255,255,255,0.1)] text-white">
                                    <SelectValue placeholder="Payment Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Payments</SelectItem>
                                    <SelectItem value="CASH">Cash Only</SelectItem>
                                    <SelectItem value="CREDIT">Credit Only</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Date Filter */}
                            <Select value={dateFilter} onValueChange={setDateFilter}>
                                <SelectTrigger className="bg-[#1e2b38] border-[rgba(255,255,255,0.1)] text-white">
                                    <SelectValue placeholder="Date Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="week">Last 7 Days</SelectItem>
                                    <SelectItem value="month">Last 30 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Active Filters */}
                        {(searchQuery || paymentFilter !== "all" || dateFilter !== "all") && (
                            <div className="flex items-center gap-2 mt-4 flex-wrap">
                                <span className="text-sm text-slate-400">Active filters:</span>
                                {searchQuery && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#137fec]/20 text-[#137fec] border border-[#137fec]/20 gap-1">
                                        Search: {searchQuery}
                                        <X className="h-3 w-3 cursor-pointer hover:text-[#137fec]/80" onClick={() => setSearchQuery("")} />
                                    </span>
                                )}
                                {paymentFilter !== "all" && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#137fec]/20 text-[#137fec] border border-[#137fec]/20 gap-1">
                                        {paymentFilter}
                                        <X className="h-3 w-3 cursor-pointer hover:text-[#137fec]/80" onClick={() => setPaymentFilter("all")} />
                                    </span>
                                )}
                                {dateFilter !== "all" && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#137fec]/20 text-[#137fec] border border-[#137fec]/20 gap-1">
                                        {dateFilter === "today" ? "Today" : dateFilter === "week" ? "Last 7 Days" : "Last 30 Days"}
                                        <X className="h-3 w-3 cursor-pointer hover:text-[#137fec]/80" onClick={() => setDateFilter("all")} />
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sales List */}
                    <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden shadow-xl">
                        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                            <h3 className="text-lg font-bold text-white">Sales Transactions</h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Showing {filteredSales.length} of {sales.length} sales
                            </p>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="text-center py-12 text-slate-400">
                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#137fec] border-r-transparent mb-4"></div>
                                    <p>Loading sales...</p>
                                </div>
                            ) : paginatedSales.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <div className="inline-block p-4 bg-[#1e2b38] rounded-full mb-4">
                                        <ShoppingCart className="h-12 w-12 opacity-50" />
                                    </div>
                                    <p className="text-lg font-medium">No sales found</p>
                                    <p className="text-sm mt-1">Try adjusting your filters</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {paginatedSales.map((sale) => (
                                        <div
                                            key={sale.id}
                                            className="p-4 rounded-xl bg-gradient-to-br from-[#1e2b38]/50 to-[#1a2530]/50 hover:from-[#1e2b38] hover:to-[#1a2530] transition-all duration-300 border border-[rgba(255,255,255,0.08)] hover:border-[#137fec]/50 cursor-pointer group hover:shadow-lg"
                                            onClick={() => setSelectedSale(sale)}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                {/* Icon */}
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#137fec] to-blue-600 shadow-lg group-hover:shadow-[#137fec]/30 transition-shadow flex-shrink-0">
                                                    <DollarSign className="h-6 w-6 text-white" />
                                                </div>

                                                {/* Customer Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-white truncate text-base">{sale.customer_name}</p>
                                                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                        {sale.transaction_id && (
                                                            <span className="text-xs font-mono text-[#137fec] bg-[#137fec]/10 px-2.5 py-1 rounded-md flex items-center gap-1 border border-[#137fec]/20">
                                                                <Hash className="h-3 w-3" />
                                                                {sale.transaction_id}
                                                            </span>
                                                        )}
                                                        <span className="text-sm text-slate-400 flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {formatDate(sale.transaction_date)}
                                                        </span>
                                                        <span className="text-sm text-slate-400">
                                                            {formatTime(sale.transaction_date)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Payment Badge */}
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                    sale.payment_type === "CASH"
                                                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                                        : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                                }`}>
                                                    {sale.payment_type}
                                                </span>

                                                {/* Amount & View Button */}
                                                <div className="text-right flex items-center gap-4">
                                                    <div>
                                                        <p className="text-xl font-bold text-white">
                                                            Rs {sale.total_amount.toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {sale.sale_items?.length || 0} items
                                                        </p>
                                                    </div>
                                                    <button
                                                        className="p-2.5 rounded-lg bg-[#137fec]/10 text-[#137fec] hover:bg-[#137fec]/20 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedSale(sale);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination Footer */}
                        {filteredSales.length > 0 && (
                            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530] flex items-center justify-between">
                                <span className="text-sm text-slate-400">
                                    Showing <span className="text-white font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredSales.length)}</span> of <span className="text-white font-semibold">{filteredSales.length}</span>
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg bg-[#1e2b38] hover:bg-[#137fec]/20 text-slate-400 hover:text-[#137fec] transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-[rgba(255,255,255,0.08)]"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages || filteredSales.length === 0}
                                        className="p-2 rounded-lg bg-[#1e2b38] hover:bg-[#137fec]/20 text-white hover:text-[#137fec] transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-[rgba(255,255,255,0.08)]"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-[#16212b] border-t border-[rgba(255,255,255,0.08)] mt-auto">
                <div className="max-w-[1600px] mx-auto px-6" style={{ paddingTop: '29px', paddingBottom: '29px' }}>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Styled Company Name */}
                        <div className="flex items-center gap-2">
                            <div>
                                <h2 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                                    SHELON
                                </h2>
                            </div>
                        </div>

                        {/* Navigation Links */}
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

                        {/* Copyright */}
                        <div className="text-xs text-slate-500">
                            © 2026 Shelon. All rights reserved.
                        </div>
                    </div>
                </div>

                {/* Import Premium Font */}
                <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
    `}</style>
            </footer>


            {/* Sale Details Modal - Premium Enhanced */}
            {selectedSale && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedSale(null)}
                >
                    <div
                        className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530] flex items-center justify-between rounded-t-2xl">
                            <div>
                                <h3 className="text-2xl font-bold text-white">Sale Details</h3>
                                <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                                    {selectedSale.transaction_id ? (
                                        <>
                                            <Hash className="h-4 w-4" />
                                            Transaction ID: {selectedSale.transaction_id}
                                        </>
                                    ) : (
                                        `Sale ID: ${selectedSale.id.slice(0, 8)}`
                                    )}
                                </p>
                            </div>
                            <button
                                className="p-2 rounded-lg hover:bg-[#1e2b38] text-slate-400 hover:text-white transition-colors"
                                onClick={() => setSelectedSale(null)}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-5">
                            {/* Customer & Payment Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gradient-to-br from-[#1e2b38] to-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-[#137fec]/10 rounded-lg">
                                            <User className="h-4 w-4 text-[#137fec]" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-400">Customer</p>
                                    </div>
                                    <p className="font-bold text-lg text-white">{selectedSale.customer_name}</p>
                                </div>

                                <div className="p-4 bg-gradient-to-br from-[#1e2b38] to-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-[#137fec]/10 rounded-lg">
                                            <CreditCard className="h-4 w-4 text-[#137fec]" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-400">Payment Method</p>
                                    </div>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                        selectedSale.payment_type === "CASH"
                                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                    }`}>
                                        {selectedSale.payment_type}
                                    </span>
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="p-4 bg-gradient-to-br from-[#1e2b38] to-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-[#137fec]/10 rounded-lg">
                                        <Calendar className="h-4 w-4 text-[#137fec]" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-400">Transaction Date</p>
                                </div>
                                <p className="font-semibold text-white">
                                    {formatDate(selectedSale.transaction_date)} at {formatTime(selectedSale.transaction_date)}
                                </p>
                            </div>

                            {/* Items */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 bg-[#137fec]/10 rounded-lg">
                                        <Package className="h-5 w-5 text-[#137fec]" />
                                    </div>
                                    <h4 className="font-bold text-lg text-white">Items Sold</h4>
                                </div>
                                <div className="space-y-2">
                                    {selectedSale.sale_items?.map((item: any, index: number) => (
                                        <div
                                            key={index}
                                            className="p-4 bg-gradient-to-br from-[#1e2b38] to-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl flex items-center justify-between hover:border-[#137fec]/30 transition-colors"
                                        >
                                            <div>
                                                <p className="font-semibold text-white mb-1">{item.product_name}</p>
                                                <p className="text-sm text-slate-400">
                                                    {item.quantity} × Rs {item.unit_price.toLocaleString()}
                                                </p>
                                            </div>
                                            <p className="font-bold text-xl text-white">
                                                Rs {item.total_price.toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="p-5 bg-gradient-to-br from-[#137fec] to-blue-600 rounded-xl shadow-lg shadow-[#137fec]/20">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-semibold text-white">Total Amount</span>
                                    <span className="text-4xl font-bold text-white">
                                        Rs {selectedSale.total_amount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
