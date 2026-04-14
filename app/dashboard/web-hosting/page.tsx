"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface Servicio {
  id: string;
  cliente_id: string;
  plan_id: string;
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  hosting_proveedor: string | null;
  dominio_proveedor: string | null;
  dominio_principal: string | null;
  estado: string;
  nota: string | null;
  clientes: { nombre: string; razon_social?: string };
  planes: { nombre: string };
}

const today = new Date();

function calcProgress(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const pct = Math.round(((today.getTime() - new Date(start).getTime()) / (new Date(end).getTime() - new Date(start).getTime())) * 100);
  return Math.max(pct, 0);
}

function daysLabel(end: string | null) {
  if (!end) return null;
  const diff = Math.round((new Date(end).getTime() - today.getTime()) / 86400000);
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
  const r = 28; const circ = 2 * Math.PI * r;
  const displayPct = pct === null ? 0 : Math.min(pct, 100);
  const color = pct === null ? "#4b5563" : pct >= 100 ? "#ef4444" : pct >= 61 ? "#eab308" : "#22c55e";
  return (
    <div className="flex items-center justify-center">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#1f2937" strokeWidth="7" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${(displayPct / 100) * circ} ${circ}`}
          strokeLinecap="round" transform="rotate(-90 36 36)" />
        <text x="36" y="41" textAnchor="middle" fontSize="13" fontWeight="bold" fill="white">
          {pct === null ? "—" : `${displayPct}%`}
        </text>
      </svg>
    </div>
  );
}

const FILTERS = ["Todos", "Activo", "Por vencer", "Vencido", "Sin fecha"];

export default function WebHostingPage() {
  const router = useRouter();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("servicios").select(`
        id, cliente_id, plan_id, fecha_inicio, fecha_vencimiento,
        hosting_proveedor, dominio_proveedor, dominio_principal, estado, nota,
        clientes(nombre, razon_social),
        planes(nombre)
      `)
      .eq("modulo", "web-hosting")
      .eq("estado", "activo")
      .then(({ data }) => {
        if (data) setServicios(data as any);
        setLoading(false);
      });
  }, []);

  const filtered = servicios.filter(s => {
    const dominio = s.dominio_principal ?? "";
    const nombre = s.clientes?.nombre ?? "";
    const matchSearch =
      dominio.toLowerCase().includes(search.toLowerCase()) ||
      nombre.toLowerCase().includes(search.toLowerCase());
    const pct = calcProgress(s.fecha_inicio, s.fecha_vencimiento);
    let matchFilter = true;
    if (filter === "Activo") matchFilter = pct !== null && pct < 61;
    if (filter === "Por vencer") matchFilter = pct !== null && pct >= 61 && pct < 100;
    if (filter === "Vencido") matchFilter = pct !== null && pct >= 100;
    if (filter === "Sin fecha") matchFilter = pct === null;
    return matchSearch && matchFilter;
  });

  const vencidos = servicios.filter(s => (calcProgress(s.fecha_inicio, s.fecha_vencimiento) ?? 0) >= 100).length;
  const porVencer = servicios.filter(s => { const p = calcProgress(s.fecha_inicio, s.fecha_vencimiento); return p !== null && p >= 61 && p < 100; }).length;
  const dominiosCliente = servicios.filter(s => s.dominio_proveedor?.toLowerCase().includes("cliente")).length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Volver al dashboard
          </button>
          <span className="text-gray-600">|</span>
          <span className="text-lg font-semibold">⚡ LabOS</span>
        </div>
      </header>

      <main className="px-6 py-8 max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">🌐 Web / Hosting</h2>
            <p className="text-gray-400 mt-1 text-sm">Gestión de servicios activos</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/dashboard/web-hosting/planes")}
              className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors">
              Planes
            </button>
            <button onClick={() => router.push("/dashboard/web-hosting/nuevo")}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors">
              + Nuevo servicio
            </button>
          </div>
        </div>

        {/* MÉTRICAS */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Servicios", value: loading ? "—" : servicios.length, color: "text-white" },
            { label: "Servicios Activos", value: loading ? "—" : servicios.length - vencidos, color: "text-green-400" },
            { label: "Dominios Cliente", value: loading ? "—" : dominiosCliente, color: "text-blue-400" },
            { label: "Vencidos / Por vencer", value: loading ? "—" : `${vencidos} / ${porVencer}`, color: "text-red-400" },
          ].map(m => (
            <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">{m.label}</p>
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* BÚSQUEDA Y FILTROS */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Buscar por dominio o cliente..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === f ? "bg-blue-600 text-white" : "bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-500 text-sm">Cargando servicios...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Dominio / Cliente</th>
                  <th className="text-left px-5 py-3">Hosting</th>
                  <th className="text-left px-5 py-3">Plan</th>
                  <th className="text-left px-5 py-3">Vence</th>
                  <th className="text-center px-5 py-3">Estado</th>
                  <th className="text-center px-5 py-3">%</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const pct = calcProgress(s.fecha_inicio, s.fecha_vencimiento);
                  const days = daysLabel(s.fecha_vencimiento);
                  const estado = getEstado(pct);
                  return (
                    <tr key={s.id}
                      onClick={() => router.push(`/dashboard/web-hosting/cliente/${s.cliente_id}`)}
                      className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors cursor-pointer group">
                      <td className="px-5 py-4">
                        {/* DOMINIO PRIMERO */}
                        {s.dominio_principal ? (
                          <p className="font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                            🌐 {s.dominio_principal}
                          </p>
                        ) : (
                          <p className="font-medium text-gray-500 italic text-xs">Sin dominio</p>
                        )}
                        {/* NOMBRE / RAZÓN SOCIAL DESPUÉS */}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {s.clientes?.razon_social || s.clientes?.nombre || "—"}
                        </p>
                        {s.nota && (
                          <span className="inline-block mt-1 text-xs bg-red-900/40 text-red-400 px-2 py-0.5 rounded-full">
                            {s.nota}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-300">{s.hosting_proveedor ?? "—"}</td>
                      <td className="px-5 py-4 text-gray-300">{s.planes?.nombre ?? "—"}</td>
                      <td className="px-5 py-4">
                        {s.fecha_vencimiento ? (
                          <>
                            <p className="text-gray-300">
                              {new Date(s.fecha_vencimiento + "T12:00:00").toLocaleDateString("es-UY", {
                                day: "2-digit", month: "short", year: "numeric"
                              })}
                            </p>
                            {days && <p className={`text-xs mt-1 ${days.color}`}>{days.text}</p>}
                          </>
                        ) : <span className="text-gray-600">—</span>}
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
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">No se encontraron servicios</div>
          )}
        </div>
      </main>
    </div>
  );
}