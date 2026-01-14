"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { customersService } from "@/services/customersService";

export default function CustomersPage() {
    const { customers, loading, refetch } = useCustomers();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            Customers
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your customer database
                        </p>
                    </div>
                    <Button
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                        onClick={() => setShowAddModal(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Customer
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-50">
                                Total Customers
                            </CardTitle>
                            <Users className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalCustomers}</div>
                            <p className="text-xs text-blue-100 mt-1">Registered customers</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-50">
                                With Credit
                            </CardTitle>
                            <TrendingUp className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.customersWithCredit}</div>
                            <p className="text-xs text-orange-100 mt-1">Have outstanding debt</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-red-50">
                                Total Credit
                            </CardTitle>
                            <DollarSign className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                Rs {summary.totalCredit.toLocaleString()}
                            </div>
                            <p className="text-xs text-red-100 mt-1">Outstanding amount</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-purple-50">
                                Avg Credit
                            </CardTitle>
                            <User className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                Rs {Math.round(summary.avgCredit).toLocaleString()}
                            </div>
                            <p className="text-xs text-purple-100 mt-1">Per debtor</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <Card className="shadow-lg border-none mb-6">
                    <CardContent className="pt-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search customers by name or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Customers List */}
                <Card className="shadow-lg border-none">
                    <CardHeader>
                        <CardTitle>All Customers</CardTitle>
                        <CardDescription>
                            Showing {filteredCustomers.length} of {customers.length} customers
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Loading customers...
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No customers found</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {filteredCustomers.map((customer) => (
                                    <div
                                        key={customer.id}
                                        className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors border-2 border-transparent hover:border-blue-500"
                                    >
                                        {/* Customer Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                                                <User className="h-6 w-6 text-white" />
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setSelectedCustomer(customer)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Customer Info */}
                                        <div>
                                            <p className="font-bold text-base truncate mb-2">
                                                {customer.name}
                                            </p>

                                            {/* Phone */}
                                            {customer.phone && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                    <Phone className="h-3 w-3" />
                                                    <span>{customer.phone}</span>
                                                </div>
                                            )}

                                            {/* Address */}
                                            {customer.address && (
                                                <div className="flex items-start gap-2 text-xs text-muted-foreground mb-3">
                                                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-2">{customer.address}</span>
                                                </div>
                                            )}

                                            {/* Credit Balance */}
                                            <div className="mt-3 pt-3 border-t">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">
                                                        Credit Balance
                                                    </span>
                                                    {customer.credit_balance > 0 ? (
                                                        <Badge variant="destructive">
                                                            Rs {customer.credit_balance.toLocaleString()}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-green-600">
                                                            Paid
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit Customer Modal */}
            {selectedCustomer && (
                <EditCustomerModal
                    customer={selectedCustomer}
                    onClose={() => {
                        setSelectedCustomer(null);
                        refetch();
                    }}
                />
            )}

            {/* Add Customer Modal */}
            {showAddModal && (
                <AddCustomerModal
                    onClose={() => {
                        setShowAddModal(false);
                        refetch();
                    }}
                />
            )}
        </div>
    );
}

// Edit Customer Modal Component
function EditCustomerModal({ customer, onClose }: { customer: any; onClose: () => void }) {
    const [name, setName] = useState(customer.name);
    const [phone, setPhone] = useState(customer.phone || "");
    const [address, setAddress] = useState(customer.address || "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("Please enter customer name");
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

            alert("Customer updated successfully!");
            onClose();
        } catch (error) {
            console.error("Error updating customer:", error);
            alert("Failed to update customer");
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
                            <CardTitle>Edit Customer</CardTitle>
                            <CardDescription className="mt-1">
                                Update customer information
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
                            <Label htmlFor="name">
                                Customer Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="Enter customer name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="Enter phone number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                placeholder="Enter address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
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
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}

// Add Customer Modal Component
function AddCustomerModal({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("Please enter customer name");
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

            alert("Customer added successfully!");
            onClose();
        } catch (error) {
            console.error("Error adding customer:", error);
            alert("Failed to add customer");
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
                            <CardTitle>Add Customer</CardTitle>
                            <CardDescription className="mt-1">
                                Create a new customer
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
                            <Label htmlFor="name">
                                Customer Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="Enter customer name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="Enter phone number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                placeholder="Enter address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
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
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Adding..." : "Add Customer"}
                            </Button>
                        </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
