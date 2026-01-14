"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    BarChart3,
    TrendingUp,
    Download,
    Calendar,
    DollarSign,
    ShoppingCart,
    Users,
    Package,
    CreditCard,
    Banknote,
} from "lucide-react";
import { useSales } from "@/hooks/useSales";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";

export default function ReportsPage() {
    const { sales, loading: salesLoading } = useSales();
    const { customers, loading: customersLoading } = useCustomers();
    const { products, loading: productsLoading } = useProducts();

    const [dateRange, setDateRange] = useState("month"); // today, week, month, year, all
    const [reportType, setReportType] = useState("sales"); // sales, customers, products

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
        const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

        // Group by customer
        const customerSales = new Map();
        filteredSales.forEach((sale) => {
            const current = customerSales.get(sale.customer_id) || 0;
            customerSales.set(sale.customer_id, current + sale.total_amount);
        });

        const topCustomers = Array.from(customerSales.entries())
            .map(([id, amount]) => ({
                id,
                name: filteredSales.find((s) => s.customer_id === id)?.customer_name || "",
                amount,
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        return {
            totalSales,
            totalTransactions,
            cashSales,
            creditSales,
            avgTransaction,
            topCustomers,
        };
    }, [filteredSales]);

    // Product Analytics
    const productAnalytics = useMemo(() => {
        const productSales = new Map();

        filteredSales.forEach((sale) => {
            sale.sale_items?.forEach((item: any) => {
                const current = productSales.get(item.product_id) || { quantity: 0, revenue: 0 };
                productSales.set(item.product_id, {
                    quantity: current.quantity + item.quantity,
                    revenue: current.revenue + item.total_price,
                    name: item.product_name,
                });
            });
        });

        const topProducts = Array.from(productSales.entries())
            .map(([id, data]) => ({
                id,
                name: data.name,
                quantity: data.quantity,
                revenue: data.revenue,
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return { topProducts };
    }, [filteredSales]);

    // Customer Analytics
    const customerAnalytics = useMemo(() => {
        const totalCustomers = customers.length;
        const customersWithCredit = customers.filter((c) => c.credit_balance > 0).length;
        const totalCredit = customers.reduce((sum, c) => sum + c.credit_balance, 0);
        const avgCredit = totalCustomers > 0 ? totalCredit / totalCustomers : 0;

        return {
            totalCustomers,
            customersWithCredit,
            totalCredit,
            avgCredit,
        };
    }, [customers]);

    // Inventory Analytics
    const inventoryAnalytics = useMemo(() => {
        const totalProducts = products.length;
        const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
        const lowStock = products.filter((p) => p.stock <= 20 && p.stock > 0).length;
        const outOfStock = products.filter((p) => p.stock === 0).length;

        return {
            totalProducts,
            totalStock,
            lowStock,
            outOfStock,
        };
    }, [products]);

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
            productAnalytics.topProducts.forEach((product) => {
                csvContent += `${product.name},${product.quantity},${product.revenue}\n`;
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            Reports & Analytics
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            View detailed business insights and analytics
                        </p>
                    </div>
                    <Button
                        onClick={exportToCSV}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                    </Button>
                </div>

                {/* Filters */}
                <Card className="shadow-lg border-none mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Report Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Date Range Filter */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Date Range</label>
                                <Select value={dateRange} onValueChange={setDateRange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="week">Last 7 Days</SelectItem>
                                        <SelectItem value="month">Last 30 Days</SelectItem>
                                        <SelectItem value="year">Last Year</SelectItem>
                                        <SelectItem value="all">All Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Report Type Filter */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Report Type</label>
                                <Select value={reportType} onValueChange={setReportType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sales">Sales Report</SelectItem>
                                        <SelectItem value="products">Product Performance</SelectItem>
                                        <SelectItem value="customers">Customer Report</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="text-center py-12 text-muted-foreground">
                        Loading reports...
                    </div>
                ) : (
                    <>
                        {/* Sales Report */}
                        {reportType === "sales" && (
                            <>
                                {/* Sales Summary Cards */}
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                                    <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-blue-50">
                                                Total Sales
                                            </CardTitle>
                                            <DollarSign className="h-4 w-4" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                Rs {salesAnalytics.totalSales.toLocaleString()}
                                            </div>
                                            <p className="text-xs text-blue-100 mt-1">
                                                {salesAnalytics.totalTransactions} transactions
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
                                                Rs {salesAnalytics.cashSales.toLocaleString()}
                                            </div>
                                            <p className="text-xs text-green-100 mt-1">
                                                {filteredSales.filter((s) => s.payment_type === "CASH").length} transactions
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
                                                Rs {salesAnalytics.creditSales.toLocaleString()}
                                            </div>
                                            <p className="text-xs text-orange-100 mt-1">
                                                {filteredSales.filter((s) => s.payment_type === "CREDIT").length} transactions
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-purple-50">
                                                Avg Transaction
                                            </CardTitle>
                                            <ShoppingCart className="h-4 w-4" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                Rs {Math.round(salesAnalytics.avgTransaction).toLocaleString()}
                                            </div>
                                            <p className="text-xs text-purple-100 mt-1">
                                                Per sale
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Top Customers */}
                                <Card className="shadow-lg border-none">
                                    <CardHeader>
                                        <CardTitle>Top Customers</CardTitle>
                                        <CardDescription>
                                            Highest revenue customers in selected period
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {salesAnalytics.topCustomers.map((customer, index) => (
                                                <div
                                                    key={customer.id}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white shadow-lg">
                                                            {index + 1}
                                                        </div>
                                                        <p className="font-semibold">{customer.name}</p>
                                                    </div>
                                                    <span className="font-bold text-lg">
                                                        Rs {customer.amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {/* Product Performance Report */}
                        {reportType === "products" && (
                            <>
                                {/* Inventory Summary Cards */}
                                <div className="grid gap-4 md:grid-cols-4 mb-6">
                                    <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-blue-50">
                                                Total Products
                                            </CardTitle>
                                            <Package className="h-4 w-4" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {inventoryAnalytics.totalProducts}
                                            </div>
                                            <p className="text-xs text-blue-100 mt-1">
                                                Active products
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-green-50">
                                                Total Stock
                                            </CardTitle>
                                            <TrendingUp className="h-4 w-4" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {inventoryAnalytics.totalStock.toLocaleString()}
                                            </div>
                                            <p className="text-xs text-green-100 mt-1">
                                                Total units
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-orange-50">
                                                Low Stock
                                            </CardTitle>
                                            <Package className="h-4 w-4" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {inventoryAnalytics.lowStock}
                                            </div>
                                            <p className="text-xs text-orange-100 mt-1">
                                                Items below 20
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-red-50">
                                                Out of Stock
                                            </CardTitle>
                                            <Package className="h-4 w-4" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {inventoryAnalytics.outOfStock}
                                            </div>
                                            <p className="text-xs text-red-100 mt-1">
                                                Items at 0
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Top Products */}
                                <Card className="shadow-lg border-none">
                                    <CardHeader>
                                        <CardTitle>Top Selling Products</CardTitle>
                                        <CardDescription>
                                            Best performing products by revenue
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {productAnalytics.topProducts.length === 0 ? (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    No product sales data for selected period
                                                </div>
                                            ) : (
                                                productAnalytics.topProducts.map((product, index) => (
                                                    <div
                                                        key={product.id}
                                                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500 text-sm font-bold text-white shadow-lg">
                                                                {index + 1}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold">{product.name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {product.quantity} units sold
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="font-bold text-lg">
                                                            Rs {product.revenue.toLocaleString()}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {/* Customer Report */}
                        {reportType === "customers" && (
                            <>
                                {/* Customer Summary Cards */}
                                <div className="grid gap-4 md:grid-cols-4 mb-6">
                                    <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-blue-50">
                                                Total Customers
                                            </CardTitle>
                                            <Users className="h-4 w-4" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {customerAnalytics.totalCustomers}
                                            </div>
                                            <p className="text-xs text-blue-100 mt-1">
                                                Active accounts
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-orange-50">
                                                With Credit
                                            </CardTitle>
                                            <CreditCard className="h-4 w-4" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {customerAnalytics.customersWithCredit}
                                            </div>
                                            <p className="text-xs text-orange-100 mt-1">
                                                Have outstanding
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-red-50">
                                                Total Outstanding
                                            </CardTitle>
                                            <DollarSign className="h-4 w-4" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                Rs {customerAnalytics.totalCredit.toLocaleString()}
                                            </div>
                                            <p className="text-xs text-red-100 mt-1">
                                                To be collected
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-purple-50">
                                                Avg Credit
                                            </CardTitle>
                                            <TrendingUp className="h-4 w-4" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                Rs {Math.round(customerAnalytics.avgCredit).toLocaleString()}
                                            </div>
                                            <p className="text-xs text-purple-100 mt-1">
                                                Per customer
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Customers with Credit */}
                                <Card className="shadow-lg border-none">
                                    <CardHeader>
                                        <CardTitle>Customers with Outstanding Credit</CardTitle>
                                        <CardDescription>
                                            All customers with pending payments
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {customers
                                                .filter((c) => c.credit_balance > 0)
                                                .sort((a, b) => b.credit_balance - a.credit_balance)
                                                .map((customer) => (
                                                    <div
                                                        key={customer.id}
                                                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                                                                <Users className="h-5 w-5 text-white" />
                                                            </div>
                                                            <p className="font-semibold">{customer.name}</p>
                                                        </div>
                                                        <Badge variant="destructive" className="text-sm font-bold">
                                                            Rs {customer.credit_balance.toLocaleString()}
                                                        </Badge>
                                                    </div>
                                                ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
