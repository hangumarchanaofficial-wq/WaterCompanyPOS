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
    Package,
    Search,
    Plus,
    Edit,
    AlertTriangle,
    TrendingDown,
    Boxes,
    Filter,
    X,
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/lib/supabase";

export default function InventoryPage() {
    const { products, loading, refetch } = useProducts();
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [stockFilter, setStockFilter] = useState("all");
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            Inventory Management
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your product stock and inventory
                        </p>
                    </div>
                    <Button
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                        onClick={() => setShowAddModal(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-50">
                                Total Products
                            </CardTitle>
                            <Package className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalProducts}</div>
                            <p className="text-xs text-blue-100 mt-1">
                                {categories.length} categories
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-50">
                                Low Stock
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.lowStock}</div>
                            <p className="text-xs text-orange-100 mt-1">
                                Items need restocking
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-red-50">
                                Out of Stock
                            </CardTitle>
                            <TrendingDown className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.outOfStock}</div>
                            <p className="text-xs text-red-100 mt-1">Items unavailable</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-50">
                                Total Stock
                            </CardTitle>
                            <Boxes className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {summary.totalStock.toLocaleString()}
                            </div>
                            <p className="text-xs text-green-100 mt-1">Total units</p>
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
                                        placeholder="Search products..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Category Filter */}
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Stock Filter */}
                            <Select value={stockFilter} onValueChange={setStockFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Stock Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Stock</SelectItem>
                                    <SelectItem value="low">Low Stock</SelectItem>
                                    <SelectItem value="out">Out of Stock</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Active Filters */}
                        {(searchQuery || categoryFilter !== "all" || stockFilter !== "all") && (
                            <div className="flex items-center gap-2 mt-4">
                                <span className="text-sm text-muted-foreground">Active filters:</span>
                                {searchQuery && (
                                    <Badge variant="secondary" className="gap-1">
                                        Search: {searchQuery}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => setSearchQuery("")}
                                        />
                                    </Badge>
                                )}
                                {categoryFilter !== "all" && (
                                    <Badge variant="secondary" className="gap-1">
                                        {categoryFilter}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => setCategoryFilter("all")}
                                        />
                                    </Badge>
                                )}
                                {stockFilter !== "all" && (
                                    <Badge variant="secondary" className="gap-1">
                                        {stockFilter === "low" ? "Low Stock" : "Out of Stock"}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => setStockFilter("all")}
                                        />
                                    </Badge>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Products List */}
                <Card className="shadow-lg border-none">
                    <CardHeader>
                        <CardTitle>Products</CardTitle>
                        <CardDescription>
                            Showing {filteredProducts.length} of {products.length} products
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Loading products...
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No products found</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {filteredProducts.map((product) => {
                                    const status = getStockStatus(product.stock);
                                    return (
                                        <div
                                            key={product.id}
                                            className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors border-2 border-transparent hover:border-blue-500"
                                        >
                                            {/* Product Header */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                                                    <Package className="h-6 w-6 text-white" />
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setSelectedProduct(product)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            {/* Product Info */}
                                            <div>
                                                <p className="font-bold text-base truncate mb-1">
                                                    {product.name}
                                                </p>
                                                <Badge variant="outline" className="text-xs mb-3">
                                                    {product.category}
                                                </Badge>

                                                {/* Stock Status */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-muted-foreground">
                                                            Stock Level
                                                        </span>
                                                        <span className="font-bold text-lg">
                                                            {product.stock}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={`h-2 w-2 rounded-full ${status.color}`}
                                                        />
                                                        <span className="text-xs text-muted-foreground">
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit Product Modal */}
            {selectedProduct && (
                <EditProductModal
                    product={selectedProduct}
                    onClose={() => {
                        setSelectedProduct(null);
                        refetch();
                    }}
                />
            )}

            {/* Add Product Modal */}
            {showAddModal && (
                <AddProductModal
                    onClose={() => {
                        setShowAddModal(false);
                        refetch();
                    }}
                />
            )}
        </div>
    );
}

// Edit Product Modal Component
function EditProductModal({ product, onClose }: { product: any; onClose: () => void }) {
    const [name, setName] = useState(product.name);
    const [category, setCategory] = useState(product.category);
    const [stock, setStock] = useState(product.stock);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !category.trim() || stock < 0) {
            alert("Please fill all fields correctly");
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

            alert("Product updated successfully!");
            onClose();
        } catch (error) {
            console.error("Error updating product:", error);
            alert("Failed to update product");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <Card className="max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Edit Product</CardTitle>
                            <CardDescription className="mt-1">
                                Update product information
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="pt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Product Name</label>
                            <Input
                                placeholder="Enter product name..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Category</label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Water">Water</SelectItem>
                                    <SelectItem value="Drinks">Drinks</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Stock Quantity</label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="Enter stock quantity..."
                                value={stock}
                                onChange={(e) => setStock(Number(e.target.value))}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="flex gap-2">
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
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Updating..." : "Update Product"}
                            </Button>
                        </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}

// Add Product Modal Component
function AddProductModal({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Water");
    const [stock, setStock] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !category.trim() || stock < 0) {
            alert("Please fill all fields correctly");
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

            alert("Product added successfully!");
            onClose();
        } catch (error) {
            console.error("Error adding product:", error);
            alert("Failed to add product");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <Card className="max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Add New Product</CardTitle>
                            <CardDescription className="mt-1">
                                Create a new product in inventory
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="pt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Product Name</label>
                            <Input
                                placeholder="Enter product name..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Category</label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Water">Water</SelectItem>
                                    <SelectItem value="Drinks">Drinks</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Initial Stock</label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="Enter initial stock..."
                                value={stock}
                                onChange={(e) => setStock(Number(e.target.value))}
                                disabled={isSubmitting}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Adding..." : "Add Product"}
                        </Button>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
