"use client";

import { use, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface Registro {
  id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email: string;
  origen?: string;
  dispositivo?: string;
  created_at: string;
}

interface Evento {
  id: string;
  titulo: string;
  clave: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  clientes?: { nombre: string };
}

const origenLabels: Record<string, string> = {
  instagram: "📸 Instagram", facebook: "📘 Facebook", tiktok: "🎵 TikTok",
  google: "🔍 Google", recomendacion: "🤝 Recomendación", cliente: "⭐ Soy cliente",
};

function descargarCSV(registros: Registro[], nombre: string) {
  const headers = ["Nombre", "Apellido", "Teléfono", "Email", "Origen", "Dispositivo", "Fecha"];
  const rows = registros.map(r => [r.nombre, r.apellido, r.telefono || "", r.email,
    r.origen || "", r.dispositivo || "", new Date(r.created_at).toLocaleDateString("es-UY")]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `registros-${nombre}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function formatFechaCorta(f: string) {
  return new Date(f).toLocaleDateString("es-UY", { day: "2-digit", month: "short" });
}

function LineChart({ data }: { data: { fecha: string; count: number }[] }) {
  if (data.length === 0) return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Sin datos aún</div>
  );
  const W = 600; const H = 180;
  const padL = 40; const padR = 20; const padT = 20; const padB = 40;
  const chartW = W - padL - padR; const chartH = H - padT - padB;
  const maxVal = Math.max(...data.map(d => d.count), 1);
  function xPos(i: number) { return padL + (i / Math.max(data.length - 1, 1)) * chartW; }
  function yPos(v: number) { return padT + (1 - v / maxVal) * chartH; }
  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xPos(i)} ${yPos(d.count)}`).join(" ");
  const yTicks = Array.from({ length: Math.min(maxVal + 1, 5) }, (_, i) => Math.round((maxVal / Math.min(maxVal, 4)) * i));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
      {yTicks.map(v => (
        <g key={v}>
          <line x1={padL} x2={W - padR} y1={yPos(v)} y2={yPos(v)} stroke="#1f2937" strokeWidth="1" strokeDasharray="4 4" />
          <text x={padL - 6} y={yPos(v) + 4} textAnchor="end" fontSize="10" fill="#6b7280">{v}</text>
        </g>
      ))}
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <path d={`${pathD} L ${xPos(data.length - 1)} ${padT + chartH} L ${xPos(0)} ${padT + chartH} Z`}
        fill="url(#areaGrad)" opacity="0.3" />
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xPos(i)} cy={yPos(d.count)} r="6" fill="#3b82f6" opacity="0.2" />
          <circle cx={xPos(i)} cy={yPos(d.count)} r="4" fill="#3b82f6" stroke="#1e3a5f" strokeWidth="2" />
          <text x={xPos(i)} y={yPos(d.count) - 10} textAnchor="middle" fontSize="10" fill="#93c5fd" fontWeight="600">{d.count}</text>
          <text x={xPos(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="#6b7280">{formatFechaCorta(d.fecha)}</text>
        </g>
      ))}
      <line x1={padL} x2={W - padR} y1={padT + chartH} y2={padT + chartH} stroke="#374151" strokeWidth="1" />
      <line x1={padL} x2={padL} y1={padT} y2={padT + chartH} stroke="#374151" strokeWidth="1" />
    </svg>
  );
}

