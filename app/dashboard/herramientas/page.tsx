"use client";

import { useRouter } from "next/navigation";

export default function HerramientasPage() {
  const router = useRouter();

  const herramientas = [
    {
      id: "generador-eventos",
      icon: "📋",
      nombre: "Generador de eventos",
      descripcion: "Creá formularios de registro para eventos con campos personalizados",
      badge: "Nuevo",
      badgeColor: "bg-green-600",
      href: "/dashboard/herramientas/generador-eventos",
    },
    {
      id: "acortador-url",
      icon: "🔗",
      nombre: "Acortador de URL",
      descripcion: "Acortá links largos, registrá clics y conocé el origen del tráfico",
      badge: "Nuevo",
      badgeColor: "bg-green-600",
      href: "/dashboard/herramientas/acortador-url",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push("/dashboard")}
          className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Volver al dashboard
        </button>
        <span className="text-gray-600">|</span>
        <span className="text-lg font-semibold">⚡ LabOS</span>
      </header>

      <main className="px-6 py-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">🛠️ Herramientas</h1>
          <p className="text-gray-400 mt-1 text-sm">Utilidades para gestión y marketing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {herramientas.map(h => (
            <button key={h.id} onClick={() => router.push(h.href)}
              className="text-left bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-6 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{h.icon}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full text-white ${h.badgeColor}`}>
                  {h.badge}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                {h.nombre}
              </h2>
              <p className="text-sm text-gray-400 mt-1">{h.descripcion}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}