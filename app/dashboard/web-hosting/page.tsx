"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const today = new Date();

function calcProgress(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const t = today.getTime();
  const pct = Math.round(((t - s) / (e - s)) * 100);
  return Math.max(pct, 0);
}

function daysLabel(end: string | null) {
  if (!end) return null;
  const e = new Date(end).getTime();
  const diff = Math.round((e - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: `Vencido hace ${Math.abs(diff)} días`, color: "text-red-400" };
  if (diff === 0) return { text: "Vence hoy", color: "text-red-400" };
  if (diff <= 30) return { text: `Faltan ${diff} días`, color: "text-yellow-400" };
  return { text: `Faltan ${diff} días`, color: "text-gray-400" };
}

function getEstado(pct: number | null) {
  if (pct === null) return { label: "Sin fecha", cls: "bg-gray-800 text-gray-400" };
  if (pct >= 100) return { label: "Vencido", cls: "bg-red-900/40 text-red-400" };
  if (pct >= 61) return { label: "Por vencer", cls: "bg-yellow-900/40 text-yellow-400" };
  return { label: "Activo", cls: "bg-green-900/40 text-green-400" };
}

function CircleProgress({ pct }: { pct: number | null }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const displayPct = pct === null ? 0 : Math.min(pct, 100);
  const color =
    pct === null ? "#4b5563"
    : pct >= 100 ? "#ef4444"
    : pct >= 61 ? "#eab308"
    : "#22c55e";
  const stroke = (displayPct / 100) * circ;

  return (
    <div className="flex items-center justify-center">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#1f2937" strokeWidth="7" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${stroke} ${circ}`} strokeLinecap="round" transform="rotate(-90 36 36)" />
        <text x="36" y="41" textAnchor="middle" fontSize="13" fontWeight="bold" fill="white">
          {pct === null ? "—" : `${displayPct}%`}
        </text>
      </svg>
    </div>
  );
}

const clients = [
  { id: "centro-motos-uruguay", name: "Centro Motos Uruguay", hosting: "Siteground", dominio: "Gestión del Cliente", plan: "Anual Starter", inicio: "2025-03-10", vence: "2026-03-10", nota: "⚠️ Renovar a Bi-Anual" },
  { id: "franca-comics", name: "Franca Comics", hosting: "Siteground", dominio: "Hosting Montevideo", plan: "Anual Starter", inicio: "2025-05-18", vence: "2026-05-18", nota: "⚠️ Renovar a Bi-Anual" },
  { id: "finrel", name: "Finrel", hosting: "Siteground", dominio: "Hosting Montevideo", plan: "Hosting Bi-Anual", inicio: "2024-06-27", vence: "2026-06-27", nota: null },
  { id: "vistalsur", name: "Vistalsur", hosting: "Siteground", dominio: "Siteground", plan: "Hosting Bi-Anual", inicio: "2024-07-06", vence: "2026-07-06", nota: null },
  { id: "espacio-chamanga", name: "Espacio Chamangá", hosting: "Siteground", dominio: "Hosting Montevideo", plan: "Hosting Bi-Anual", inicio: "2025-05-02", vence: "2027-05-02", nota: null },
  { id: "jt-de-leon", name: "JT de León", hosting: "Siteground", dominio: "Gestión del Cliente", plan: "Hosting Bi-Anual", inicio: "2025-11-05", vence: "2027-11-05", nota: null },
  { id: "pastas-florida", name: "Pastas Florida", hosting: "Siteground", dominio: "Hosting Montevideo", plan: "Hosting Bi-Anual", inicio: "2025-08-06", vence: "2027-08-06", nota: null },
];

const FILTERS = ["Todos", "Activo", "Por vencer", "Vencido", "Sin fecha"];

export default function WebHostingPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const pct = calcProgress(c.inicio, c.vence);
    let matchFilter = true;
    if (filter === "Activo") matchFilter = pct !== null && pct < 61;
    if (filter === "Por vencer") matchFilter = pct !== null && pct >= 61 && pct < 100;
    if (filter === "Vencido") matchFilter = pct !== null && pct >= 100;
    if (filter === "Sin fecha") matchFilter = pct === null;
    return matchSearch && matchFilter;
  });

  const vencidos = clients.filter(c => (calcProgress(c.inicio, c.vence) ?? 0) >= 100).length;
  const porVencer = clients.filter(c => { const p = calcProgress(c.inicio, c.vence); return p !== null && p >= 61 && p < 100; }).length;
  const dominiosGestionados = clients.filter(c => c.dominio === "Gestión del Cliente").length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
            ← Volver al dashboard
          </button>
          <span className="text-gray-600">|</span>
          <span className="text-lg font-semibold">⚡ LabOS</span>
        </div>
      </header>

      <main className="px-6 py-8 max-w-7xl mx-auto">
        
        {/* HEADER CON BOTONES */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">🌐 Web / Hosting</h2>
            <p className="text-gray-400 mt-1 text-sm">Gestión de servicios activos</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/dashboard/web-hosting/planes")}
              className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
            >
              Planes
            </button>

            <button
              onClick={() => router.push("/dashboard/web-hosting/nuevo")}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors"
            >
              + Nuevo servicio
            </button>
          </div>
        </div>

        {/* INDICADORES */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Total Servicios</p>
            <p className="text-2xl font-bold text-white">{clients.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Servicios Activos</p>
            <p className="text-2xl font-bold text-green-400">{clients.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Dominios Cliente</p>
            <p className="text-2xl font-bold text-blue-400">{dominiosGestionados}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Vencidos / Por vencer</p>
            <p className="text-2xl font-bold text-red-400">{vencidos} / {porVencer}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Buscar servicio..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === f ? "bg-blue-600 text-white" : "bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">Servicio</th>
                <th className="text-left px-5 py-3">Hosting</th>
                <th className="text-left px-5 py-3">Dominio</th>
                <th className="text-left px-5 py-3">Plan</th>
                <th className="text-left px-5 py-3">Vence</th>
                <th className="text-center px-5 py-3">Estado</th>
                <th className="text-center px-5 py-3">%</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const pct = calcProgress(c.inicio, c.vence);
                const days = daysLabel(c.vence);
                const estado = getEstado(pct);
                return (
                  <tr key={i}
                    onClick={() => router.push(`/dashboard/web-hosting/cliente/${c.id}`)}
                    className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors cursor-pointer group">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                        {c.name}
                      </p>
                      {c.nota && (
                        <span className="inline-block mt-1 text-xs bg-red-900/40 text-red-400 px-2 py-0.5 rounded-full">
                          {c.nota}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-300">{c.hosting}</td>
                    <td className="px-5 py-4 text-gray-300">{c.dominio}</td>
                    <td className="px-5 py-4 text-gray-300">{c.plan}</td>
                    <td className="px-5 py-4">
                      {c.vence ? (
                        <>
                          <p className="text-gray-300">
                            {new Date(c.vence + "T12:00:00").toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                          {days && <p className={`text-xs mt-1 ${days.color}`}>{days.text}</p>}
                        </>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${estado.cls}`}>
                        {estado.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <CircleProgress pct={pct} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">
              No se encontraron servicios con ese criterio
            </div>
          )}
        </div>
      </main>
    </div>
  );
}