"use client";

import { useState, useMemo } from "react";
import {
    Users,
    Search,
    Plus,
    Edit,
    DollarSign,
    TrendingUp,
    User,
    X,
    Phone,
    MapPin,
    ArrowLeft,
    ArrowUpRight,
    AlertCircle,
    CheckCircle2,
    FileQuestion,
    ChevronLeft,
    ChevronRight,
    Trash2,
    AlertTriangle,
    CheckCircle,
    Info
} from "lucide-react";
import Link from "next/link";
import { useCustomers } from "@/hooks/useCustomers";
import { customersService } from "@/services/customersService";

interface CustomAlert {
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
}

export default function CustomersPage() {
    const { customers, loading, refetch } = useCustomers();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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

    // Filter customers
    const filteredCustomers = useMemo(() => {
        if (!searchQuery) return customers;
        return customers.filter(
            (customer) =>
                customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [customers, searchQuery]);

    // Calculate summary
    const summary = useMemo(() => {
        const totalCustomers = customers.length;
        const customersWithCredit = customers.filter((c) => c.credit_balance > 0).length;
        const totalCredit = customers.reduce((sum, c) => sum + c.credit_balance, 0);
        const avgCredit = customersWithCredit > 0 ? totalCredit / customersWithCredit : 0;

        return { totalCustomers, customersWithCredit, totalCredit, avgCredit };
    }, [customers]);

    // Pagination
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const paginatedCustomers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredCustomers, currentPage]);

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const handleDeleteClick = (customer: any) => {
        if (customer.credit_balance > 0) {
            showAlert(
                'warning',
                'Cannot Delete Customer',
                `Cannot delete customer with outstanding debt of Rs ${customer.credit_balance.toLocaleString()}. Please settle all payments first.`
            );
            return;
        }
        setCustomerToDelete(customer);
        setShowDeleteModal(true);
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
                                <h2 className="text-2xl font-bold text-white tracking-tight">Customers</h2>
                                <p className="text-slate-400 text-sm mt-1">Manage your customer database</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-medium text-white flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Add Customer
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-4 mb-6">
                        <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 bg-[#137fec]/10 rounded-lg">
                                    <Users className="h-5 w-5 text-[#137fec]" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mb-1">Total Customers</p>
                            <div className="text-3xl font-bold text-white mb-1">
                                {summary.totalCustomers}
                            </div>
                            <p className="text-xs text-slate-500">Registered customers</p>
                        </div>

                        <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 bg-amber-500/10 rounded-lg">
                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mb-1">With Credit Balance</p>
                            <div className="text-3xl font-bold text-white mb-1">
                                {summary.customersWithCredit}
                            </div>
                            <p className="text-xs text-slate-500">Have outstanding debt</p>
                        </div>

                        <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 bg-red-500/10 rounded-lg">
                                    <DollarSign className="h-5 w-5 text-red-500" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mb-1">Total Outstanding</p>
                            <div className="text-3xl font-bold text-white mb-1">
                                Rs {summary.totalCredit.toLocaleString()}
                            </div>
                            <p className="text-xs text-slate-500">Outstanding amount</p>
                        </div>

                        <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 bg-purple-500/10 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-purple-500" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mb-1">Average Credit</p>
                            <div className="text-3xl font-bold text-white mb-1">
                                Rs {Math.round(summary.avgCredit).toLocaleString()}
                            </div>
                            <p className="text-xs text-slate-500">Per debtor</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl p-6 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search customers by name or phone..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Customers List */}
                    <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#137fec]/10 rounded-lg">
                                    <Users className="h-5 w-5 text-[#137fec]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">All Customers</h3>
                                    <p className="text-sm text-slate-400">
                                        Showing {paginatedCustomers.length} of {filteredCustomers.length} customers
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="text-center py-12 text-slate-400">
                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#137fec] border-r-transparent mb-4"></div>
                                    <p>Loading customers...</p>
                                </div>
                            ) : filteredCustomers.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <div className="inline-block p-4 bg-[#1e2b38] rounded-full mb-4">
                                        <Users className="h-12 w-12 opacity-50" />
                                    </div>
                                    <p className="text-sm">No customers found</p>
                                    <p className="text-xs mt-1">Try adjusting your search</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {paginatedCustomers.map((customer) => (
                                        <div
                                            key={customer.id}
                                            className="p-5 rounded-xl bg-[#1a2530] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all group"
                                        >
                                            {/* Customer Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#137fec] to-blue-600 shadow-lg">
                                                    <User className="h-7 w-7 text-white" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setSelectedCustomer(customer)}
                                                        className="p-2 rounded-lg bg-[#16212b] border border-[rgba(255,255,255,0.1)] hover:bg-[#137fec]/20 hover:border-[#137fec] text-slate-400 hover:text-white transition-all"
                                                        title="Edit customer"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(customer)}
                                                        className={`p-2 rounded-lg border transition-all ${
                                                            customer.credit_balance > 0
                                                                ? 'bg-[#16212b] border-[rgba(255,255,255,0.1)] text-slate-600 cursor-not-allowed opacity-50'
                                                                : 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20 hover:border-red-500 text-red-500'
                                                        }`}
                                                        title={customer.credit_balance > 0 ? "Cannot delete customer with outstanding debt" : "Delete customer"}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Customer Info */}
                                            <div className="space-y-2.5 min-h-[80px]">
                                                <p className="font-bold text-lg text-white truncate">
                                                    {customer.name}
                                                </p>

                                                {/* Phone */}
                                                {customer.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                                        <span>{customer.phone}</span>
                                                    </div>
                                                )}

                                                {/* Address */}
                                                {customer.address && (
                                                    <div className="flex items-start gap-2 text-sm text-slate-400">
                                                        <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                                        <span className="line-clamp-2">{customer.address}</span>
                                                    </div>
                                                )}

                                                {/* No Data Message */}
                                                {!customer.phone && !customer.address && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <FileQuestion className="h-3.5 w-3.5 flex-shrink-0" />
                                                        <span className="italic">No contact information</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Credit Balance - Always at Bottom */}
                                            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-400">
                                                        Credit Balance
                                                    </span>
                                                    {customer.credit_balance > 0 ? (
                                                        <div className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg">
                                                            <span className="text-sm font-bold text-red-400">
                                                                Rs {customer.credit_balance.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                                            <span className="text-sm font-semibold text-emerald-400">
                                                                Paid
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.1)] bg-[#1a2530]">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-slate-400">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => goToPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg bg-[#16212b] border border-[rgba(255,255,255,0.1)] hover:bg-[#1e2b38] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => goToPage(pageNum)}
                                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                            currentPage === pageNum
                                                                ? 'bg-[#137fec] text-white'
                                                                : 'bg-[#16212b] border border-[rgba(255,255,255,0.1)] text-slate-400 hover:bg-[#1e2b38]'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => goToPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg bg-[#16212b] border border-[rgba(255,255,255,0.1)] hover:bg-[#1e2b38] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
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

            {/* Edit Customer Modal */}
            {selectedCustomer && (
                <EditCustomerModal
                    customer={selectedCustomer}
                    onClose={() => {
                        setSelectedCustomer(null);
                        refetch();
                    }}
                    showAlert={showAlert}
                />
            )}

            {/* Add Customer Modal */}
            {showAddModal && (
                <AddCustomerModal
                    onClose={() => {
                        setShowAddModal(false);
                        refetch();
                    }}
                    showAlert={showAlert}
                />
            )}

            {/* Delete Customer Modal */}
            {showDeleteModal && customerToDelete && (
                <DeleteCustomerModal
                    customer={customerToDelete}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setCustomerToDelete(null);
                    }}
                    onSuccess={() => {
                        setShowDeleteModal(false);
                        setCustomerToDelete(null);
                        refetch();
                    }}
                    showAlert={showAlert}
                />
            )}

            {/* Custom Alert Modal */}
            {customAlert.show && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in duration-200"
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

// Delete Customer Modal Component
function DeleteCustomerModal({
                                 customer,
                                 onClose,
                                 onSuccess,
                                 showAlert
                             }: {
    customer: any;
    onClose: () => void;
    onSuccess: () => void;
    showAlert: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const { error } = await customersService.delete(customer.id);

            if (error) throw error;

            showAlert('success', 'Customer Deleted!', 'Customer deleted successfully!');
            onSuccess();
        } catch (error) {
            console.error("Error deleting customer:", error);
            showAlert('error', 'Delete Failed', 'Failed to delete customer. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="max-w-md w-full bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-red-500/10 to-orange-500/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <AlertTriangle className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Delete Customer</h3>
                            <p className="text-sm text-slate-400 mt-1">
                                This action cannot be undone
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-lg p-4 mb-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-400">Customer Name:</span>
                                <span className="text-sm text-white font-semibold">
                                    {customer.name}
                                </span>
                            </div>
                            {customer.phone && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">Phone:</span>
                                    <span className="text-sm text-white">
                                        {customer.phone}
                                    </span>
                                </div>
                            )}
                            {customer.address && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">Address:</span>
                                    <span className="text-sm text-white">
                                        {customer.address}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t border-[rgba(255,255,255,0.1)]">
                                <span className="text-sm text-slate-400">Credit Balance:</span>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                    <span className="text-sm font-semibold text-emerald-400">
                                        Fully Paid
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                        <p className="text-sm text-yellow-500">
                            <strong>Warning:</strong> Deleting this customer will permanently remove all their information from the system.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] hover:bg-[#253544] text-white font-medium transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
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
                                    Delete Customer
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Edit Customer Modal Component
function EditCustomerModal({
                               customer,
                               onClose,
                               showAlert
                           }: {
    customer: any;
    onClose: () => void;
    showAlert: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}) {
    const [name, setName] = useState(customer.name);
    const [phone, setPhone] = useState(customer.phone || "");
    const [address, setAddress] = useState(customer.address || "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            showAlert('warning', 'Name Required', 'Please enter customer name');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await customersService.update(customer.id, {
                name: name.trim(),
                phone: phone.trim(),
                address: address.trim()
            });

            if (error) throw error;

            showAlert('success', 'Customer Updated!', 'Customer updated successfully!');
            onClose();
        } catch (error) {
            console.error("Error updating customer:", error);
            showAlert('error', 'Update Failed', 'Failed to update customer');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="max-w-md w-full bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">Edit Customer</h3>
                            <p className="text-sm text-slate-400 mt-1">Update customer information</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-[#1e2b38] hover:bg-[#253544] text-white transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Customer Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter customer name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                placeholder="Enter phone number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Address
                            </label>
                            <input
                                type="text"
                                placeholder="Enter address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all disabled:opacity-50"
                            />
                        </div>
                        <div className="flex gap-3 pt-4">
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
                                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-br from-[#137fec] to-blue-600 hover:from-[#137fec] hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Add Customer Modal Component
function AddCustomerModal({
                              onClose,
                              showAlert
                          }: {
    onClose: () => void;
    showAlert: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            showAlert('warning', 'Name Required', 'Please enter customer name');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await customersService.create({
                name: name.trim(),
                phone: phone.trim() || undefined,
                address: address.trim() || undefined
            });

            if (error) throw error;

            showAlert('success', 'Customer Added!', 'Customer added successfully!');
            onClose();
        } catch (error) {
            console.error("Error adding customer:", error);
            showAlert('error', 'Add Failed', 'Failed to add customer');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="max-w-md w-full bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">Add Customer</h3>
                            <p className="text-sm text-slate-400 mt-1">Create a new customer</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-[#1e2b38] hover:bg-[#253544] text-white transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Customer Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter customer name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                placeholder="Enter phone number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Address
                            </label>
                            <input
                                type="text"
                                placeholder="Enter address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all disabled:opacity-50"
                            />
                        </div>
                        <div className="flex gap-3 pt-4">
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
                                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? "Adding..." : "Add Customer"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
