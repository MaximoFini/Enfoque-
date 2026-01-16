import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a null-safe Supabase client that won't crash if env vars are missing
let supabaseInstance: SupabaseClient<Database> | null = null;

if (supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
} else {
    console.warn(
        "Supabase environment variables not configured. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
}

export const supabase = supabaseInstance;

// Helper to get the Supabase client
export function getSupabaseClient(): SupabaseClient<Database> | null {
    return supabase;
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
    return supabase !== null;
}
