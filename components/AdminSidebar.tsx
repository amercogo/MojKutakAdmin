"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { LayoutDashboard, LogOut, FileText } from "lucide-react";
import Image from "next/image";

/**
 * AdminSidebar Component
 * 
 * Redesigned navigation sidebar.
 * Features:
 * - Background: `m3.png` with cover fit.
 * - Style: Glassmorphism (white overlay + blur).
 * - Shape: Rounded right corners.
 * - Typography: Uppercase, dark text.
 */
export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
        router.refresh();
    };

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-72 flex-shrink-0">

            {/* CONTAINER: Rounded Corners & Overflow Control */}
            <div className="relative h-full w-full rounded-r-3xl overflow-hidden shadow-2xl">

                {/* 1. BACKGROUND IMAGE (m3.png) */}
                <Image
                    src="/images/m3.png"
                    alt="Sidebar Background"
                    fill
                    className="object-cover z-0"
                    priority
                />

                {/* 2. GLASS OVELAY */}
                <div className="absolute inset-0 bg-white/70 backdrop-blur-md z-10" />

                {/* 3. CONTENT */}
                <div className="relative z-20 flex flex-col h-full">

                    {/* LOGO */}
                    <div className="flex flex-col items-center justify-center pt-10 pb-8">
                        <div className="relative h-24 w-24 mb-4 transform transition-transform duration-500 hover:scale-105">
                            <Image
                                src="/images/logo.jpg"
                                alt="Moj Kutak Logo"
                                fill
                                className="rounded-full object-cover shadow-lg border-4 border-white"
                            />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">
                            Moj Kutak
                        </h2>
                    </div>

                    {/* NAVIGATION */}
                    <nav className="flex-1 px-4 space-y-3">
                        {/* Dashboard Link */}
                        <Link
                            href="/pregled"
                            className={`group relative flex items-center w-full px-6 py-4 transition-all duration-300 border-l-4
                            ${pathname === "/pregled"
                                    ? "border-[var(--color-brand-blue)] bg-black/10 text-gray-900"
                                    : "border-transparent text-gray-700 hover:bg-black/5 hover:text-gray-900 hover:border-[var(--color-brand-blue)]"
                                }`}
                        >
                            <LayoutDashboard className={`mr-4 h-6 w-6 transition-transform duration-300 ${pathname === "/pregled" ? "text-[var(--color-brand-blue)] scale-110" : "text-gray-500 group-hover:text-[var(--color-brand-blue)] group-hover:scale-110"}`} />
                            <span className="text-sm font-extrabold tracking-wider uppercase">
                                Pregled
                            </span>
                        </Link>

                        {/* Objave Link */}
                        <Link
                            href="/objave"
                            className={`group relative flex items-center w-full px-6 py-4 transition-all duration-300 border-l-4
                            ${pathname === "/objave"
                                    ? "border-[var(--color-brand-blue)] bg-black/10 text-gray-900"
                                    : "border-transparent text-gray-700 hover:bg-black/5 hover:text-gray-900 hover:border-[var(--color-brand-blue)]"
                                }`}
                        >
                            <FileText className={`mr-4 h-6 w-6 transition-transform duration-300 ${pathname === "/objave" ? "text-[var(--color-brand-blue)] scale-110" : "text-gray-500 group-hover:text-[var(--color-brand-blue)] group-hover:scale-110"}`} />
                            <span className="text-sm font-extrabold tracking-wider uppercase">
                                Objave
                            </span>
                        </Link>
                    </nav>

                    {/* LOGOUT */}
                    <div className="p-6">
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center justify-center px-6 py-3 rounded-xl text-red-700 hover:bg-red-50/50 hover:text-red-800 transition-all duration-300 uppercase font-bold text-sm tracking-wide"
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            Odjavi se
                        </button>
                    </div>

                </div>
            </div>
        </aside>
    );
}
