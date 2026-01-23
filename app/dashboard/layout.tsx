// app/dashboard/layout.tsx
"use client";

import { Home, ShoppingCart, Users, Package, BarChart3, CreditCard, Settings, LogOut, Receipt } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Sales", href: "/dashboard/sales", icon: ShoppingCart },
    { name: "Transactions", href: "/dashboard/transactions", icon: Receipt },
    { name: "Customers", href: "/dashboard/customers", icon: Users },
    { name: "Pay Debt", href: "/dashboard/payments", icon: CreditCard },
    { name: "Inventory", href: "/dashboard/inventory", icon: Package },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);
    const [userEmail, setUserEmail] = useState("Admin User");
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    console.log("No session found, redirecting to login");
                    router.push('/login');
                } else {
                    console.log("Session found, user authenticated");
                    setIsCheckingAuth(false);
                }
            } catch (error) {
                console.error("Auth check error:", error);
                router.push('/login');
            }
        };

        checkAuth();
    }, [router]);

    // Get user info
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setUserEmail(user.email.split('@')[0]);
            }
        };
        getUser();
    }, []);

    const handleLogout = async () => {
        if (loggingOut) return;

        const confirmed = window.confirm("Are you sure you want to logout?");
        if (!confirmed) return;

        setLoggingOut(true);
        try {
            await supabase.auth.signOut();
            localStorage.removeItem("isAuthenticated");
            localStorage.removeItem("userId");

            console.log("Logged out successfully");
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout error:", error);
            alert("Failed to logout. Please try again.");
            setLoggingOut(false);
        }
    };

    // Show loading spinner while checking auth
    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 border-4 border-[#0ea5e9] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 text-sm">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#0a0e1a] overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-[#1a2332] border-r border-[#2d3748] flex flex-col shadow-2xl">
                {/* Logo */}
                <div className="p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-[#0ea5e9] to-blue-600 rounded-lg w-10 h-10 flex items-center justify-center shadow-lg shadow-[#0ea5e9]/20">
                            <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white text-lg font-bold leading-tight tracking-tight">
                                BevPOS
                            </h1>
                            <p className="text-slate-400 text-xs font-medium">
                                Enterprise Inventory
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Main Menu
                    </p>
                    {navigation.slice(0, 6).map((item) => {
                        const isActive = pathname === item.href ||
                            (pathname?.startsWith(item.href) && item.href !== '/dashboard');

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
                                    ${isActive
                                    ? 'bg-[#0ea5e9] text-white shadow-md shadow-[#0ea5e9]/20'
                                    : 'text-slate-400 hover:text-white hover:bg-[#0f172a]'
                                }
                                `}
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}

                    <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mt-6 mb-3">
                        Analytics
                    </p>
                    {navigation.slice(6).map((item) => {
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
                                    ${isActive
                                    ? 'bg-[#0ea5e9] text-white shadow-md shadow-[#0ea5e9]/20'
                                    : 'text-slate-400 hover:text-white hover:bg-[#0f172a]'
                                }
                                `}
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile with Logout */}
                <div className="p-4 border-t border-[#2d3748]" style={{ marginTop: '2px' }}>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0f172a] border border-[#2d3748]">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg text-sm">
                            {userEmail.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium leading-none truncate capitalize">
                                {userEmail}
                            </p>
                            <p className="text-slate-400 text-xs mt-1 truncate">
                                Admin Access
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group relative"
                            title="Logout"
                        >
                            {loggingOut ? (
                                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <LogOut className="h-5 w-5" />
                            )}
                            <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-[#0f172a] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Logout
                            </span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Page Content */}
                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    {children}
                </main>
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
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
            `}</style>
        </div>
    );
}