export default function EventoStatsPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [claveIngresada, setClaveIngresada] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [errorClave, setErrorClave] = useState("");

  useEffect(() => {
    const supabase = createClient();
  
    // Verificar si hay sesión activa (admin) — entra directo
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setAutenticado(true);
    });
  
    // Cargar el evento
    supabase.from("eventos")
      .select("id, titulo, clave, fecha_inicio, fecha_fin, clientes(nombre)")
      .eq("codigo", codigo).single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setEvento(data as any);
        setLoading(false);
      });
  }, [codigo]);

  async function handleLogin() {
    if (!evento) return;
    if (claveIngresada.toUpperCase() === evento.clave) {
      setAutenticado(true); // ← los registros se cargan solos por el useEffect
      setErrorClave("");
    } else {
      setErrorClave("Clave incorrecta. Verificá los datos enviados a tu email.");
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Cargando...</p>
    </div>
  );

  if (notFound || !evento) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Evento no encontrado</p>
    </div>
  );

  if (!autenticado) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <p className="text-4xl mb-3">📊</p>
          <h1 className="text-xl font-bold text-gray-900">Estadísticas del evento</h1>
          <p className="text-gray-500 text-sm mt-1">{evento.titulo}</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1.5">Clave de acceso</label>
            <input value={claveIngresada} onChange={e => setClaveIngresada(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Ej: A3K9PZ" maxLength={6}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          {errorClave && <p className="text-xs text-red-500 text-center">{errorClave}</p>}
          <button onClick={handleLogin}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors">
            Acceder →
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-5">La clave fue enviada al email del organizador</p>
      </div>
    </div>
  );

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  const total = registros.length;
  const porFechaMap = registros.reduce((acc: Record<string, number>, r) => {
    const fecha = r.created_at.split("T")[0];
    acc[fecha] = (acc[fecha] || 0) + 1; return acc;
  }, {});
  const lineData = Object.entries(porFechaMap).sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, count]) => ({ fecha, count }));
  const porOrigen = registros.reduce((acc: Record<string, number>, r) => {
    if (r.origen) acc[r.origen] = (acc[r.origen] || 0) + 1; return acc;
  }, {});
  const mobile = registros.filter(r => r.dispositivo === "mobile").length;
  const desktop = registros.filter(r => r.dispositivo === "desktop").length;
  const pctMobile = total > 0 ? Math.round((mobile / total) * 100) : 0;
  const pctDesktop = total > 0 ? Math.round((desktop / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{evento.clientes?.nombre}</p>
            <h1 className="font-bold text-gray-900">{evento.titulo}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => descargarCSV(registros, codigo)} disabled={total === 0}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors disabled:opacity-40">
              📥 Descargar CSV
            </button>
            <button onClick={() => setAutenticado(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors">
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <p className="text-4xl font-bold text-blue-600">{total}</p>
            <p className="text-sm text-gray-500 mt-1">Total registrados</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <p className="text-4xl font-bold text-gray-900">{lineData.length}</p>
            <p className="text-sm text-gray-500 mt-1">Días con actividad</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-gray-900">📱 {pctMobile}%</p>
            <p className="text-sm text-gray-500 mt-1">Mobile</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-gray-900">🖥️ {pctDesktop}%</p>
            <p className="text-sm text-gray-500 mt-1">Desktop</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-5">📈 Registros por fecha</h3>
          <LineChart data={lineData} />
        </div>

        {[
          { title: "📱 Dispositivos", items: [{ label: "📱 Mobile", count: mobile, pct: pctMobile, color: "bg-blue-400" }, { label: "🖥️ Desktop", count: desktop, pct: pctDesktop, color: "bg-indigo-400" }] },
          ...(Object.keys(porOrigen).length > 0 ? [{
            title: "📊 ¿Dónde nos conociste?",
            items: Object.entries(porOrigen).sort(([, a], [, b]) => b - a).map(([k, count]) => ({
              label: origenLabels[k] ?? k, count, pct: Math.round((count / total) * 100), color: "bg-green-400"
            }))
          }] : [])
        ].map(section => (
          <div key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-5">{section.title}</h3>
            {total === 0 ? <p className="text-center text-gray-400 text-sm py-4">Sin registros aún</p> : (
              <div className="space-y-3">
                {section.items.map(d => (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-36 flex-shrink-0">{d.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                      <div className={`absolute inset-y-0 left-0 ${d.color} rounded-full transition-all duration-500 flex items-center justify-end pr-3`}
                        style={{ width: `${d.pct}%` }}>
                        {d.pct > 15 && <span className="text-xs text-white font-medium">{d.pct}%</span>}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 w-20 text-right flex-shrink-0">{d.count} ({d.pct}%)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">👥 Lista de registrados</h3>
            <span className="text-sm text-gray-400">{total} personas</span>
          </div>
          {total === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Sin registros aún</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wide">
                    <th className="text-left px-6 py-3">Nombre</th>
                    <th className="text-left px-6 py-3">Email</th>
                    <th className="text-left px-6 py-3">Origen</th>
                    <th className="text-center px-6 py-3">Dispositivo</th>
                    <th className="text-left px-6 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map(r => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">{r.nombre} {r.apellido}</td>
                      <td className="px-6 py-3 text-gray-500">{r.email}</td>
                      <td className="px-6 py-3 text-gray-500">{origenLabels[r.origen || ""] ?? "—"}</td>
                      <td className="px-6 py-3 text-center">{r.dispositivo === "mobile" ? "📱" : "🖥️"}</td>
                      <td className="px-6 py-3 text-gray-400">{formatFechaCorta(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400">Estadísticas en tiempo real · LabOS by Sustancial</p>
      </div>
    </div>
  );
}