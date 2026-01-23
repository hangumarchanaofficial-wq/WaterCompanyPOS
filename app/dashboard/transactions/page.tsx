"use client";

import { useState, useMemo } from "react";
import {
    Receipt,
    Trash2,
    Search,
    ArrowLeft,
    AlertTriangle,
    Calendar,
    CreditCard,
    DollarSign,
    Package,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    AlertCircle,
    CheckCircle,
    Info
} from "lucide-react";
import Link from "next/link";
import { useSales } from "@/hooks/useSales";
import { deleteSale } from "@/services/salesService";

const ITEMS_PER_PAGE = 5;

interface CustomAlert {
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
}

export default function TransactionsPage() {
    const { sales, loading, refetch } = useSales();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Custom Alert State
    const [customAlert, setCustomAlert] = useState<CustomAlert>({
        show: false,
        type: 'info',
        title: '',
        message: ''
    });

    // Custom Alert Function
    const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
        setCustomAlert({ show: true, type, title, message });
    };

    const closeAlert = () => {
        setCustomAlert({ ...customAlert, show: false });
    };

    // Filter sales
    const filteredSales = useMemo(() => {
        let filtered = [...sales];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (sale) =>
                    sale.customer_name.toLowerCase().includes(query) ||
                    sale.id.toLowerCase().includes(query) ||
                    (sale.transaction_id && sale.transaction_id.toString().includes(searchQuery))
            );
        }

        return filtered.sort((a, b) =>
            new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
        );
    }, [sales, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentSales = filteredSales.slice(startIndex, endIndex);

    // Reset to page 1 when search changes
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleDeleteClick = (sale: any) => {
        setSelectedSale(sale);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedSale) return;

        setIsDeleting(true);
        try {
            const result = await deleteSale(selectedSale.id);

            if (result.error) {
                const errorMessage = typeof result.error === 'string'
                    ? result.error
                    : (result.error as any)?.message || 'Unknown error occurred';
                showAlert('error', 'Delete Failed', `Failed to delete transaction: ${errorMessage}`);
            } else {
                showAlert(
                    'success',
                    'Transaction Deleted!',
                    'Transaction deleted successfully! Stock and credit have been restored.'
                );
                setShowDeleteModal(false);
                setSelectedSale(null);
                refetch();
            }
        } catch (error) {
            console.error("Error deleting transaction:", error);
            showAlert('error', 'Unexpected Error', 'Failed to delete transaction. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
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
                                <h2 className="text-2xl font-bold text-white tracking-tight">
                                    Transaction Management
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    View and manage all transactions
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-3 mb-6">
                        <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-5 shadow-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-[#137fec]/10 rounded-lg">
                                    <Receipt className="h-5 w-5 text-[#137fec]" />
                                </div>
                                <p className="text-sm text-slate-400">Total Transactions</p>
                            </div>
                            <p className="text-3xl font-bold text-white">{sales.length}</p>
                        </div>

                        <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-5 shadow-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <DollarSign className="h-5 w-5 text-emerald-500" />
                                </div>
                                <p className="text-sm text-slate-400">Total Value</p>
                            </div>
                            <p className="text-3xl font-bold text-white">
                                Rs {sales.reduce((sum, s) => sum + s.total_amount, 0).toLocaleString()}
                            </p>
                        </div>

                        <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-5 shadow-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-orange-500/10 rounded-lg">
                                    <CreditCard className="h-5 w-5 text-orange-500" />
                                </div>
                                <p className="text-sm text-slate-400">Credit Sales</p>
                            </div>
                            <p className="text-3xl font-bold text-white">
                                {sales.filter(s => s.payment_type === 'CREDIT').length}
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl mb-6 p-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search by customer name, transaction ID, or UUID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Transactions List */}
                    <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#137fec]/10 rounded-lg">
                                        <Receipt className="h-5 w-5 text-[#137fec]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">All Transactions</h3>
                                        <p className="text-sm text-slate-400">
                                            {filteredSales.length} transaction(s) found
                                        </p>
                                    </div>
                                </div>
                                {filteredSales.length > 0 && (
                                    <div className="text-sm text-slate-400">
                                        Showing {startIndex + 1}-{Math.min(endIndex, filteredSales.length)} of {filteredSales.length}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6">
                            {loading ? (
                                <div className="text-center py-12 text-slate-400">
                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#137fec] border-r-transparent mb-4"></div>
                                    <p>Loading transactions...</p>
                                </div>
                            ) : filteredSales.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Receipt className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                    <p>No transactions found</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {currentSales.map((sale) => (
                                            <div
                                                key={sale.id}
                                                className="p-5 rounded-xl bg-[#1a2530] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#137fec] to-blue-600 shadow-lg">
                                                                <Receipt className="h-6 w-6 text-white" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-lg text-white">
                                                                    {sale.customer_name}
                                                                </h4>
                                                                <p className="text-xs text-slate-400 font-mono">
                                                                    {sale.transaction_id ? (
                                                                        <span>ID: {sale.transaction_id}</span>
                                                                    ) : (
                                                                        <span>UUID: {sale.id.substring(0, 8)}...</span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                                <div>
                                                                    <p className="text-xs text-slate-500">Date</p>
                                                                    <p className="text-sm text-white font-medium">
                                                                        {new Date(sale.transaction_date).toLocaleDateString()}
                                                                    </p>
                                                                    <p className="text-xs text-slate-400">
                                                                        {new Date(sale.transaction_date).toLocaleTimeString()}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <DollarSign className="h-4 w-4 text-slate-400" />
                                                                <div>
                                                                    <p className="text-xs text-slate-500">Amount</p>
                                                                    <p className="text-sm text-white font-bold">
                                                                        Rs {sale.total_amount.toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <CreditCard className="h-4 w-4 text-slate-400" />
                                                                <div>
                                                                    <p className="text-xs text-slate-500">Payment</p>
                                                                    <span
                                                                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                                                                            sale.payment_type === "CASH"
                                                                                ? "bg-emerald-500/10 text-emerald-500"
                                                                                : "bg-orange-500/10 text-orange-500"
                                                                        }`}
                                                                    >
                                                                        {sale.payment_type}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <Package className="h-4 w-4 text-slate-400" />
                                                                <div>
                                                                    <p className="text-xs text-slate-500">Items</p>
                                                                    <p className="text-sm text-white font-medium">
                                                                        {sale.sale_items?.length || 0} item(s)
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Sale Items Details */}
                                                        {sale.sale_items && sale.sale_items.length > 0 && (
                                                            <div className="pt-3 border-t border-[rgba(255,255,255,0.1)]">
                                                                <p className="text-xs text-slate-400 mb-2 font-semibold">
                                                                    Items Purchased:
                                                                </p>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                    {sale.sale_items.map((item: any, index: number) => (
                                                                        <div
                                                                            key={index}
                                                                            className="flex items-center justify-between p-2 rounded bg-[#16212b] border border-[rgba(255,255,255,0.05)]"
                                                                        >
                                                                            <span className="text-sm text-slate-300">
                                                                                {item.product_name}
                                                                            </span>
                                                                            <span className="text-sm text-white font-medium">
                                                                                {item.quantity}x @ Rs {item.unit_price}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => handleDeleteClick(sale)}
                                                        className="p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500 text-red-500 transition-all group flex-shrink-0"
                                                        title="Delete transaction"
                                                    >
                                                        <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-[rgba(255,255,255,0.1)]">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a2530] border border-[rgba(255,255,255,0.1)] text-white hover:bg-[#1e2b38] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                Previous
                                            </button>

                                            <div className="flex items-center gap-2">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() => handlePageChange(page)}
                                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                            currentPage === page
                                                                ? 'bg-[#137fec] text-white'
                                                                : 'bg-[#1a2530] border border-[rgba(255,255,255,0.1)] text-slate-400 hover:bg-[#1e2b38] hover:text-white'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a2530] border border-[rgba(255,255,255,0.1)] text-white hover:bg-[#1e2b38] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-[#16212b] border-t border-[rgba(255,255,255,0.08)] mt-auto">
                <div className="max-w-[1600px] mx-auto px-6" style={{ paddingTop: '29px', paddingBottom: '29px' }}>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div>
                                <h2 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                                    SHELON
                                </h2>
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
                            © 2026 Shelon. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedSale && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => !isDeleting && setShowDeleteModal(false)}
                >
                    <div
                        className="max-w-md w-full bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-red-500/10 to-orange-500/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <AlertTriangle className="h-6 w-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Delete Transaction</h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        This action cannot be undone
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-lg p-4 mb-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-400">Transaction ID:</span>
                                        <span className="text-sm text-white font-mono font-semibold">
                                            {selectedSale.transaction_id || selectedSale.id.substring(0, 8)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-400">Customer:</span>
                                        <span className="text-sm text-white font-semibold">
                                            {selectedSale.customer_name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-400">Amount:</span>
                                        <span className="text-sm text-white font-bold">
                                            Rs {selectedSale.total_amount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-400">Date:</span>
                                        <span className="text-sm text-white">
                                            {new Date(selectedSale.transaction_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-400">Payment:</span>
                                        <span className="text-sm text-white">
                                            {selectedSale.payment_type}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-400">Items:</span>
                                        <span className="text-sm text-white">
                                            {selectedSale.sale_items?.length || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                                <p className="text-sm text-blue-400 mb-1">
                                    <strong>What will happen:</strong>
                                </p>
                                <ul className="text-xs text-blue-300 space-y-1 ml-4 list-disc">
                                    <li>Product stock will be restored</li>
                                    {selectedSale.payment_type === 'CREDIT' && (
                                        <li>Customer credit balance will be reduced</li>
                                    )}
                                    <li>All transaction records will be deleted</li>
                                </ul>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                                <p className="text-sm text-yellow-500">
                                    <strong>Warning:</strong> This action cannot be reversed!
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] hover:bg-[#253544] text-white font-medium transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            Delete Transaction
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Alert Modal */}
            {customAlert.show && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
                    onClick={closeAlert}
                >
                    <div
                        className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Icon */}
                        <div className="flex items-center justify-center mb-4">
                            <div className={`rounded-full p-3 ${
                                customAlert.type === 'success' ? 'bg-emerald-500/10' :
                                    customAlert.type === 'error' ? 'bg-red-500/10' :
                                        customAlert.type === 'warning' ? 'bg-amber-500/10' :
                                            'bg-blue-500/10'
                            }`}>
                                {customAlert.type === 'success' && <CheckCircle className="h-8 w-8 text-emerald-500" />}
                                {customAlert.type === 'error' && <AlertCircle className="h-8 w-8 text-red-500" />}
                                {customAlert.type === 'warning' && <AlertTriangle className="h-8 w-8 text-amber-500" />}
                                {customAlert.type === 'info' && <Info className="h-8 w-8 text-blue-500" />}
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-white text-center mb-2">
                            {customAlert.title}
                        </h3>

                        {/* Message */}
                        <p className="text-slate-400 text-center text-sm mb-6 whitespace-pre-line">
                            {customAlert.message}
                        </p>

                        {/* OK Button */}
                        <button
                            onClick={closeAlert}
                            className={`w-full px-4 py-2.5 rounded-lg font-medium transition-colors ${
                                customAlert.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                    customAlert.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                                        customAlert.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
                                            'bg-blue-600 hover:bg-blue-700'
                            } text-white`}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Global Styles */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
            `}</style>
        </div>
    );
}
