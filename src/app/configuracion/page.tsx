"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { User, Bell, Palette, Shield, Database, HelpCircle, LogOut, Target, LogIn } from "lucide-react";
import Link from "next/link";

export default function ConfiguracionPage() {
    const { user, isLoading, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    const settingsSections = [
        {
            title: "Metas",
            icon: Target,
            items: [
                { label: "Metas Semanales", description: "Configura horas por categoría", href: "/configuracion/metas-semanales" },
            ],
        },
        {
            title: "Cuenta",
            icon: User,
            items: [
                { label: "Perfil", description: "Nombre, foto, información personal" },
                { label: "Cuenta", description: "Email, contraseña, sesiones" },
            ],
        },
        {
            title: "Preferencias",
            icon: Palette,
            items: [
                { label: "Tema", description: "Modo claro u oscuro", hasToggle: true },
                { label: "Notificaciones", description: "Alertas y recordatorios" },
                { label: "Idioma", description: "Español" },
            ],
        },
    ];

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuario";
    const displayEmail = user?.email || "No conectado";
    const displayInitial = displayName.charAt(0).toUpperCase();

    return (
        <MainLayout title="Configuración">
            <div className="space-y-6 max-w-3xl">
                {/* User profile card */}
                <Card className="overflow-hidden">
                    <div className="gradient-primary p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                                <span className="text-3xl font-bold text-white">{displayInitial}</span>
                            </div>
                            <div className="text-white">
                                <h2 className="text-xl font-bold">{displayName}</h2>
                                <p className="text-white/80">{displayEmail}</p>
                                <p className="text-sm text-white/60 mt-1">
                                    {user ? "Plan: Free" : "No has iniciado sesión"}
                                </p>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-4">
                        {user ? (
                            <Link
                                href="/configuracion"
                                className="block w-full p-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-sm font-medium text-foreground text-center"
                            >
                                Editar perfil
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-2 w-full p-3 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                                <LogIn className="h-4 w-4" />
                                Iniciar sesión
                            </Link>
                        )}
                    </CardContent>
                </Card>

                {/* Settings sections */}
                {settingsSections.map((section) => (
                    <Card key={section.title}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <section.icon className="h-5 w-5 text-primary" />
                                {section.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const content = (
                                        <>
                                            <div>
                                                <p className="font-medium text-foreground">{item.label}</p>
                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                            </div>
                                            {'hasToggle' in item && item.hasToggle ? (
                                                <ThemeToggle />
                                            ) : (
                                                <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            )}
                                        </>
                                    );

                                    if ('href' in item && item.href) {
                                        return (
                                            <Link
                                                key={item.label}
                                                href={item.href}
                                                className="w-full p-4 rounded-xl hover:bg-secondary/50 transition-colors flex items-center justify-between text-left"
                                            >
                                                {content}
                                            </Link>
                                        );
                                    }

                                    // Use div instead of button when hasToggle to avoid button nesting
                                    if ('hasToggle' in item && item.hasToggle) {
                                        return (
                                            <div
                                                key={item.label}
                                                className="w-full p-4 rounded-xl hover:bg-secondary/50 transition-colors flex items-center justify-between text-left"
                                            >
                                                {content}
                                            </div>
                                        );
                                    }

                                    return (
                                        <button
                                            key={item.label}
                                            className="w-full p-4 rounded-xl hover:bg-secondary/50 transition-colors flex items-center justify-between text-left"
                                        >
                                            {content}
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Danger zone - only show if logged in */}
                {user && (
                    <Card className="border-red-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-500">
                                <Shield className="h-5 w-5" />
                                Zona de peligro
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <button
                                onClick={handleSignOut}
                                className="w-full p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-between text-left border border-red-500/20"
                            >
                                <div>
                                    <p className="font-medium text-red-500">Cerrar sesión</p>
                                    <p className="text-sm text-muted-foreground">Salir de tu cuenta</p>
                                </div>
                                <LogOut className="h-5 w-5 text-red-500" />
                            </button>
                        </CardContent>
                    </Card>
                )}

                {/* Footer */}
                <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                        Enfoque App v0.1.0 • Hecho con 💜 para estudiantes
                    </p>
                </div>
            </div>
        </MainLayout>
    );
}
