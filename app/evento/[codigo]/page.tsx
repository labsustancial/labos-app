"use client";

import { use, useState } from "react";

// En hardcode — cuando se conecte a Supabase leerá de la base de datos
const eventosMock = [
  {
    codigo: "lanzamiento-temporada-otono",
    titulo: "Lanzamiento Temporada Otoño",
    descripcion: "Presentación de la nueva colección de pasta artesanal para la temporada de otoño.",
    cliente: "Pastas Florida",
    portada: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    fechaInicio: "2026-04-25", horaInicio: "18:00",
    calle: "18 de Julio 1234", ciudad: "Florida", departamento: "Florida",
    estado: "activo",
  },
  {
    codigo: "expo-motos-primavera",
    titulo: "Expo Motos Primavera",
    descripcion: "Exposición de las últimas novedades en motocicletas nacionales e importadas.",
    cliente: "Centro Motos Uruguay",
    portada: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    fechaInicio: "2026-05-10", horaInicio: "10:00",
    calle: "Av. Italia 3456", ciudad: "Montevideo", departamento: "Montevideo",
    estado: "borrador",
  },
];

const origenOpciones = [
  { value: "", label: "¿Dónde nos conociste?" },
  { value: "instagram", label: "📸 Instagram" },
  { value: "facebook", label: "📘 Facebook" },
  { value: "tiktok", label: "🎵 TikTok" },
  { value: "google", label: "🔍 Google" },
  { value: "recomendacion", label: "🤝 Recomendación de un amigo" },
  { value: "cliente", label: "⭐ Soy cliente" },
];

function formatFecha(fecha: string, hora: string) {
  if (!fecha) return "—";
  const d = new Date(fecha + "T12:00:00");
  const fechaStr = d.toLocaleDateString("es-UY", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  return hora ? `${fechaStr} · ${hora}hs` : fechaStr;
}

export default function EventoPublicoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params);
  const evento = eventosMock.find(e => e.codigo === codigo);

  const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "", email: "", origen: "" });
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const inp = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all";

  function handleSubmit() {
    if (!form.nombre.trim() || !form.apellido.trim()) { setError("Nombre y apellido son obligatorios"); return; }
    if (!form.email.trim()) { setError("El email es obligatorio"); return; }
    setError("");
    setEnviado(true);
  }

  if (!evento) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-gray-500">Evento no encontrado</p>
      </div>
    </div>
  );

  if (enviado) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <p className="text-5xl mb-4">🎉</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro exitoso!</h2>
        <p className="text-gray-500 mb-1">Hola {form.nombre}, tu lugar está confirmado.</p>
        <p className="text-gray-400 text-sm">Te esperamos el {formatFecha(evento.fechaInicio, evento.horaInicio)}</p>
        {(evento.calle || evento.ciudad) && (
          <p className="text-gray-400 text-sm mt-1">📍 {[evento.calle, evento.ciudad].filter(Boolean).join(", ")}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Portada */}
      <div className="relative h-56 sm:h-72">
        <img src={evento.portada} alt={evento.titulo} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-white/70 text-sm mb-1">{evento.cliente}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{evento.titulo}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Info del evento */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 space-y-3">
          {evento.descripcion && <p className="text-gray-600 text-sm">{evento.descripcion}</p>}
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <span className="mt-0.5">📅</span>
            <span className="capitalize">{formatFecha(evento.fechaInicio, evento.horaInicio)}</span>
          </div>
          {(evento.calle || evento.ciudad) && (
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <span className="mt-0.5">📍</span>
              <span>{[evento.calle, evento.ciudad, evento.departamento].filter(Boolean).join(", ")}</span>
            </div>
          )}
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Registrarme al evento</h2>

          {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">⚠️ {error}</div>}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">Nombre *</label>
                <input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Juan" className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">Apellido *</label>
                <input value={form.apellido} onChange={e => set("apellido", e.target.value)} placeholder="García" className={inp} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1.5">Teléfono</label>
              <input type="tel" value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+598 9XX XXX XXX" className={inp} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="juan@gmail.com" className={inp} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1.5">¿Dónde nos conociste?</label>
              <select value={form.origen} onChange={e => set("origen", e.target.value)}
                className={`${inp} cursor-pointer`}>
                {origenOpciones.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <button onClick={handleSubmit}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors">
              Confirmar mi registro →
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Formulario creado con LabOS · <span className="text-gray-500">Sustancial</span>
        </p>
      </div>
    </div>
  );
}