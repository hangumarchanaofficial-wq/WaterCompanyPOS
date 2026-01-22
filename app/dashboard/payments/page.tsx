"use client";

import { useState, useMemo, useEffect } from "react";
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
    ArrowLeft,
    ArrowUpRight,
    TrendingUp,
    CheckCircle2,
    Plus
} from "lucide-react";
import Link from "next/link";
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
                                <h2 className="text-2xl font-bold text-white tracking-tight">Pay Debt</h2>
                                <p className="text-slate-400 text-sm mt-1">Record debt payments from customers</p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-4 mb-6">
                        <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 bg-red-500/10 rounded-lg">
                                    <DollarSign className="h-5 w-5 text-red-500" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mb-1">Total Outstanding</p>
                            <div className="text-3xl font-bold text-white mb-1">
                                Rs {summary.totalOutstanding.toLocaleString()}
                            </div>
                            <p className="text-xs text-slate-500">{summary.customersWithDebt} customers</p>
                        </div>

                        <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mb-1">Today's Payments</p>
                            <div className="text-3xl font-bold text-white mb-1">
                                Rs {summary.todayPayments.toLocaleString()}
                            </div>
                            <p className="text-xs text-slate-500">Collected today</p>
                        </div>

                        <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 bg-[#137fec]/10 rounded-lg">
                                    <Calendar className="h-5 w-5 text-[#137fec]" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mb-1">Total Payments</p>
                            <div className="text-3xl font-bold text-white mb-1">
                                {summary.totalPayments}
                            </div>
                            <p className="text-xs text-slate-500">All time</p>
                        </div>

                        <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 bg-purple-500/10 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-purple-500" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mb-1">Avg Debt</p>
                            <div className="text-3xl font-bold text-white mb-1">
                                Rs {summary.customersWithDebt > 0 ? Math.round(summary.totalOutstanding / summary.customersWithDebt).toLocaleString() : 0}
                            </div>
                            <p className="text-xs text-slate-500">Per customer</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Customers with Debt */}
                        <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#137fec]/10 rounded-lg">
                                        <User className="h-5 w-5 text-[#137fec]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Customers with Outstanding Debt</h3>
                                        <p className="text-sm text-slate-400">
                                            {filteredCustomers.length} customers with debt
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                {/* Search */}
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search customers..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all"
                                    />
                                </div>

                                {/* Customer List */}
                                {customersLoading ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#137fec] border-r-transparent mb-4"></div>
                                        <p>Loading customers...</p>
                                    </div>
                                ) : filteredCustomers.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <div className="inline-block p-4 bg-[#1e2b38] rounded-full mb-4">
                                            <CheckCircle className="h-12 w-12 opacity-50" />
                                        </div>
                                        <p className="text-sm">No outstanding debts!</p>
                                        <p className="text-xs mt-1">All customers have paid</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                        {filteredCustomers.map((customer) => (
                                            <div
                                                key={customer.id}
                                                className="p-4 rounded-xl bg-[#1a2530] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                                                            <User className="h-6 w-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-base text-white">{customer.name}</p>
                                                            <p className="text-sm text-slate-400">
                                                                Outstanding Debt
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-bold text-red-400 mb-2">
                                                            Rs {customer.credit_balance.toLocaleString()}
                                                        </p>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCustomer(customer);
                                                                setShowPaymentModal(true);
                                                            }}
                                                            className="px-3 py-1.5 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-lg text-white text-sm font-medium shadow-lg transition-all"
                                                        >
                                                            Pay Now
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Payments */}
                        <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#137fec]/10 rounded-lg">
                                        <Calendar className="h-5 w-5 text-[#137fec]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Recent Payments</h3>
                                        <p className="text-sm text-slate-400">
                                            Latest debt payments recorded
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                {paymentsLoading ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#137fec] border-r-transparent mb-4"></div>
                                        <p>Loading payments...</p>
                                    </div>
                                ) : payments.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <div className="inline-block p-4 bg-[#1e2b38] rounded-full mb-4">
                                            <CreditCard className="h-12 w-12 opacity-50" />
                                        </div>
                                        <p className="text-sm">No payments recorded yet</p>
                                        <p className="text-xs mt-1">Start recording payments</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                        {payments.slice(0, 10).map((payment: any) => (
                                            <div
                                                key={payment.id}
                                                className="p-4 rounded-xl bg-[#1a2530] border border-[rgba(255,255,255,0.1)]"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                                                            <CheckCircle className="h-5 w-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-white">
                                                                {payment.customers?.name || "Unknown"}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                {formatDate(payment.payment_date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-emerald-400">
                                                            Rs {payment.amount.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 pl-13">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-lg">
                                                        <span className="text-xs text-slate-400">
                                                            {payment.payment_method}
                                                        </span>
                                                    </div>
                                                    {payment.sales?.transaction_id && (
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-lg">
                                                            <Hash className="h-3 w-3 text-slate-500" />
                                                            <span className="text-xs text-slate-400 font-mono">
                                                                {payment.sales.transaction_id}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {payment.notes && (
                                                    <p className="text-xs text-slate-500 mt-2 pl-13 italic">
                                                        Note: {payment.notes}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-[#16212b] border-t border-[rgba(255,255,255,0.1)] mt-auto">
                <div className="max-w-[1600px] mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-br from-[#137fec] to-blue-600 rounded-lg w-8 h-8 flex items-center justify-center">
                                <CreditCard className="h-4 w-4 text-white" />
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="max-w-2xl w-full bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white">Record Payment</h3>
                            <p className="text-sm text-slate-400 mt-1">{customer.name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-[#1e2b38] hover:bg-[#253544] text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        {/* Current Debt */}
                        <div className="p-5 bg-red-500/10 border-2 border-red-500/30 rounded-xl">
                            <p className="text-sm font-medium text-red-400 mb-2">
                                Current Outstanding Debt
                            </p>
                            <p className="text-3xl font-bold text-red-400">
                                Rs {customer.credit_balance.toLocaleString()}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Payment Amount */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Payment Amount (Rs) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    disabled={isSubmitting}
                                    min="0"
                                    max={customer.credit_balance}
                                    step="0.01"
                                    className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all disabled:opacity-50"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Maximum: Rs {customer.credit_balance.toLocaleString()}
                                </p>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                                    className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all"
                                >
                                    <option value="CASH">💵 Cash</option>
                                    <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                                    <option value="CARD">💳 Card</option>
                                </select>
                            </div>
                        </div>

                        {/* Transaction Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Transaction (Optional)
                            </label>
                            {loadingSales ? (
                                <div className="text-sm text-slate-400 p-3 bg-[#1e2b38] rounded-lg">
                                    Loading transactions...
                                </div>
                            ) : creditSales.length > 0 ? (
                                <select
                                    value={selectedSale}
                                    onChange={(e) => setSelectedSale(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all"
                                >
                                    <option value="general">General Payment (No specific transaction)</option>
                                    {creditSales.map((sale) => (
                                        <option key={sale.id} value={sale.id}>
                                            #{sale.transaction_id || sale.id.slice(0, 8)} - Rs {sale.total_amount.toLocaleString()} ({formatDate(sale.transaction_date)})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="text-sm text-slate-400 p-3 bg-[#1e2b38] rounded-lg">
                                    No credit transactions found for this customer
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Notes (Optional)</label>
                            <textarea
                                placeholder="Add any notes about this payment..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={isSubmitting}
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all disabled:opacity-50 resize-none"
                            />
                        </div>

                        {/* Preview */}
                        {amount && parseFloat(amount) > 0 && (
                            <div className="p-5 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl">
                                <p className="text-sm font-medium text-emerald-400 mb-2">
                                    Remaining Balance After Payment
                                </p>
                                <p className="text-3xl font-bold text-emerald-400">
                                    Rs {(customer.credit_balance - parseFloat(amount)).toLocaleString()}
                                </p>
                                {(customer.credit_balance - parseFloat(amount)) === 0 && (
                                    <div className="mt-3 flex items-center gap-2 text-emerald-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-sm font-semibold">Debt will be fully paid!</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] hover:bg-[#253544] text-white font-medium transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                                        Recording...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4" />
                                        Record Payment
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
