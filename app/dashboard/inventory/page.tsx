"use client";

import { useState, useMemo } from "react";
import {
    Package,
    Search,
    Plus,
    Edit,
    AlertTriangle,
    TrendingDown,
    Boxes,
    Filter,
    X,
    ArrowLeft,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    Info
} from "lucide-react";
import Link from "next/link";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/lib/supabase";

interface CustomAlert {
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
}

export default function InventoryPage() {
    const { products, loading, refetch } = useProducts();
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [stockFilter, setStockFilter] = useState("all");
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);
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

    // Filter products
    const filteredProducts = useMemo(() => {
        let filtered = [...products];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter((product) =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Category filter
        if (categoryFilter !== "all") {
            filtered = filtered.filter((product) => product.category === categoryFilter);
        }

        // Stock filter
        if (stockFilter !== "all") {
            if (stockFilter === "low") {
                filtered = filtered.filter((product) => product.stock <= 20);
            } else if (stockFilter === "out") {
                filtered = filtered.filter((product) => product.stock === 0);
            }
        }

        return filtered;
    }, [products, searchQuery, categoryFilter, stockFilter]);

    // Pagination logic
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredProducts.slice(startIndex, endIndex);
    }, [filteredProducts, currentPage]);

    // Reset to page 1 when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery, categoryFilter, stockFilter]);

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set(products.map((p) => p.category));
        return Array.from(cats);
    }, [products]);

    // Calculate summary statistics
    const summary = useMemo(() => {
        const totalProducts = products.length;
        const lowStock = products.filter((p) => p.stock <= 20 && p.stock > 0).length;
        const outOfStock = products.filter((p) => p.stock === 0).length;
        const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

        return { totalProducts, lowStock, outOfStock, totalStock };
    }, [products]);

    // Get stock status
    const getStockStatus = (stock: number) => {
        if (stock === 0) return { label: "Out of Stock", color: "bg-red-500" };
        if (stock <= 20) return { label: "Low Stock", color: "bg-orange-500" };
        return { label: "In Stock", color: "bg-green-500" };
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
                                <h2 className="text-2xl font-bold text-white tracking-tight">Inventory Management</h2>
                                <p className="text-slate-400 text-sm mt-1">Manage your product stock and inventory</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-[#137fec] hover:bg-blue-600 rounded-lg text-sm font-medium text-white flex items-center gap-2 shadow-lg shadow-[#137fec]/20 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Add Product
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-4 mb-6">
                        <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 bg-[#137fec]/10 rounded-lg">
                                    <Package className="h-5 w-5 text-[#137fec]" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mb-1">Total Products</p>
                            <div className="text-3xl font-bold text-white mb-1">
                                {summary.totalProducts}
                            </div>
                            <p className="text-xs text-slate-500">{categories.length} categories</p>
                        </div>

                        <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 bg-orange-500/10 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mb-1">Low Stock</p>
                            <div className="text-3xl font-bold text-white mb-1">
                                {summary.lowStock}
                            </div>
                            <p className="text-xs text-slate-500">Items need restocking</p>
                        </div>

                        <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 bg-red-500/10 rounded-lg">
                                    <TrendingDown className="h-5 w-5 text-red-500" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mb-1">Out of Stock</p>
                            <div className="text-3xl font-bold text-white mb-1">
                                {summary.outOfStock}
                            </div>
                            <p className="text-xs text-slate-500">Items unavailable</p>
                        </div>

                        <div className="bg-[#1a2530] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                                    <Boxes className="h-5 w-5 text-emerald-500" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mb-1">Total Stock</p>
                            <div className="text-3xl font-bold text-white mb-1">
                                {summary.totalStock.toLocaleString()}
                            </div>
                            <p className="text-xs text-slate-500">Total units</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl mb-6">
                        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#137fec]/10 rounded-lg">
                                    <Filter className="h-5 w-5 text-[#137fec]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Filters & Search</h3>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Search */}
                                <div className="md:col-span-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="Search products..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Category Filter */}
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>

                                {/* Stock Filter */}
                                <select
                                    value={stockFilter}
                                    onChange={(e) => setStockFilter(e.target.value)}
                                    className="px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all"
                                >
                                    <option value="all">All Stock</option>
                                    <option value="low">Low Stock</option>
                                    <option value="out">Out of Stock</option>
                                </select>
                            </div>

                            {/* Active Filters */}
                            {(searchQuery || categoryFilter !== "all" || stockFilter !== "all") && (
                                <div className="flex items-center gap-2 mt-4">
                                    <span className="text-sm text-slate-400">Active filters:</span>
                                    {searchQuery && (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] rounded-lg">
                                            <span className="text-xs text-white">Search: {searchQuery}</span>
                                            <X
                                                className="h-3 w-3 cursor-pointer text-slate-400 hover:text-white"
                                                onClick={() => setSearchQuery("")}
                                            />
                                        </div>
                                    )}
                                    {categoryFilter !== "all" && (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] rounded-lg">
                                            <span className="text-xs text-white">{categoryFilter}</span>
                                            <X
                                                className="h-3 w-3 cursor-pointer text-slate-400 hover:text-white"
                                                onClick={() => setCategoryFilter("all")}
                                            />
                                        </div>
                                    )}
                                    {stockFilter !== "all" && (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] rounded-lg">
                                            <span className="text-xs text-white">
                                                {stockFilter === "low" ? "Low Stock" : "Out of Stock"}
                                            </span>
                                            <X
                                                className="h-3 w-3 cursor-pointer text-slate-400 hover:text-white"
                                                onClick={() => setStockFilter("all")}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Products List */}
                    <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#137fec]/10 rounded-lg">
                                        <Package className="h-5 w-5 text-[#137fec]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Products</h3>
                                        <p className="text-sm text-slate-400">
                                            Showing {paginatedProducts.length} of {filteredProducts.length} products
                                        </p>
                                    </div>
                                </div>
                                {/* Page indicator */}
                                {totalPages > 1 && (
                                    <div className="text-sm text-slate-400">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="text-center py-12 text-slate-400">
                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#137fec] border-r-transparent mb-4"></div>
                                    <p>Loading products...</p>
                                </div>
                            ) : paginatedProducts.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <div className="inline-block p-4 bg-[#1e2b38] rounded-full mb-4">
                                        <Package className="h-12 w-12 opacity-50" />
                                    </div>
                                    <p className="text-sm">No products found</p>
                                    <p className="text-xs mt-1">Try adjusting your filters</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {paginatedProducts.map((product) => {
                                            const status = getStockStatus(product.stock);
                                            return (
                                                <div
                                                    key={product.id}
                                                    className="p-5 rounded-xl bg-[#1a2530] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all"
                                                >
                                                    {/* Product Header */}
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#137fec] to-blue-600 shadow-lg">
                                                            <Package className="h-7 w-7 text-white" />
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedProduct(product)}
                                                            className="p-2 rounded-lg bg-[#16212b] border border-[rgba(255,255,255,0.1)] hover:bg-[#137fec]/20 hover:border-[#137fec] text-slate-400 hover:text-white transition-all"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    {/* Product Info */}
                                                    <div>
                                                        <p className="font-bold text-lg text-white truncate mb-2">
                                                            {product.name}
                                                        </p>
                                                        <div className="inline-flex items-center px-2.5 py-1 bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-lg mb-3">
                                                            <span className="text-xs text-slate-400">{product.category}</span>
                                                        </div>

                                                        {/* Stock Status */}
                                                        <div className="space-y-2 mt-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm text-slate-400">
                                                                    Stock Level
                                                                </span>
                                                                <span className="font-bold text-xl text-white">
                                                                    {product.stock}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className={`h-2 w-2 rounded-full ${status.color}`}
                                                                />
                                                                <span className="text-xs text-slate-400">
                                                                    {status.label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 mt-6">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className="p-2 rounded-lg bg-[#1a2530] border border-[rgba(255,255,255,0.1)] hover:bg-[#1e2b38] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </button>

                                            <div className="flex items-center gap-2">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                                    // Show first page, last page, current page, and pages around current
                                                    const showPage =
                                                        page === 1 ||
                                                        page === totalPages ||
                                                        Math.abs(page - currentPage) <= 1;

                                                    const showEllipsis =
                                                        (page === 2 && currentPage > 3) ||
                                                        (page === totalPages - 1 && currentPage < totalPages - 2);

                                                    if (showEllipsis) {
                                                        return (
                                                            <span key={page} className="px-2 text-slate-500">
                                                                ...
                                                            </span>
                                                        );
                                                    }

                                                    if (!showPage) return null;

                                                    return (
                                                        <button
                                                            key={page}
                                                            onClick={() => setCurrentPage(page)}
                                                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                                                currentPage === page
                                                                    ? "bg-[#137fec] text-white shadow-lg shadow-[#137fec]/20"
                                                                    : "bg-[#1a2530] border border-[rgba(255,255,255,0.1)] text-slate-400 hover:bg-[#1e2b38] hover:text-white"
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                                className="p-2 rounded-lg bg-[#1a2530] border border-[rgba(255,255,255,0.1)] hover:bg-[#1e2b38] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronRight className="h-5 w-5" />
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

            {/* Edit Product Modal */}
            {selectedProduct && (
                <EditProductModal
                    product={selectedProduct}
                    onClose={() => {
                        setSelectedProduct(null);
                        refetch();
                    }}
                    showAlert={showAlert}
                />
            )}

            {/* Add Product Modal */}
            {showAddModal && (
                <AddProductModal
                    onClose={() => {
                        setShowAddModal(false);
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

// Edit Product Modal Component
function EditProductModal({
                              product,
                              onClose,
                              showAlert
                          }: {
    product: any;
    onClose: () => void;
    showAlert: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}) {
    const [name, setName] = useState(product.name);
    const [category, setCategory] = useState(product.category);
    const [stock, setStock] = useState(product.stock);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !category.trim() || stock < 0) {
            showAlert('warning', 'Invalid Input', 'Please fill all fields correctly');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from("products")
                .update({
                    name: name.trim(),
                    category: category.trim(),
                    stock: stock,
                })
                .eq("id", product.id);

            if (error) throw error;

            showAlert('success', 'Product Updated!', 'Product updated successfully!');
            onClose();
        } catch (error) {
            console.error("Error updating product:", error);
            showAlert('error', 'Update Failed', 'Failed to update product');
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
                            <h3 className="text-lg font-bold text-white">Edit Product</h3>
                            <p className="text-sm text-slate-400 mt-1">Update product information</p>
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
                                Product Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter product name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all"
                            >
                                <option value="Water">Water</option>
                                <option value="Drinks">Drinks</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Stock Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                placeholder="Enter stock quantity"
                                value={stock}
                                onChange={(e) => setStock(Number(e.target.value))}
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
                                {isSubmitting ? "Updating..." : "Update Product"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Add Product Modal Component
function AddProductModal({
                             onClose,
                             showAlert
                         }: {
    onClose: () => void;
    showAlert: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Water");
    const [stock, setStock] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !category.trim() || stock < 0) {
            showAlert('warning', 'Invalid Input', 'Please fill all fields correctly');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from("products")
                .insert([
                    {
                        name: name.trim(),
                        category: category.trim(),
                        stock: stock,
                    },
                ]);

            if (error) throw error;

            showAlert('success', 'Product Added!', 'Product added successfully!');
            onClose();
        } catch (error) {
            console.error("Error adding product:", error);
            showAlert('error', 'Add Failed', 'Failed to add product');
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
                            <h3 className="text-lg font-bold text-white">Add New Product</h3>
                            <p className="text-sm text-slate-400 mt-1">Create a new product in inventory</p>
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
                                Product Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter product name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all"
                            >
                                <option value="Water">Water</option>
                                <option value="Drinks">Drinks</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Initial Stock <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                placeholder="Enter initial stock"
                                value={stock}
                                onChange={(e) => setStock(Number(e.target.value))}
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
                                {isSubmitting ? "Adding..." : "Add Product"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
