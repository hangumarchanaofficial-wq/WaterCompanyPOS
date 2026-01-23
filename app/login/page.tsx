// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Lock, User, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    // Check if user is already logged in
    useEffect(() => {
        const checkExistingSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    console.log("Already logged in, redirecting to dashboard");
                    router.push('/dashboard');
                } else {
                    setCheckingSession(false);
                }
            } catch (error) {
                console.error("Session check error:", error);
                setCheckingSession(false);
            }
        };

        checkExistingSession();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: username,
                password: password,
            });

            if (signInError) {
                console.error("Login error:", signInError);
                setError("Invalid username or password");
                setLoading(false);
                return;
            }

            if (data.user && data.session) {
                console.log("Login successful! User:", data.user.email);

                // Store session
                localStorage.setItem("isAuthenticated", "true");
                localStorage.setItem("userId", data.user.id);

                // Redirect to dashboard
                window.location.href = "/dashboard";
            } else {
                setError("Login failed. Please try again.");
                setLoading(false);
            }
        } catch (err) {
            console.error("Caught error:", err);
            setError("An error occurred. Please try again.");
            setLoading(false);
        }
    };

    // Show loading while checking session
    if (checkingSession) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#1a2332] to-[#0a0e1a] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 border-4 border-[#0ea5e9] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 text-sm">Checking session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#1a2332] to-[#0a0e1a] flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden opacity-10">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0ea5e9] rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#0ea5e9] to-blue-600 rounded-2xl shadow-2xl shadow-[#0ea5e9]/30 mb-4">
                        <Package className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">BevPOS</h1>
                    <p className="text-slate-400 text-sm">Enterprise Inventory System</p>
                </div>

                {/* Login Card */}
                <div className="bg-[#1a2332] border border-[#2d3748] rounded-2xl shadow-2xl p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                        <p className="text-slate-400 text-sm">Sign in to access your dashboard</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                            <p className="text-red-500 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Username Field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="email"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-[#0f172a] border border-[#2d3748] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all"
                                    placeholder="admin@bevpos.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-[#0f172a] border border-[#2d3748] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-[#0ea5e9] to-blue-600 hover:from-[#0284c7] hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-[#0ea5e9]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Signing in...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-sm mt-6">
                    © 2026 BevPOS. All rights reserved.
                </p>
            </div>
        </div>
    );
}
