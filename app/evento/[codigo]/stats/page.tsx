"use client";

import { use, useState } from "react";

const eventosMock = [
  {
    codigo: "lanzamiento-temporada-otono",
    clave: "A3K9PZ",
    titulo: "Lanzamiento Temporada Otoño",
    cliente: "Pastas Florida",
    portada: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    fechaInicio: "2026-04-25", horaInicio: "18:00",
    fechaFin: "2026-04-25", horaFin: "21:00",
    registros: [
      { id: 1, nombre: "Valentina", apellido: "Rodríguez", telefono: "099 123 456", email: "vale@gmail.com", origen: "instagram", fecha: "2026-04-14" },
      { id: 2, nombre: "Lucas", apellido: "Pérez", telefono: "098 234 567", email: "lucas@gmail.com", origen: "recomendacion", fecha: "2026-04-15" },
      { id: 3, nombre: "Martina", apellido: "García", telefono: "094 345 678", email: "marti@gmail.com", origen: "google", fecha: "2026-04-15" },
      { id: 4, nombre: "Santiago", apellido: "López", telefono: "093 456 789", email: "santi@gmail.com", origen: "instagram", fecha: "2026-04-16" },
      { id: 5, nombre: "Camila", apellido: "Fernández", telefono: "092 567 890", email: "cami@gmail.com", origen: "facebook", fecha: "2026-04-16" },
    ],
  },
  {
    codigo: "expo-motos-primavera",
    clave: "R7BX2M",
    titulo: "Expo Motos Primavera",
    cliente: "Centro Motos Uruguay",
    portada: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    fechaInicio: "2026-05-10", horaInicio: "10:00",
    fechaFin: "2026-05-10", horaFin: "18:00",
    registros: [],
  },
];

const origenOpciones: Record<string, string> = {
  instagram: "📸 Instagram",
  facebook: "📘 Facebook",
  tiktok: "🎵 TikTok",
  google: "🔍 Google",
  recomendacion: "🤝 Recomendación",
  cliente: "⭐ Soy cliente",
};

function descargarCSV(registros: any[], nombre: string) {
  const headers = ["Nombre", "Apellido", "Teléfono", "Email", "Origen", "Fecha"];
  const rows = registros.map(r => [r.nombre, r.apellido, r.telefono, r.email, r.origen, r.fecha]);
  const csv = [headers, ...rows].map(r => r.map((v: string) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `registros-${nombre}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function EventoStatsPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params);
  const evento = eventosMock.find(e => e.codigo === codigo);

  const [claveIngresada, setClaveIngresada] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [errorClave, setErrorClave] = useState("");

  function handleLogin() {
    if (!evento) return;
    if (claveIngresada.toUpperCase() === evento.clave) {
      setAutenticado(true); setErrorClave("");
    } else {
      setErrorClave("Clave incorrecta. Verificá los datos enviados a tu email.");
    }
  }

  if (!evento) return (
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
        <p className="text-center text-xs text-gray-400 mt-5">
          La clave fue enviada al email del organizador del evento
        </p>
      </div>
    </div>
  );

  // ─── Dashboard de estadísticas ─────────────────────────────────────────────

  const registros = evento.registros;
  const total = registros.length;

  // Registros por fecha
  const porFecha = registros.reduce((acc: Record<string, number>, r) => {
    acc[r.fecha] = (acc[r.fecha] || 0) + 1;
    return acc;
  }, {});
  const fechasOrdenadas = Object.entries(porFecha).sort(([a], [b]) => a.localeCompare(b));
  const maxPorFecha = Math.max(...Object.values(porFecha), 1);

  // Registros por origen
  const porOrigen = registros.reduce((acc: Record<string, number>, r) => {
    if (r.origen) acc[r.origen] = (acc[r.origen] || 0) + 1;
    return acc;
  }, {});

  function formatFechaCorta(f: string) {
    const d = new Date(f + "T12:00:00");
    return d.toLocaleDateString("es-UY", { day: "2-digit", month: "short" });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{evento.cliente}</p>
            <h1 className="font-bold text-gray-900">{evento.titulo}</h1>
          </div>
          <button onClick={() => descargarCSV(registros, evento.codigo)} disabled={total === 0}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            📥 Descargar CSV
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <p className="text-4xl font-bold text-blue-600">{total}</p>
            <p className="text-sm text-gray-500 mt-1">Total registrados</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <p className="text-4xl font-bold text-gray-900">{Object.keys(porFecha).length}</p>
            <p className="text-sm text-gray-500 mt-1">Días con actividad</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <p className="text-4xl font-bold text-gray-900">{Object.keys(porOrigen).length}</p>
            <p className="text-sm text-gray-500 mt-1">Canales de origen</p>
          </div>
        </div>

        {/* Gráfica registros por fecha */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-5">📈 Registros por fecha</h3>
          {fechasOrdenadas.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">Sin registros aún</p>
          ) : (
            <div className="space-y-3">
              {fechasOrdenadas.map(([fecha, count]) => (
                <div key={fecha} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-20 flex-shrink-0">{formatFechaCorta(fecha)}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-500 flex items-center"
                      style={{ width: `${(count / maxPorFecha) * 100}%` }}>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Origen del tráfico */}
        {Object.keys(porOrigen).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-5">📊 ¿Dónde nos conociste?</h3>
            <div className="space-y-3">
              {Object.entries(porOrigen).sort(([, a], [, b]) => b - a).map(([origen, count]) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={origen} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-36 flex-shrink-0">{origenOpciones[origen] ?? origen}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-gray-500 w-20 text-right flex-shrink-0">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lista de registrados */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">👥 Lista de registrados</h3>
            <span className="text-sm text-gray-400">{total} personas</span>
          </div>
          {registros.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Sin registros aún</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-6 py-3">Nombre</th>
                  <th className="text-left px-6 py-3">Email</th>
                  <th className="text-left px-6 py-3">Origen</th>
                  <th className="text-left px-6 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {registros.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{r.nombre} {r.apellido}</td>
                    <td className="px-6 py-3 text-gray-500">{r.email}</td>
                    <td className="px-6 py-3 text-gray-500">{origenOpciones[r.origen] ?? "—"}</td>
                    <td className="px-6 py-3 text-gray-400">{formatFechaCorta(r.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-center text-xs text-gray-400">
          Estadísticas en tiempo real · LabOS by Sustancial
        </p>
      </div>
    </div>
  );
}