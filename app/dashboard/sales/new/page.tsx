"use client";

import { useState, Fragment } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ShoppingCart,
    Search,
    Plus,
    Trash2,
    DollarSign,
    User,
    Package,
    ArrowLeft,
    CreditCard,
    Banknote,
    X,
    Hash,
    ArrowUpRight,
    AlertCircle,
    CheckCircle,
    AlertTriangle,
    Info
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { salesService } from "@/services/salesService";

interface CartItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface GroupedProduct {
    brandName: string;
    products: any[];
}

interface CustomAlert {
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
}

export default function NewSalePage() {
    const router = useRouter();

    const { products, loading: productsLoading } = useProducts();
    const { customers, loading: customersLoading } = useCustomers();

    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerSearch, setCustomerSearch] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentType, setPaymentType] = useState<"CASH" | "CREDIT">("CASH");
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const parseCapacity = (name: string): number => {
        const match = name.match(/(\d+\.?\d*)\s*(ml|l)/i);
        if (!match) return 0;

        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();

        if (unit === 'l') {
            return value * 1000;
        }
        return value;
    };

    const extractBrandName = (name: string): string => {
        return name.replace(/\s*\d+\.?\d*\s*(ml|l)/i, '').trim();
    };

    const groupProductsByBrand = (productsList: any[]): GroupedProduct[] => {
        const grouped = new Map<string, any[]>();

        productsList.forEach(product => {
            const brand = extractBrandName(product.name);
            if (!grouped.has(brand)) {
                grouped.set(brand, []);
            }
            grouped.get(brand)!.push(product);
        });

        const groupedArray: GroupedProduct[] = Array.from(grouped.entries()).map(([brandName, products]) => ({
            brandName,
            products: products.sort((a, b) => parseCapacity(a.name) - parseCapacity(b.name))
        }));

        return groupedArray.sort((a, b) => a.brandName.localeCompare(b.brandName));
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase())
    );

    const waterProducts = products.filter(p => p.category === "Water");
    const groupedWater = groupProductsByBrand(waterProducts);

    const drinkProducts = products.filter(p => p.category === "Drinks");
    const groupedDrinks = groupProductsByBrand(drinkProducts);

    const getCartQuantity = (productId: string) => {
        const cartItem = cart.find(item => item.productId === productId);
        return cartItem ? cartItem.quantity : 0;
    };

    const getAvailableStock = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return 0;
        return product.stock - getCartQuantity(productId);
    };

    const calculateItemTotal = () => {
        if (!unitPrice || quantity <= 0) return 0;
        return quantity * parseFloat(unitPrice);
    };

    const addToCart = () => {
        if (!selectedProduct || quantity <= 0 || !unitPrice) {
            showAlert('warning', 'Missing Information', 'Please fill all fields before adding to cart!');
            return;
        }

        const product = products.find(p => p.id === selectedProduct);
        if (!product) return;

        const availableStock = getAvailableStock(selectedProduct);

        if (quantity > availableStock) {
            showAlert(
                'error',
                'Insufficient Stock',
                `Only ${availableStock} units available! (${getCartQuantity(selectedProduct)} already in cart)`
            );
            return;
        }

        const unitPriceValue = parseFloat(unitPrice);
        const totalPrice = quantity * unitPriceValue;

        const newItem: CartItem = {
            id: Date.now().toString(),
            productId: product.id,
            productName: product.name,
            quantity,
            unitPrice: unitPriceValue,
            totalPrice: totalPrice
        };

        setCart([...cart, newItem]);

        setSelectedProduct(null);
        setQuantity(1);
        setUnitPrice("");
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + item.totalPrice, 0);
    };

    const handleCheckout = async () => {
        if (!transactionId.trim()) {
            showAlert('warning', 'Transaction ID Required', 'Please enter a Transaction ID to proceed!');
            return;
        }

        if (!selectedCustomer) {
            showAlert('warning', 'Customer Required', 'Please select a customer to proceed!');
            return;
        }

        if (cart.length === 0) {
            showAlert('warning', 'Empty Cart', 'Your cart is empty! Add products before checkout.');
            return;
        }

        setIsSubmitting(true);

        try {
            const saleItems = cart.map(item => ({
                product_id: item.productId,
                product_name: item.productName,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total_price: item.totalPrice
            }));

            const { data, error } = await salesService.create({
                transaction_id: transactionId.trim(),
                customer_id: selectedCustomer.id,
                customer_name: selectedCustomer.name,
                total_amount: calculateTotal(),
                payment_type: paymentType,
                items: saleItems
            });

            if (error) {
                console.error("Supabase error details:", error);

                if (error.code === '23505') {
                    showAlert(
                        'error',
                        'Duplicate Transaction ID',
                        `Transaction ID "${transactionId}" already exists! Please use a unique transaction ID.`
                    );
                } else if (error.code === '42703') {
                    showAlert(
                        'error',
                        'Database Error',
                        "Database column error. The 'transaction_id' column may not exist in the sales table."
                    );
                } else if (error.message) {
                    showAlert('error', 'Error', error.message);
                } else {
                    showAlert('error', 'Failed', 'Failed to create sale. Please check the console for details.');
                }
                return;
            }

            if (!data) {
                showAlert('error', 'No Data', 'Failed to create sale. No data returned.');
                return;
            }

            showAlert(
                'success',
                'Sale Completed!',
                `Transaction ID: ${transactionId}\nTotal: Rs ${calculateTotal().toLocaleString()}\n\nRedirecting to dashboard...`
            );

            // Clear form
            setCart([]);
            setSelectedCustomer(null);
            setCustomerSearch("");
            setTransactionId("");
            setPaymentType("CASH");

            // Redirect after 2 seconds
            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);
        } catch (error) {
            console.error("Error creating sale:", error);
            showAlert('error', 'Unexpected Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
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
                                <h2 className="text-2xl font-bold text-white tracking-tight">New Sale</h2>
                                <p className="text-slate-400 text-sm mt-1">Create a new transaction</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Transaction Details Card */}
                            <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[#137fec]/10 rounded-lg">
                                            <User className="h-5 w-5 text-[#137fec]" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Transaction Details</h3>
                                            <p className="text-sm text-slate-400">Enter transaction ID and select customer</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                                <Hash className="h-4 w-4 text-[#137fec]" />
                                                Transaction ID <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter transaction ID (e.g., TXN-001, INV-2026-001)"
                                                value={transactionId}
                                                onChange={(e) => setTransactionId(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all font-mono"
                                            />
                                            {transactionId && (
                                                <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                                                    <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                                    Transaction ID set
                                                </p>
                                            )}
                                        </div>

                                        <div className="border-t border-[rgba(255,255,255,0.1)] pt-5">
                                            <label className="block text-sm font-medium text-slate-300 mb-3">
                                                Customer <span className="text-red-500">*</span>
                                            </label>

                                            {customersLoading ? (
                                                <div className="text-center py-8 text-slate-400">
                                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#137fec] border-r-transparent mb-4"></div>
                                                    <p>Loading customers...</p>
                                                </div>
                                            ) : !selectedCustomer ? (
                                                <div className="space-y-3">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500 pointer-events-none z-10" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search customer by name..."
                                                            value={customerSearch}
                                                            onChange={(e) => setCustomerSearch(e.target.value)}
                                                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] outline-none transition-all"
                                                        />
                                                    </div>

                                                    {customerSearch && (
                                                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                                            {filteredCustomers.length > 0 ? (
                                                                filteredCustomers.map((customer) => (
                                                                    <button
                                                                        key={customer.id}
                                                                        onClick={() => {
                                                                            setSelectedCustomer(customer);
                                                                            setCustomerSearch("");
                                                                        }}
                                                                        className="w-full p-4 rounded-lg bg-[#1e2b38]/50 hover:bg-[#1e2b38] border border-[rgba(255,255,255,0.08)] hover:border-[#137fec]/50 transition-all text-left group"
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <div>
                                                                                <p className="font-semibold text-white">{customer.name}</p>
                                                                                <p className="text-xs text-slate-400 mt-1">Click to select</p>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className="text-xs text-slate-400">Outstanding</p>
                                                                                <p className="font-bold text-amber-500">
                                                                                    Rs {customer.credit_balance.toLocaleString()}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </button>
                                                                ))
                                                            ) : (
                                                                <p className="text-center text-slate-400 py-8">No customers found</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-lg bg-gradient-to-br from-[#137fec] to-blue-600 text-white shadow-lg border border-[#137fec]/20">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <p className="text-xs text-blue-100 mb-1">Selected Customer</p>
                                                            <p className="font-bold text-lg">{selectedCustomer.name}</p>
                                                        </div>
                                                        <div className="text-right mr-4">
                                                            <p className="text-xs text-blue-100">Current Balance</p>
                                                            <p className="font-bold text-lg">Rs {selectedCustomer.credit_balance.toLocaleString()}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCustomer(null);
                                                                setCustomerSearch("");
                                                            }}
                                                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Add Products */}
                            <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                            <Package className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Add Products</h3>
                                            <p className="text-sm text-slate-400">Select products and set prices</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {productsLoading ? (
                                        <div className="text-center py-8 text-slate-400">
                                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent mb-4"></div>
                                            <p>Loading products...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Product</label>
                                                <div className="relative">
                                                    <select
                                                        value={selectedProduct || ""}
                                                        onChange={(e) => setSelectedProduct(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                                                        style={{
                                                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                                            backgroundPosition: 'right 0.5rem center',
                                                            backgroundRepeat: 'no-repeat',
                                                            backgroundSize: '1.5em 1.5em',
                                                            paddingRight: '2.5rem'
                                                        }}
                                                    >
                                                        <option value="" className="bg-[#1e2b38] text-slate-400">Select a product...</option>

                                                        {/* Water Products - Grouped by Brand */}
                                                        {groupedWater.length > 0 && (
                                                            <optgroup label="💧 Water Bottles" className="bg-[#1a2530] text-white font-semibold">
                                                                {groupedWater.map((group) => (
                                                                    <Fragment key={group.brandName}>
                                                                        <option disabled className="bg-[#1a2530] text-[#137fec] font-bold text-xs py-1">
                                                                            ── {group.brandName} ──
                                                                        </option>
                                                                        {group.products.map((product) => {
                                                                            const available = getAvailableStock(product.id);
                                                                            const inCart = getCartQuantity(product.id);
                                                                            return (
                                                                                <option
                                                                                    key={product.id}
                                                                                    value={product.id}
                                                                                    className="bg-[#1e2b38] text-white py-2 pl-6"
                                                                                >
                                                                                    └─ {product.name} (Available: {available}{inCart > 0 ? ` | ${inCart} in cart` : ''})
                                                                                </option>
                                                                            );
                                                                        })}
                                                                    </Fragment>
                                                                ))}
                                                            </optgroup>
                                                        )}

                                                        {/* Drink Products - Grouped by Brand */}
                                                        {groupedDrinks.length > 0 && (
                                                            <optgroup label="🥤 Drinks" className="bg-[#1a2530] text-white font-semibold">
                                                                {groupedDrinks.map((group) => (
                                                                    <Fragment key={group.brandName}>
                                                                        <option disabled className="bg-[#1a2530] text-[#137fec] font-bold text-xs py-1">
                                                                            ── {group.brandName} ──
                                                                        </option>
                                                                        {group.products.map((product) => {
                                                                            const available = getAvailableStock(product.id);
                                                                            const inCart = getCartQuantity(product.id);
                                                                            return (
                                                                                <option
                                                                                    key={product.id}
                                                                                    value={product.id}
                                                                                    className="bg-[#1e2b38] text-white py-2 pl-6"
                                                                                >
                                                                                    └─ {product.name} (Available: {available}{inCart > 0 ? ` | ${inCart} in cart` : ''})
                                                                                </option>
                                                                            );
                                                                        })}
                                                                    </Fragment>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={quantity}
                                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                                        className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-2">Unit Price (Rs)</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Enter unit price..."
                                                        value={unitPrice}
                                                        onChange={(e) => setUnitPrice(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-lg bg-[#1e2b38] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {unitPrice && quantity > 0 && (
                                                <div className="p-4 bg-[#137fec]/10 rounded-lg border border-[#137fec]/20">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-slate-300">
                                                            Item Total:
                                                        </span>
                                                        <span className="text-xl font-bold text-[#137fec]">
                                                            Rs {calculateItemTotal().toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {quantity} × Rs {parseFloat(unitPrice).toLocaleString()}
                                                    </p>
                                                </div>
                                            )}

                                            <button
                                                onClick={addToCart}
                                                className="w-full px-4 py-3 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus className="h-5 w-5" />
                                                Add to Cart
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Cart */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-6">
                                <div className="bg-[#16212b] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[#16212b] to-[#1a2530]">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                                <ShoppingCart className="h-5 w-5 text-purple-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">Shopping Cart</h3>
                                                <p className="text-sm text-slate-400">{cart.length} items</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                {cart.length === 0 ? (
                                                    <div className="text-center py-12 text-slate-400">
                                                        <div className="inline-block p-4 bg-[#1e2b38] rounded-full mb-4">
                                                            <ShoppingCart className="h-12 w-12 opacity-50" />
                                                        </div>
                                                        <p className="text-sm">Cart is empty</p>
                                                        <p className="text-xs mt-1">Add products to get started</p>
                                                    </div>
                                                ) : (
                                                    cart.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="p-3 rounded-lg bg-[#1e2b38]/50 border border-[rgba(255,255,255,0.08)] flex items-start justify-between gap-2 hover:bg-[#1e2b38] hover:border-[#137fec]/30 transition-all group"
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-sm text-white truncate">{item.productName}</p>
                                                                <p className="text-xs text-slate-400 mt-1">
                                                                    {item.quantity} × Rs {item.unitPrice.toLocaleString()}
                                                                </p>
                                                                <p className="text-sm font-bold text-white mt-1">
                                                                    Rs {item.totalPrice.toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFromCart(item.id)}
                                                                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            <div className="pt-4 border-t border-[rgba(255,255,255,0.1)]">
                                                <label className="block text-sm font-medium text-slate-300 mb-3">Payment Method</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => setPaymentType("CASH")}
                                                        className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                                                            paymentType === "CASH"
                                                                ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                                                : "border-[rgba(255,255,255,0.1)] hover:border-emerald-500/50 text-slate-300"
                                                        }`}
                                                    >
                                                        <Banknote className="h-5 w-5" />
                                                        <span className="font-semibold text-sm">CASH</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setPaymentType("CREDIT")}
                                                        className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                                                            paymentType === "CREDIT"
                                                                ? "border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                                                                : "border-[rgba(255,255,255,0.1)] hover:border-amber-500/50 text-slate-300"
                                                        }`}
                                                    >
                                                        <CreditCard className="h-5 w-5" />
                                                        <span className="font-semibold text-sm">CREDIT</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-[rgba(255,255,255,0.1)] space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-base font-semibold text-slate-300">Total Amount</span>
                                                    <span className="text-2xl font-bold text-white">
                                                        Rs {calculateTotal().toLocaleString()}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={handleCheckout}
                                                    disabled={cart.length === 0 || !selectedCustomer || !transactionId.trim() || isSubmitting}
                                                    className="w-full px-4 py-3 bg-gradient-to-br from-[#137fec] to-blue-600 hover:from-[#137fec] hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <DollarSign className="h-5 w-5" />
                                                    {isSubmitting ? "Processing..." : "Complete Sale"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                            <div>
                                <h2 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                                    SHELON
                                </h2>
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
                            © 2026 Shelon. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>

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

            {/* Global Styles - Must be at root level */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
                
                select option {
                    padding: 12px;
                    margin: 4px 0;
                }
                
                select optgroup {
                    font-weight: 600;
                    padding: 8px;
                    background: #1a2530;
                    color: #137fec;
                }
                
                select option:disabled {
                    color: #137fec !important;
                    font-weight: bold;
                    background: #1a2530 !important;
                }
            `}</style>
        </div>
    );
}
