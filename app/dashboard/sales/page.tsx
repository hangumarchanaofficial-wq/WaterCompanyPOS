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
    Download,
    TrendingUp,
    CreditCard,
    Banknote,
    X,
    User,
    Package,
    Hash
} from "lucide-react";
import Link from "next/link";
import { useSales } from "@/hooks/useSales";

export default function SalesPage() {
    const { sales, loading } = useSales();

    const [searchQuery, setSearchQuery] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [selectedSale, setSelectedSale] = useState<any>(null);

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            Sales History
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            View and manage all sales transactions
                        </p>
                    </div>
                    <Link href="/dashboard/sales/new">
                        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
                            <DollarSign className="mr-2 h-4 w-4" />
                            New Sale
                        </Button>
                    </Link>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-50">
                                Total Sales
                            </CardTitle>
                            <TrendingUp className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                Rs {summary.total.toLocaleString()}
                            </div>
                            <p className="text-xs text-blue-100 mt-1">
                                {summary.count} transactions
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-50">
                                Cash Sales
                            </CardTitle>
                            <Banknote className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                Rs {summary.cash.toLocaleString()}
                            </div>
                            <p className="text-xs text-green-100 mt-1">
                                {filteredSales.filter(s => s.payment_type === "CASH").length} transactions
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-50">
                                Credit Sales
                            </CardTitle>
                            <CreditCard className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                Rs {summary.credit.toLocaleString()}
                            </div>
                            <p className="text-xs text-orange-100 mt-1">
                                {filteredSales.filter(s => s.payment_type === "CREDIT").length} transactions
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-purple-50">
                                Average Sale
                            </CardTitle>
                            <DollarSign className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                Rs {summary.count > 0 ? Math.round(summary.total / summary.count).toLocaleString() : 0}
                            </div>
                            <p className="text-xs text-purple-100 mt-1">
                                Per transaction
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="shadow-lg border-none mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters & Search
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by customer, transaction ID, or sale ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Payment Type Filter */}
                            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                                <SelectTrigger>
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
                                <SelectTrigger>
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
                            <div className="flex items-center gap-2 mt-4">
                                <span className="text-sm text-muted-foreground">Active filters:</span>
                                {searchQuery && (
                                    <Badge variant="secondary" className="gap-1">
                                        Search: {searchQuery}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                                    </Badge>
                                )}
                                {paymentFilter !== "all" && (
                                    <Badge variant="secondary" className="gap-1">
                                        {paymentFilter}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => setPaymentFilter("all")} />
                                    </Badge>
                                )}
                                {dateFilter !== "all" && (
                                    <Badge variant="secondary" className="gap-1">
                                        {dateFilter === "today" ? "Today" : dateFilter === "week" ? "Last 7 Days" : "Last 30 Days"}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => setDateFilter("all")} />
                                    </Badge>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sales List */}
                <Card className="shadow-lg border-none">
                    <CardHeader>
                        <CardTitle>Sales Transactions</CardTitle>
                        <CardDescription>
                            Showing {filteredSales.length} of {sales.length} sales
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Loading sales...
                            </div>
                        ) : filteredSales.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No sales found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredSales.map((sale) => (
                                    <div
                                        key={sale.id}
                                        className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors border-2 border-transparent hover:border-blue-500 cursor-pointer"
                                        onClick={() => setSelectedSale(sale)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                {/* Icon */}
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg flex-shrink-0">
                                                    <DollarSign className="h-6 w-6 text-white" />
                                                </div>

                                                {/* Customer Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-base truncate">
                                                        {sale.customer_name}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                        {sale.transaction_id && (
                                                            <p className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded flex items-center gap-1">
                                                                <Hash className="h-3 w-3" />
                                                                {sale.transaction_id}
                                                            </p>
                                                        )}
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatDate(sale.transaction_date)}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatTime(sale.transaction_date)}
                                                        </p>
                                                        <Badge variant={sale.payment_type === "CASH" ? "default" : "secondary"} className="text-xs">
                                                            {sale.payment_type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Amount */}
                                            <div className="text-right">
                                                <p className="text-xl font-bold">
                                                    Rs {sale.total_amount.toLocaleString()}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {sale.sale_items?.length || 0} items
                                                </p>
                                            </div>

                                            {/* View Button */}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="ml-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSale(sale);
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Sale Details Modal */}
            {selectedSale && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedSale(null)}
                >
                    <Card
                        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl">Sale Details</CardTitle>
                                    <CardDescription className="mt-1 flex items-center gap-2">
                                        {selectedSale.transaction_id ? (
                                            <>
                                                <Hash className="h-4 w-4" />
                                                Transaction ID: {selectedSale.transaction_id}
                                            </>
                                        ) : (
                                            `Sale ID: ${selectedSale.id.slice(0, 8)}`
                                        )}
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedSale(null)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Customer & Payment Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                            Customer
                                        </p>
                                    </div>
                                    <p className="font-bold text-lg">{selectedSale.customer_name}</p>
                                </div>

                                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                            Payment Method
                                        </p>
                                    </div>
                                    <Badge variant={selectedSale.payment_type === "CASH" ? "default" : "secondary"}>
                                        {selectedSale.payment_type}
                                    </Badge>
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                    <p className="text-sm font-medium">Transaction Date</p>
                                </div>
                                <p className="font-semibold">
                                    {formatDate(selectedSale.transaction_date)} at {formatTime(selectedSale.transaction_date)}
                                </p>
                            </div>

                            {/* Items */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    <h3 className="font-bold text-lg">Items Sold</h3>
                                </div>
                                <div className="space-y-2">
                                    {selectedSale.sale_items?.map((item: any, index: number) => (
                                        <div
                                            key={index}
                                            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="font-semibold">{item.product_name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.quantity} × Rs {item.unit_price.toLocaleString()}
                                                </p>
                                            </div>
                                            <p className="font-bold">
                                                Rs {item.total_price.toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-semibold">Total Amount</span>
                                    <span className="text-3xl font-bold">
                                        Rs {selectedSale.total_amount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
