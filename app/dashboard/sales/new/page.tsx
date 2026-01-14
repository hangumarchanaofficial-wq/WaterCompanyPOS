"use client";

import { useState } from "react";
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
    Hash
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

export default function NewSalePage() {
    const router = useRouter();

    const { products, loading: productsLoading } = useProducts();
    const { customers, loading: customersLoading } = useCustomers();

    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerSearch, setCustomerSearch] = useState("");

    // Transaction ID state
    const [transactionId, setTransactionId] = useState("");

    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState("");

    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentType, setPaymentType] = useState<"CASH" | "CREDIT">("CASH");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase())
    );

    const waterProducts = products.filter(p => p.category === "Water");
    const drinkProducts = products.filter(p => p.category === "Drinks");

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
            alert("Please fill all fields!");
            return;
        }

        const product = products.find(p => p.id === selectedProduct);
        if (!product) return;

        const availableStock = getAvailableStock(selectedProduct);

        if (quantity > availableStock) {
            alert(`Only ${availableStock} units available! (${getCartQuantity(selectedProduct)} already in cart)`);
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
        // Validate transaction ID
        if (!transactionId.trim()) {
            alert("Please enter a Transaction ID!");
            return;
        }

        if (!selectedCustomer) {
            alert("Please select a customer!");
            return;
        }

        if (cart.length === 0) {
            alert("Cart is empty!");
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare sale items for database
            const saleItems = cart.map(item => ({
                product_id: item.productId,
                product_name: item.productName,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total_price: item.totalPrice
            }));

            console.log('Creating sale with data:', {
                transaction_id: transactionId.trim(),
                customer_id: selectedCustomer.id,
                customer_name: selectedCustomer.name,
                total_amount: calculateTotal(),
                payment_type: paymentType,
                items: saleItems
            });

            // Create sale in database
            const { data, error } = await salesService.create({
                transaction_id: transactionId.trim(),
                customer_id: selectedCustomer.id,
                customer_name: selectedCustomer.name,
                total_amount: calculateTotal(),
                payment_type: paymentType,
                items: saleItems
            });

            // Better error handling
            if (error) {
                console.error("Supabase error details:", error);

                // Check for specific error types
                if (error.code === '23505') {
                    alert(`Transaction ID "${transactionId}" already exists! Please use a unique transaction ID.`);
                } else if (error.code === '42703') {
                    alert("Database column error. The 'transaction_id' column may not exist in the sales table.");
                } else if (error.message) {
                    alert(`Error: ${error.message}`);
                } else {
                    alert("Failed to create sale. Please check the console for details.");
                }
                return;
            }

            if (!data) {
                alert("Failed to create sale. No data returned.");
                return;
            }

            alert(`Sale completed successfully!\nTransaction ID: ${transactionId}\nTotal: Rs ${calculateTotal().toLocaleString()}`);

            // Reset form
            setCart([]);
            setSelectedCustomer(null);
            setCustomerSearch("");
            setTransactionId("");
            setPaymentType("CASH");

            // Redirect to dashboard
            router.push("/dashboard");
        } catch (error) {
            console.error("Error creating sale:", error);
            alert("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="outline" size="icon" className="rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                                New Sale
                            </h1>
                            <p className="text-muted-foreground mt-1">Create a new transaction</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                        Total: Rs {calculateTotal().toLocaleString()}
                    </Badge>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - 2/3 width */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Transaction Details Card */}
                        <Card className="shadow-lg border-none dark:bg-gray-900/50 backdrop-blur-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
                                        <User className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Transaction Details</CardTitle>
                                        <CardDescription className="text-sm">Enter transaction ID and select customer</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Transaction ID Input */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                            <Hash className="h-4 w-4" />
                                            Transaction ID <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter transaction ID (e.g., TXN-001, INV-2026-001)"
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-colors font-mono"
                                        />
                                        {transactionId && (
                                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                                ✓ Transaction ID set
                                            </p>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <label className="block text-sm font-medium mb-2">
                                            Customer <span className="text-red-500">*</span>
                                        </label>

                                        {customersLoading ? (
                                            <div className="text-center py-8 text-muted-foreground">Loading customers...</div>
                                        ) : !selectedCustomer ? (
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search customer by name..."
                                                        value={customerSearch}
                                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-colors"
                                                    />
                                                </div>

                                                {customerSearch && (
                                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                                        {filteredCustomers.length > 0 ? (
                                                            filteredCustomers.map((customer) => (
                                                                <button
                                                                    key={customer.id}
                                                                    onClick={() => {
                                                                        setSelectedCustomer(customer);
                                                                        setCustomerSearch("");
                                                                    }}
                                                                    className="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-2 border-transparent hover:border-blue-500 transition-all text-left"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div>
                                                                            <p className="font-semibold">{customer.name}</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-xs text-muted-foreground">Outstanding</p>
                                                                            <p className="font-bold text-orange-600 dark:text-orange-400">
                                                                                Rs {customer.credit_balance.toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <p className="text-center text-muted-foreground py-4">No customers found</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-lg">{selectedCustomer.name}</p>
                                                    </div>
                                                    <div className="text-right mr-4">
                                                        <p className="text-xs text-blue-100">Current Balance</p>
                                                        <p className="font-bold text-lg">Rs {selectedCustomer.credit_balance.toLocaleString()}</p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedCustomer(null);
                                                            setCustomerSearch("");
                                                        }}
                                                        className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Add Products */}
                        <Card className="shadow-lg border-none dark:bg-gray-900/50 backdrop-blur-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg">
                                        <Package className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Add Products</CardTitle>
                                        <CardDescription className="text-sm">Select products and set prices</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {productsLoading ? (
                                    <div className="text-center py-8 text-muted-foreground">Loading products...</div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Product</label>
                                            <select
                                                value={selectedProduct || ""}
                                                onChange={(e) => setSelectedProduct(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-green-500 dark:focus:border-green-400 outline-none transition-colors"
                                            >
                                                <option value="">Select a product...</option>
                                                {waterProducts.length > 0 && (
                                                    <optgroup label="Water Bottles">
                                                        {waterProducts.map((product) => {
                                                            const available = getAvailableStock(product.id);
                                                            const inCart = getCartQuantity(product.id);
                                                            return (
                                                                <option key={product.id} value={product.id}>
                                                                    {product.name} (Available: {available}{inCart > 0 ? ` | ${inCart} in cart` : ''})
                                                                </option>
                                                            );
                                                        })}
                                                    </optgroup>
                                                )}
                                                {drinkProducts.length > 0 && (
                                                    <optgroup label="Drinks">
                                                        {drinkProducts.map((product) => {
                                                            const available = getAvailableStock(product.id);
                                                            const inCart = getCartQuantity(product.id);
                                                            return (
                                                                <option key={product.id} value={product.id}>
                                                                    {product.name} (Available: {available}{inCart > 0 ? ` | ${inCart} in cart` : ''})
                                                                </option>
                                                            );
                                                        })}
                                                    </optgroup>
                                                )}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Quantity</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-green-500 dark:focus:border-green-400 outline-none transition-colors"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">Unit Price (Rs)</label>
                                                <input
                                                    type="number"
                                                    placeholder="Enter unit price..."
                                                    value={unitPrice}
                                                    onChange={(e) => setUnitPrice(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-green-500 dark:focus:border-green-400 outline-none transition-colors"
                                                />
                                            </div>
                                        </div>

                                        {unitPrice && quantity > 0 && (
                                            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                                        Item Total:
                                                    </span>
                                                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                        Rs {calculateItemTotal().toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                                    {quantity} × Rs {parseFloat(unitPrice).toLocaleString()}
                                                </p>
                                            </div>
                                        )}

                                        <Button
                                            onClick={addToCart}
                                            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg py-6 text-base"
                                        >
                                            <Plus className="mr-2 h-5 w-5" />
                                            Add to Cart
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Cart */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6">
                            <Card className="shadow-lg border-none dark:bg-gray-900/50 backdrop-blur-sm">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg">
                                            <ShoppingCart className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Shopping Cart</CardTitle>
                                            <CardDescription className="text-sm">{cart.length} items</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                            {cart.length === 0 ? (
                                                <div className="text-center py-12 text-muted-foreground">
                                                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                                    <p className="text-sm">Cart is empty</p>
                                                </div>
                                            ) : (
                                                cart.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-start justify-between gap-2 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-sm truncate">{item.productName}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {item.quantity} × Rs {item.unitPrice.toLocaleString()}
                                                            </p>
                                                            <p className="text-sm font-bold mt-1">
                                                                Rs {item.totalPrice.toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 flex-shrink-0"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <label className="block text-sm font-medium mb-3">Payment Method</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => setPaymentType("CASH")}
                                                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                                                        paymentType === "CASH"
                                                            ? "border-green-500 bg-green-500 text-white shadow-lg"
                                                            : "border-gray-200 dark:border-gray-700 hover:border-green-300"
                                                    }`}
                                                >
                                                    <Banknote className="h-5 w-5" />
                                                    <span className="font-semibold text-sm">CASH</span>
                                                </button>
                                                <button
                                                    onClick={() => setPaymentType("CREDIT")}
                                                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                                                        paymentType === "CREDIT"
                                                            ? "border-orange-500 bg-orange-500 text-white shadow-lg"
                                                            : "border-gray-200 dark:border-gray-700 hover:border-orange-300"
                                                    }`}
                                                >
                                                    <CreditCard className="h-5 w-5" />
                                                    <span className="font-semibold text-sm">CREDIT</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-base font-semibold">Total Amount</span>
                                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                                                    Rs {calculateTotal().toLocaleString()}
                                                </span>
                                            </div>

                                            <Button
                                                onClick={handleCheckout}
                                                disabled={cart.length === 0 || !selectedCustomer || !transactionId.trim() || isSubmitting}
                                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 shadow-lg text-base py-6"
                                            >
                                                <DollarSign className="mr-2 h-5 w-5" />
                                                {isSubmitting ? "Processing..." : "Complete Sale"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
