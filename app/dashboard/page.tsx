"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    Moon,
    Sun
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSalesSummary, useTodaySales } from '@/hooks/useSales';
import { useLowStockProducts } from '@/hooks/useProducts';
import { useCustomersWithCredit } from '@/hooks/useCustomers';

export default function DashboardPage() {
    const [isDark, setIsDark] = useState(false);

    // Fetch real data from Supabase
    const { summary, loading: summaryLoading } = useSalesSummary();
    const { sales: todaySales, loading: todayLoading } = useTodaySales();
    const { products: lowStock, loading: stockLoading } = useLowStockProducts();
    const { customers: creditCustomers, loading: customersLoading } = useCustomersWithCredit();

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        setIsDark(!isDark);
        if (!isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

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

    // Format time for recent sales
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    // Get recent sales (last 3)
    const recentSales = todaySales.slice(0, 3);

    // Get top 3 debtors
    const topDebtors = creditCustomers
        .sort((a, b) => b.credit_balance - a.credit_balance)
        .slice(0, 3);

    return (
        <div className="flex flex-col gap-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back! Here's your business overview.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-full"
                    >
                        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                    <Link href="/dashboard/sales/new">
                        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            New Sale
                        </Button>
                    </Link>
                    <Link href="/dashboard/inventory">
                        <Button variant="outline" className="shadow-md">
                            <Plus className="mr-2 h-4 w-4" />
                            Manage Stock
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards with Premium Design */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white transform transition hover:scale-105">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-50">Today's Sales</CardTitle>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {todayLoading ? '...' : `Rs ${todayTotal.toLocaleString()}`}
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-blue-100">
                            <span>Cash: Rs {todayCash.toLocaleString()}</span>
                            <span>Credit: Rs {todayCredit.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white transform transition hover:scale-105">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-50">Outstanding Credit</CardTitle>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {customersLoading ? '...' : `Rs ${outstandingCredit.toLocaleString()}`}
                        </div>
                        <p className="text-xs text-purple-100 mt-2">
                            Total receivables from customers
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white transform transition hover:scale-105">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-50">Low Stock Alerts</CardTitle>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {stockLoading ? '...' : lowStock.length}
                        </div>
                        <p className="text-xs text-orange-100 mt-2">
                            Items need restocking
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white transform transition hover:scale-105">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-50">Today's Transactions</CardTitle>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <ShoppingCart className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {todayLoading ? '...' : todaySales.length}
                        </div>
                        <p className="text-xs text-green-100 mt-2">
                            Sales completed today
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content - Two Columns */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Sales */}
                <Card className="col-span-4 shadow-lg border-none dark:bg-gray-900/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-xl">Recent Sales</CardTitle>
                        <CardDescription>Latest transactions from today</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {todayLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading...</div>
                        ) : recentSales.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No sales today yet</div>
                        ) : (
                            <div className="space-y-4">
                                {recentSales.map((sale) => (
                                    <div
                                        key={sale.id}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                                                <ShoppingCart className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{sale.customer_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatTime(sale.transaction_date)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant={sale.payment_type === "CASH" ? "default" : "secondary"}
                                                className="shadow-sm"
                                            >
                                                {sale.payment_type}
                                            </Badge>
                                            <span className="text-sm font-bold">Rs {sale.total_amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                                <Link href="/dashboard/sales" className="flex items-center justify-center pt-2">
                                    <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-950">
                                        View all sales
                                        <ArrowUpRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Debtors */}
                <Card className="col-span-3 shadow-lg border-none dark:bg-gray-900/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-xl">Top Debtors</CardTitle>
                        <CardDescription>Customers with highest outstanding</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {customersLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading...</div>
                        ) : topDebtors.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No outstanding credit</div>
                        ) : (
                            <div className="space-y-4">
                                {topDebtors.map((debtor, index) => (
                                    <div
                                        key={debtor.id}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-sm font-bold text-white shadow-lg">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{debtor.name}</p>
                                                <p className="text-xs text-muted-foreground">Outstanding balance</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                            Rs {debtor.credit_balance.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                                <Link href="/dashboard/customers" className="flex items-center justify-center pt-2">
                                    <Button variant="ghost" size="sm" className="hover:bg-orange-50 dark:hover:bg-orange-950">
                                        View all customers
                                        <ArrowUpRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Low Stock Alert - Premium Version */}
            {!stockLoading && lowStock.length > 0 && (
                <Card className="border-2 border-orange-200 dark:border-orange-900 shadow-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500 rounded-lg shadow-lg">
                                <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-orange-900 dark:text-orange-200">Low Stock Items</CardTitle>
                                <CardDescription>These products are below minimum threshold</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            {lowStock.slice(0, 6).map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between rounded-xl border-2 border-orange-200 dark:border-orange-800 bg-white dark:bg-gray-900 p-4 shadow-md hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                                            <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Stock: <span className="font-bold text-orange-600">{product.stock}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {lowStock.length > 6 && (
                            <Link href="/dashboard/inventory" className="flex items-center justify-center pt-4">
                                <Button variant="ghost" size="sm" className="hover:bg-orange-50 dark:hover:bg-orange-950">
                                    View all low stock items ({lowStock.length})
                                    <ArrowUpRight className="ml-1 h-4 w-4" />
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
