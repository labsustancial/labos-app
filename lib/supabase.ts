import { createClient as _createClient, SupabaseClient } from "@supabase/supabase-js";

let instance: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (instance) return instance;
  instance = _createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        storageKey: "labos-auth",
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    }
  );
  return instance;
}