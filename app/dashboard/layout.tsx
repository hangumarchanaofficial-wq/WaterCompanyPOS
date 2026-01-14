// app/dashboard/layout.tsx
import { Home, ShoppingCart, Users, Package, BarChart3, CreditCard } from "lucide-react";
import Link from "next/link";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Sales", href: "/dashboard/sales", icon: ShoppingCart },
    { name: "Customers", href: "/dashboard/customers", icon: Users },
    { name: "Pay Debt", href: "/dashboard/payments", icon: CreditCard },
    { name: "Inventory", href: "/dashboard/inventory", icon: Package },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
];

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                            <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">Beverage POS</h1>
                            <p className="text-xs text-muted-foreground">Inventory System</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            N
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">Admin User</p>
                            <p className="text-xs text-muted-foreground truncate">admin@pos.com</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
