"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button
                className="relative h-10 w-10 rounded-xl bg-secondary flex items-center justify-center"
                aria-label="Toggle theme"
            >
                <Sun className="h-5 w-5 text-muted-foreground" />
            </button>
        );
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative h-10 w-10 rounded-xl bg-secondary hover:bg-accent flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Toggle theme"
        >
            {theme === "dark" ? (
                <Sun className="h-5 w-5 text-accent-foreground" />
            ) : (
                <Moon className="h-5 w-5 text-accent-foreground" />
            )}
        </button>
    );
}
