"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useFormStatus } from "react-dom";
import { AtSign, User, ShieldCheck, ArrowRight, BookOpen } from "lucide-react";
import { login, register } from "../lib/actions";

export default function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [_, setError] = useState<string | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setError(null);
        try {
            if (isLogin) {
                await login(formData);
            } else {
                await register(formData);
            }
        } catch (error) {
            console.error(error);
            const errorMessage = "Authentication failed. Please check your details.";
            toast.error(errorMessage);
            setError(errorMessage);
        }
    };

    return (
        <div className="flex w-full min-h-screen items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-lg"
            >
                <div className="glass rounded-3xl p-1 md:p-2 overflow-hidden shadow-2xl border border-white/10">

                    {/* Header */}
                    <div className="text-center pt-8 pb-6 px-8 relative">
                        <div className="absolute top-0 inset-x-0 h-32 bg-linear-to-b from-primary/10 to-transparent pointer-events-none" />
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-primary to-accent-blue shadow-lg shadow-primary/25 mb-5 text-white">
                            <BookOpen size={28} />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                            {isLogin ? "Welcome Back" : "Student Register"}
                        </h2>
                        <p className="text-zinc-400 text-sm">
                            {isLogin
                                ? "Enter your academic credentials to access your transcripts."
                                : "Create your account to start managing your grades."}
                        </p>
                    </div>

                    {/* Form Container */}
                    <div className="bg-black/20 rounded-2xl p-6 md:p-8 backdrop-blur-sm border-t border-white/5">
                        <form action={handleSubmit} className="space-y-5">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-1.5"
                                >
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            name="name"
                                            type="text"
                                            placeholder="e.g. John Doe"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-white placeholder:text-zinc-600 outline-none"
                                            required={!isLogin}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Reg. Number</label>
                                    <div className="relative group">
                                        <ShieldCheck className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            name="registrationNumber"
                                            type="text"
                                            placeholder="Registration No"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-white placeholder:text-zinc-600 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Roll Number</label>
                                    <div className="relative group">
                                        <AtSign className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            name="rollNumber"
                                            type="text"
                                            placeholder="Roll No"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-white placeholder:text-zinc-600 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>



                            <div className="pt-4">
                                <SubmitButton isLogin={isLogin} />
                            </div>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                type="button"
                                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                                className="text-sm text-zinc-400 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4 hover:decoration-white"
                            >
                                {isLogin
                                    ? "Don't have an account? Register here."
                                    : "Already registered? Login instead."}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function SubmitButton({ isLogin }: { isLogin: boolean }) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
        >
            {pending ? (
                <span className="animate-pulse">Processing...</span>
            ) : (
                <>
                    {isLogin ? "Access Account" : "Create Account"}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
            )}
        </button>
    );
}