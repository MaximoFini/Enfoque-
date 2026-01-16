"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const { signIn, signUp, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);

        try {
            if (isLogin) {
                const { error } = await signIn(email, password);
                if (error) {
                    setError(error);
                } else {
                    router.push("/hoy");
                }
            } else {
                const { error } = await signUp(email, password, fullName);
                if (error) {
                    setError(error);
                } else {
                    setSuccess("¡Cuenta creada! Revisa tu email para confirmar.");
                }
            }
        } catch (err) {
            setError("Ocurrió un error inesperado");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Back button */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al inicio
                </Link>

                {/* Card */}
                <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden">
                    {/* Header */}
                    <div className="gradient-primary p-8 text-white text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                            {isLogin ? (
                                <LogIn className="h-8 w-8" />
                            ) : (
                                <UserPlus className="h-8 w-8" />
                            )}
                        </div>
                        <h1 className="text-2xl font-bold">
                            {isLogin ? "Bienvenido de nuevo" : "Crear cuenta"}
                        </h1>
                        <p className="text-white/80 mt-1">
                            {isLogin
                                ? "Inicia sesión para continuar"
                                : "Regístrate para empezar"}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-5">
                        {/* Error message */}
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Success message */}
                        {success && (
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
                                {success}
                            </div>
                        )}

                        {/* Name field (only for register) */}
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Nombre completo
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Tu nombre"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email field */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || authLoading}
                            className="w-full py-4 rounded-xl gradient-primary text-white font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {isLogin ? "Iniciando sesión..." : "Creando cuenta..."}
                                </>
                            ) : (
                                <>
                                    {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                                    {isLogin ? "Iniciar sesión" : "Crear cuenta"}
                                </>
                            )}
                        </button>

                        {/* Toggle login/register */}
                        <div className="text-center text-sm text-muted-foreground">
                            {isLogin ? (
                                <>
                                    ¿No tienes cuenta?{" "}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsLogin(false);
                                            setError(null);
                                            setSuccess(null);
                                        }}
                                        className="text-primary font-medium hover:underline"
                                    >
                                        Regístrate
                                    </button>
                                </>
                            ) : (
                                <>
                                    ¿Ya tienes cuenta?{" "}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsLogin(true);
                                            setError(null);
                                            setSuccess(null);
                                        }}
                                        className="text-primary font-medium hover:underline"
                                    >
                                        Inicia sesión
                                    </button>
                                </>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
