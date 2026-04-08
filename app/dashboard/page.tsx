"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.push("/babysit");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0d11] text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0d11]/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <div className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight sm:text-xl">
            <span className="text-2xl leading-none" aria-hidden>
              ⚡
            </span>
            <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              LabOS
            </span>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0b0d11] disabled:pointer-events-none disabled:opacity-60"
          >
            {loading ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center px-4 py-14">
        <h1 className="text-2xl font-semibold">LabOS — Panel</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Sesión iniciada correctamente.
        </p>
      </main>
    </div>
  );
}
