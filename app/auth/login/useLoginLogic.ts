
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

// Define the interface for the return type of useLoginLogic
interface UseLoginLogicReturn {
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
    showPassword: boolean;
    togglePasswordVisibility: () => void;
    loading: boolean;
    error: string | null;
    handleLogin: (e: React.FormEvent) => Promise<void>;
    handleRegister: () => void;
    handleForgotPassword: () => void;
}

/**
 * Custom hook that encapsulates all the business logic for the Login Page.
 * This separates the logic from the UI (LoginForm.tsx), making the code cleaner and easier to maintain.
 */
export function useLoginLogic(): UseLoginLogicReturn {
    const router = useRouter();
    const supabase = createClient();

    // State for form inputs and UI feedback
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Toggles the visibility of the password field.
     */
    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    /**
     * Handles the login form submission.
     * Connects to Supabase Auth to sign in the user.
     */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Attempt to sign in with email and password using Supabase Auth
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                throw authError;
            }

            // On successful login, redirect to the dashboard (or home page)
            router.push("/");
            router.refresh(); // Refresh to update server components with new session
        } catch (err: any) {
            console.error("Login Error:", err);
            // Set a user-friendly error message
            setError(err.message || "Došlo je do greške prilikom prijave.");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Placeholder for registration navigation or modal.
     * Currently just logs to console as per initial requirements.
     */
    const handleRegister = () => {
        // For now, maybe redirect to a registration page or show a message
        console.log("Navigate to register");
        // router.push("/auth/register");
    };

    /**
     * Placeholder for forgot password functionality.
     */
    const handleForgotPassword = () => {
        console.log("Navigate to forgot password");
        // router.push("/auth/forgot-password");
    };

    return {
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
    };
}
