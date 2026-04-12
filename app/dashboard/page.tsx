"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

const modules = [
  {
    icon: "🌐",
    title: "Web / Hosting",
    description: "Gestión de sitios web y servicios de hosting activos",
    href: "/dashboard/web-hosting",
    available: true,
  },
  {
    icon: "📱",
    title: "SMM",
    description: "Gestión de clientes y ciclos mensuales",
    href: "/dashboard/smm",
    available: false,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.push("/");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">⚡</span>
          <span className="text-lg font-semibold tracking-tight">LabOS</span>
        </div>
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm font-medium text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
        >
          {loading ? "Cerrando sesión…" : "Cerrar sesión"}
        </button>
      </header>

      <main className="px-6 py-10 max-w-5xl mx-auto">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Servicios</h1>
          <p className="text-gray-400 mt-1 text-sm">Seleccioná un módulo para abrir su panel de gestión</p>
        </div>

        {/* Tarjetas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((m) =>
            m.available ? (
              <button
                key={m.title}
                onClick={() => router.push(m.href)}
                className="group relative flex flex-col text-left rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-gray-600 hover:bg-gray-800/80 transition-all duration-200"
              >
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-2xl group-hover:border-gray-600 transition-colors">
                  {m.icon}
                </span>
                <span className="text-lg font-semibold text-white">{m.title}</span>
                <span className="mt-2 text-sm text-gray-500 group-hover:text-gray-400 transition-colors leading-relaxed">
                  {m.description}
                </span>
              </button>
            ) : (
              <div
                key={m.title}
                className="relative flex flex-col rounded-2xl border border-gray-800/50 bg-gray-900/40 p-6 opacity-70"
              >
                <span className="absolute right-4 top-4 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-200/80">
                  Próximamente
                </span>
                <span className="mb-4 mt-1 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 text-2xl text-gray-500">
                  {m.icon}
                </span>
                <span className="text-lg font-semibold text-gray-500">{m.title}</span>
                <span className="mt-2 text-sm text-gray-600 leading-relaxed">{m.description}</span>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}