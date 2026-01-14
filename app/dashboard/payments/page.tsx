"use client";

import { useState, useMemo, useEffect } from "react";
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
    CreditCard,
    Search,
    DollarSign,
    User,
    Calendar,
    CheckCircle,
    X,
    Banknote,
    Building2,
    Hash,
} from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { usePayments } from "@/hooks/usePayments";
import { paymentsService } from "@/services/paymentsService";
import { salesService } from "@/services/salesService";

export default function PaymentsPage() {
    const { customers, loading: customersLoading, refetch: refetchCustomers } = useCustomers();
    const { payments, loading: paymentsLoading, refetch: refetchPayments } = usePayments();

    const [searchQuery, setSearchQuery] = useState("");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

    // Filter customers with credit balance
    const customersWithCredit = useMemo(() => {
        return customers.filter(c => c.credit_balance > 0);
    }, [customers]);

    // Filter customers based on search
    const filteredCustomers = useMemo(() => {
        if (!searchQuery) return customersWithCredit;
        return customersWithCredit.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [customersWithCredit, searchQuery]);

    // Calculate summary
    const summary = useMemo(() => {
        const totalOutstanding = customersWithCredit.reduce((sum, c) => sum + c.credit_balance, 0);
        const todayPayments = payments
            .filter(p => {
                const paymentDate = new Date(p.payment_date);
                const today = new Date();
                return paymentDate.toDateString() === today.toDateString();
            })
            .reduce((sum, p) => sum + p.amount, 0);

        return {
            totalOutstanding,
            customersWithDebt: customersWithCredit.length,
            todayPayments,
            totalPayments: payments.length
        };
    }, [customersWithCredit, payments]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            Pay Debt
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Record debt payments from customers
                        </p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <Card className="border-none shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-red-50">
                                Total Outstanding
                            </CardTitle>
                            <DollarSign className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                Rs {summary.totalOutstanding.toLocaleString()}
                            </div>
                            <p className="text-xs text-red-100 mt-1">
                                {summary.customersWithDebt} customers
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-50">
                                Today's Payments
                            </CardTitle>
                            <CheckCircle className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                Rs {summary.todayPayments.toLocaleString()}
                            </div>
                            <p className="text-xs text-green-100 mt-1">
                                Collected today
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-50">
                                Total Payments
                            </CardTitle>
                            <Calendar className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {summary.totalPayments}
                            </div>
                            <p className="text-xs text-blue-100 mt-1">
                                All time
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-purple-50">
                                Avg Debt
                            </CardTitle>
                            <User className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                Rs {summary.customersWithDebt > 0 ? Math.round(summary.totalOutstanding / summary.customersWithDebt).toLocaleString() : 0}
                            </div>
                            <p className="text-xs text-purple-100 mt-1">
                                Per customer
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Customers with Debt */}
                    <Card className="shadow-lg border-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Customers with Outstanding Debt
                            </CardTitle>
                            <CardDescription>
                                {filteredCustomers.length} customers with debt
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Search */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search customers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            {/* Customer List */}
                            {customersLoading ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    Loading customers...
                                </div>
                            ) : filteredCustomers.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No outstanding debts!</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {filteredCustomers.map((customer) => (
                                        <div
                                            key={customer.id}
                                            className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors border-2 border-transparent hover:border-blue-500"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                                                        <User className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-base">{customer.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Outstanding Debt
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                                                        Rs {customer.credit_balance.toLocaleString()}
                                                    </p>
                                                    <Button
                                                        size="sm"
                                                        className="mt-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                                        onClick={() => {
                                                            setSelectedCustomer(customer);
                                                            setShowPaymentModal(true);
                                                        }}
                                                    >
                                                        Pay Now
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Payments */}
                    <Card className="shadow-lg border-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Recent Payments
                            </CardTitle>
                            <CardDescription>
                                Latest debt payments recorded
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {paymentsLoading ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    Loading payments...
                                </div>
                            ) : payments.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No payments recorded yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {payments.slice(0, 10).map((payment: any) => (
                                        <div
                                            key={payment.id}
                                            className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                                                        <CheckCircle className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">
                                                            {payment.customers?.name || "Unknown"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDate(payment.payment_date)}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-xs">
                                                                {payment.payment_method}
                                                            </Badge>
                                                            {payment.sales?.transaction_id && (
                                                                <Badge variant="secondary" className="text-xs font-mono">
                                                                    #{payment.sales.transaction_id}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                                        Rs {payment.amount.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            {payment.notes && (
                                                <p className="text-xs text-muted-foreground mt-2 pl-13">
                                                    Note: {payment.notes}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedCustomer && (
                <PaymentModal
                    customer={selectedCustomer}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setSelectedCustomer(null);
                    }}
                    onSuccess={() => {
                        refetchCustomers();
                        refetchPayments();
                        setShowPaymentModal(false);
                        setSelectedCustomer(null);
                    }}
                />
            )}
        </div>
    );
}

// Payment Modal Component
function PaymentModal({
                          customer,
                          onClose,
                          onSuccess
                      }: {
    customer: any;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "CARD">("CASH");
    const [selectedSale, setSelectedSale] = useState<string>("general");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [creditSales, setCreditSales] = useState<any[]>([]);
    const [loadingSales, setLoadingSales] = useState(true);

    // Fetch customer's credit sales
    useEffect(() => {
        async function fetchCreditSales() {
            setLoadingSales(true);
            const { data } = await salesService.getCreditSalesByCustomer(customer.id);
            setCreditSales(data || []);
            setLoadingSales(false);
        }
        fetchCreditSales();
    }, [customer.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const paymentAmount = parseFloat(amount);

        if (!paymentAmount || paymentAmount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        if (paymentAmount > customer.credit_balance) {
            alert(`Payment amount cannot exceed debt amount of Rs ${customer.credit_balance.toLocaleString()}`);
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await paymentsService.recordPayment({
                customer_id: customer.id,
                sale_id: selectedSale === "general" ? undefined : selectedSale,
                amount: paymentAmount,
                payment_method: paymentMethod,
                notes: notes.trim() || undefined
            });

            if (error) throw error;

            alert(`Payment of Rs ${paymentAmount.toLocaleString()} recorded successfully!`);
            onSuccess();
        } catch (error) {
            console.error("Error recording payment:", error);
            alert("Failed to record payment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <Card
                className="max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Record Payment</CardTitle>
                            <CardDescription className="mt-1">
                                {customer.name}
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="pt-6 space-y-4">
                        {/* Current Debt */}
                        <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border-2 border-red-200 dark:border-red-800">
                            <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                                Current Outstanding Debt
                            </p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                Rs {customer.credit_balance.toLocaleString()}
                            </p>
                        </div>

                        {/* Transaction Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Transaction (Optional)
                            </label>
                            {loadingSales ? (
                                <div className="text-sm text-muted-foreground p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    Loading transactions...
                                </div>
                            ) : creditSales.length > 0 ? (
                                <Select value={selectedSale} onValueChange={setSelectedSale}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a transaction" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">
                                            <span className="text-muted-foreground">General Payment (No specific transaction)</span>
                                        </SelectItem>
                                        {creditSales.map((sale) => (
                                            <SelectItem key={sale.id} value={sale.id}>
                                                <div className="flex items-center gap-2 py-1">
                                                    <Hash className="h-3 w-3" />
                                                    <span className="font-mono text-xs font-semibold">
                                                        {sale.transaction_id || sale.id.slice(0, 8)}
                                                    </span>
                                                    <span className="text-xs">-</span>
                                                    <span className="text-xs font-semibold text-orange-600">
                                                        Rs {sale.total_amount.toLocaleString()}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ({formatDate(sale.transaction_date)})
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="text-sm text-muted-foreground p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    No credit transactions found for this customer
                                </div>
                            )}
                        </div>

                        {/* Payment Amount */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Payment Amount (Rs) <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="number"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={isSubmitting}
                                min="0"
                                max={customer.credit_balance}
                                step="0.01"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Maximum: Rs {customer.credit_balance.toLocaleString()}
                            </p>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Payment Method</label>
                            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">
                                        <div className="flex items-center gap-2">
                                            <Banknote className="h-4 w-4" />
                                            Cash
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="BANK_TRANSFER">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            Bank Transfer
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="CARD">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            Card
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                            <Input
                                placeholder="Add any notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Preview */}
                        {amount && parseFloat(amount) > 0 && (
                            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border-2 border-green-200 dark:border-green-800">
                                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                                    Remaining Balance After Payment
                                </p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    Rs {(customer.credit_balance - parseFloat(amount)).toLocaleString()}
                                </p>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Recording..." : "Record Payment"}
                            </Button>
                        </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
