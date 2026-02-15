
"use client";

import Image from "next/image";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useLoginLogic } from "./useLoginLogic";

/**
 * LoginForm Component
 * 
 * This component handles the visual presentation of the login page.
 * It uses the `useLoginLogic` hook to handle all state and interactions.
 */
export default function LoginForm() {
    // Destructure all the logic and state from our custom hook
    const {
        email,
        setEmail,
        password,
        setPassword,
        showPassword,
        togglePasswordVisibility,
        loading,
        error,
        handleLogin,
        handleRegister,
        handleForgotPassword,
    } = useLoginLogic();

    return (
        <div className="flex h-screen w-full bg-neutral-50 dark:bg-neutral-900 overflow-hidden">

            {/* LEFT SECTION: Splash Art / Image */}
            <div className="hidden lg:flex w-1/2 relative h-full overflow-hidden">
                <Image
                    src="/images/m1.png"
                    alt="Moj Kutak Splash Art"
                    priority
                    fill
                    className="object-cover"
                    sizes="50vw"
                />
                <div className="absolute inset-0 bg-black/5" />
            </div>

            {/* RIGHT SECTION: Login Form with M3 Background */}
            <div className="relative flex w-full lg:w-1/2 h-full items-center justify-center p-4 overflow-hidden">

                {/* M3 Background Image for the Form Section */}
                <Image
                    src="/images/m3.png"
                    alt="Background Texture"
                    fill
                    className="object-cover z-0"
                    priority
                />

                {/* Content Container */}
                <div className="relative z-20 w-full max-w-sm space-y-6 bg-white/60 dark:bg-black/60 p-6 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:shadow-blue-900/20">

                    {/* Logo and Welcome Text */}
                    <div className="text-center space-y-2">
                        <div className="relative w-20 h-20 mx-auto mb-4 transform transition-transform duration-500 hover:scale-110">
                            <Image
                                src="/images/logo.jpg"
                                alt="Moj Kutak Logo"
                                fill
                                className="object-contain rounded-full shadow-lg border-2 border-[#FFD700] dark:border-[#FFC000]"
                            />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1E3A8A] dark:text-[#60A5FA] drop-shadow-sm">
                            Dobrodošli nazad
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                            Moj Kutak Admin Panel
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-4 mt-4">

                        {/* Error Alert */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs border border-red-100 animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Email Input */}
                            <div className="space-y-1 group">
                                <label className={`text-xs font-bold transition-colors duration-300 ${email ? "text-[#1E3A8A] dark:text-[#FFD700]" : "text-gray-500 dark:text-gray-400"}`}>
                                    Email
                                </label>
                                <div className="relative transform transition-all duration-300 group-hover:scale-[1.01]">
                                    <Mail className={`absolute left-3 top-2.5 h-4 w-4 transition-colors duration-300 ${email ? "text-[#1E3A8A] dark:text-[#FFD700]" : "text-gray-400"}`} />
                                    <input
                                        type="email"
                                        placeholder="user@mojkutak.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className={`flex h-10 w-full rounded-xl border-2 bg-white/80 dark:bg-black/60 px-3 py-1 pl-9 text-sm shadow-sm transition-all duration-300 caret-[#1E3A8A] dark:caret-[#FFD700]
                                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/10 
                                                   placeholder:text-gray-400 dark:text-gray-100
                                                   ${email
                                                ? "border-[#1E3A8A] dark:border-[#FFD700] shadow-[#1E3A8A]/10"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-1 group">
                                <div className="flex items-center justify-between">
                                    <label className={`text-xs font-bold transition-colors duration-300 ${password ? "text-[#1E3A8A] dark:text-[#FFD700]" : "text-gray-500 dark:text-gray-400"}`}>
                                        Lozinka
                                    </label>
                                </div>
                                <div className="relative transform transition-all duration-300 group-hover:scale-[1.01]">
                                    <Lock className={`absolute left-3 top-2.5 h-4 w-4 transition-colors duration-300 ${password ? "text-[#1E3A8A] dark:text-[#FFD700]" : "text-gray-400"}`} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className={`flex h-10 w-full rounded-xl border-2 bg-white/80 dark:bg-black/60 px-3 py-1 pl-9 pr-9 text-sm shadow-sm transition-all duration-300 caret-[#1E3A8A] dark:caret-[#FFD700]
                                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/10  
                                                   placeholder:text-gray-400 dark:text-gray-100
                                                   ${password
                                                ? "border-[#1E3A8A] dark:border-[#FFD700] shadow-[#1E3A8A]/10"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className={`absolute right-3 top-2.5 transition-colors duration-300 ${password ? "text-[#1E3A8A] dark:text-[#FFD700]" : "text-gray-400 hover:text-[#1E3A8A] dark:hover:text-[#FFD700]"}`}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative overflow-hidden group flex items-center justify-center h-12 rounded-xl font-bold text-white shadow-lg transition-all duration-300 
                                       hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       bg-gradient-to-r from-[#1E3A8A] to-[#2563EB]"
                        >
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2 text-sm">
                                    LOGUJ SE
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Footer Actions */}
                    <div className="space-y-3 text-center text-xs">
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-gray-500 hover:text-[#1E3A8A] dark:hover:text-[#FFD700] font-medium transition-colors"
                        >
                            Zaboravljena lozinka?
                        </button>

                        <div className="text-gray-500 dark:text-gray-400">
                            Nemate nalog?{" "}
                            <button
                                onClick={handleRegister}
                                className="font-bold text-[#1E3A8A] dark:text-[#FFD700] hover:underline transition-colors"
                            >
                                Kontaktirajte administratora!
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
