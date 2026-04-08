"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo conectar. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0d11] bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(59,130,246,0.12),transparent)] text-zinc-100">
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-10 sm:pt-14">
        <div className="mb-10 flex justify-center">
          <div className="inline-flex items-center gap-2.5 text-2xl font-semibold tracking-tight sm:text-3xl">
            <span className="text-3xl leading-none sm:text-4xl" aria-hidden>
              ⚡
            </span>
            <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              LabOS
            </span>
          </div>
        </div>

        <div className="w-full max-w-[400px] rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.65)] backdrop-blur-md">
          <h1 className="mb-6 text-center text-lg font-semibold text-white">
            Iniciar sesión
          </h1>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
            {error ? (
              <p
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-400"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nombre@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none ring-0 transition-colors focus:border-blue-500/80 focus:bg-zinc-900 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-400"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-blue-500/80 focus:bg-zinc-900 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0b0d11] disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
        </div>
      </main>

      <footer className="pb-8 text-center text-sm text-zinc-600">
        Sustancial © 2026
      </footer>
    </div>
  );
}
