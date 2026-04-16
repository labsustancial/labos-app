"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Registro {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  origen: string;
  fecha: string;
}

interface Evento {
  id: number;
  titulo: string;
  descripcion: string;
  cliente: string;
  clienteEmail: string;
  portada: string;
  fechaInicio: string;
  horaInicio: string;
  fechaFin: string;
  horaFin: string;
  calle: string;
  ciudad: string;
  departamento: string;
  estado: "activo" | "borrador" | "finalizado";
  codigo: string;   // slug público: ej. "lanzamiento-otono"
  clave: string;    // clave stats: ej. "A3K9PZ"
  claveVisible: boolean;
  registros: Registro[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clientesMock = [
  { nombre: "Pastas Florida", email: "contacto@pastasflorida.uy" },
  { nombre: "Centro Motos Uruguay", email: "info@centromotos.uy" },
  { nombre: "Franca Comics", email: "hola@francacomics.uy" },
  { nombre: "Finrel", email: "admin@finre.uy" },
  { nombre: "Vistalsur", email: "contacto@vistalsur.com" },
  { nombre: "Espacio Chamangá", email: "info@espaciochamanga.uy" },
  { nombre: "JT de León", email: "info@jtdeleon.com.uy" },
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

const estadoCls: Record<string, string> = {
  activo: "bg-green-900/40 text-green-400 border-green-800/30",
  borrador: "bg-yellow-900/40 text-yellow-400 border-yellow-800/30",
  finalizado: "bg-gray-800 text-gray-400 border-gray-700",
};

const estadoLabel: Record<string, string> = {
  activo: "Activo",
  borrador: "Borrador",
  finalizado: "Finalizado",
};

function generarClave(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function generarCodigo(titulo: string): string {
  return titulo.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-");
}

function formatFechaHora(fecha: string, hora: string) {
  if (!fecha) return "—";
  const d = new Date(fecha + "T12:00:00");
  const fechaStr = d.toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "numeric" });
  return hora ? `${fechaStr} · ${hora}hs` : fechaStr;
}

function descargarCSV(registros: Registro[], nombre: string) {
  const headers = ["Nombre", "Apellido", "Teléfono", "Email", "Origen", "Fecha"];
  const rows = registros.map(r => [r.nombre, r.apellido, r.telefono, r.email, r.origen, r.fecha]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `registros-${nombre}.csv`; a.click();
  URL.revokeObjectURL(url);
}

const origenLabel = (v: string) => origenOpciones.find(o => o.value === v)?.label ?? v;

// ─── Mock inicial ──────────────────────────────────────────────────────────────

const eventosMock: Evento[] = [
  {
    id: 1,
    titulo: "Lanzamiento Temporada Otoño",
    descripcion: "Presentación de la nueva colección de pasta artesanal.",
    cliente: "Pastas Florida",
    clienteEmail: "contacto@pastasflorida.uy",
    portada: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    fechaInicio: "2026-04-25", horaInicio: "18:00",
    fechaFin: "2026-04-25", horaFin: "21:00",
    calle: "18 de Julio 1234", ciudad: "Florida", departamento: "Florida",
    estado: "activo",
    codigo: "lanzamiento-temporada-otono",
    clave: "A3K9PZ",
    claveVisible: false,
    registros: [
      { id: 1, nombre: "Valentina", apellido: "Rodríguez", telefono: "099 123 456", email: "vale@gmail.com", origen: "instagram", fecha: "14/04/2026" },
      { id: 2, nombre: "Lucas", apellido: "Pérez", telefono: "098 234 567", email: "lucas@gmail.com", origen: "recomendacion", fecha: "15/04/2026" },
      { id: 3, nombre: "Martina", apellido: "García", telefono: "094 345 678", email: "marti@gmail.com", origen: "google", fecha: "15/04/2026" },
    ],
  },
  {
    id: 2,
    titulo: "Expo Motos Primavera",
    descripcion: "Exposición de novedades en motocicletas.",
    cliente: "Centro Motos Uruguay",
    clienteEmail: "info@centromotos.uy",
    portada: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    fechaInicio: "2026-05-10", horaInicio: "10:00",
    fechaFin: "2026-05-10", horaFin: "18:00",
    calle: "Av. Italia 3456", ciudad: "Montevideo", departamento: "Montevideo",
    estado: "borrador",
    codigo: "expo-motos-primavera",
    clave: "R7BX2M",
    claveVisible: false,
    registros: [],
  },
];

// ─── Modal nuevo evento ────────────────────────────────────────────────────────

function NuevoEventoModal({ onClose, onCrear }: { onClose: () => void; onCrear: (e: Evento) => void }) {
  const [form, setForm] = useState({
    titulo: "", descripcion: "", clienteNombre: "", clienteEmail: "", portada: "",
    fechaInicio: "", horaInicio: "", fechaFin: "", horaFin: "",
    calle: "", ciudad: "", departamento: "",
    estado: "borrador" as "activo" | "borrador" | "finalizado",
  });
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors";

  function handleClienteSelect(nombre: string) {
    const c = clientesMock.find(c => c.nombre === nombre);
    setForm(p => ({ ...p, clienteNombre: nombre, clienteEmail: c?.email ?? "" }));
  }

  function handleCrear() {
    if (!form.titulo.trim()) { setError("El título es obligatorio"); return; }
    if (!form.clienteNombre) { setError("Seleccioná un cliente"); return; }
    if (!form.fechaInicio) { setError("La fecha de inicio es obligatoria"); return; }
    const clave = generarClave();
    const nuevo: Evento = {
      id: Date.now(),
      titulo: form.titulo,
      descripcion: form.descripcion,
      cliente: form.clienteNombre,
      clienteEmail: form.clienteEmail,
      portada: form.portada || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
      fechaInicio: form.fechaInicio, horaInicio: form.horaInicio,
      fechaFin: form.fechaFin, horaFin: form.horaFin,
      calle: form.calle, ciudad: form.ciudad, departamento: form.departamento,
      estado: form.estado,
      codigo: generarCodigo(form.titulo),
      clave,
      claveVisible: false,
      registros: [],
    };
    onCrear(nuevo);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">+ Nuevo evento</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {error && <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-4 py-3 text-sm text-red-300">⚠️ {error}</div>}

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📋 Información del evento</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Cliente *</label>
                <select value={form.clienteNombre} onChange={e => handleClienteSelect(e.target.value)} className={inp}>
                  <option value="">Seleccioná un cliente</option>
                  {clientesMock.map(c => <option key={c.nombre} value={c.nombre}>{c.nombre}</option>)}
                </select>
              </div>
              {form.clienteEmail && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <span className="text-xs text-gray-500">📧 Acceso stats se enviará a:</span>
                  <span className="text-xs text-blue-400">{form.clienteEmail}</span>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Título del evento *</label>
                <input value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Ej: Lanzamiento temporada otoño" className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Descripción</label>
                <textarea value={form.descripcion} onChange={e => set("descripcion", e.target.value)}
                  rows={2} placeholder="Describí el evento brevemente..." className={`${inp} resize-none`} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">URL de imagen de portada</label>
                <input value={form.portada} onChange={e => set("portada", e.target.value)} placeholder="https://..." className={inp} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📅 Fechas y horarios</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Fecha inicio *</label>
                <input type="date" value={form.fechaInicio} onChange={e => set("fechaInicio", e.target.value)} className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Hora inicio</label>
                <input type="time" value={form.horaInicio} onChange={e => set("horaInicio", e.target.value)} className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Fecha fin</label>
                <input type="date" value={form.fechaFin} onChange={e => set("fechaFin", e.target.value)} className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Hora fin</label>
                <input type="time" value={form.horaFin} onChange={e => set("horaFin", e.target.value)} className={inp} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📍 Dirección</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Calle</label>
                <input value={form.calle} onChange={e => set("calle", e.target.value)} placeholder="Ej: Av. 18 de Julio 1234" className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5">Ciudad</label>
                  <input value={form.ciudad} onChange={e => set("ciudad", e.target.value)} className={inp} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5">Departamento</label>
                  <input value={form.departamento} onChange={e => set("departamento", e.target.value)} className={inp} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Estado inicial</h3>
            <div className="flex gap-2">
              {(["borrador", "activo"] as const).map(e => (
                <button key={e} onClick={() => set("estado", e)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.estado === e ? estadoCls[e] : "bg-gray-800 border-gray-700 text-gray-400"}`}>
                  {estadoLabel[e]}
                </button>
              ))}
            </div>
          </div>

          {/* Info sobre acceso */}
          <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-300">
              🔑 Al crear el evento se genera automáticamente una <strong>clave de 6 caracteres</strong> para que el cliente acceda a las estadísticas.
              Se enviará al email del cliente seleccionado junto con la URL del formulario.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-6 py-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button onClick={handleCrear} className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors">
            ✅ Crear evento
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detalle del evento ────────────────────────────────────────────────────────

function EventoDetalle({ evento, onVolver, onToggleClave, onEnviarMail }: {
  evento: Evento;
  onVolver: () => void;
  onToggleClave: (id: number) => void;
  onEnviarMail: (id: number, email: string) => void;
}) {
  const [tab, setTab] = useState<"formulario" | "registros" | "acceso">("acceso");
  const [registros, setRegistros] = useState<Registro[]>(evento.registros);
  const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "", email: "", origen: "" });
  const [enviado, setEnviado] = useState(false);
  const [emailDestino, setEmailDestino] = useState("");
  const [copiado, setCopiado] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors";

  const urlFormulario = `${typeof window !== "undefined" ? window.location.origin : "https://labos-app.vercel.app"}/evento/${evento.codigo}`;
  const urlStats = `${urlFormulario}/stats`;

  function copiar(texto: string, id: string) {
    navigator.clipboard.writeText(texto).catch(() => {});
    setCopiado(id); setTimeout(() => setCopiado(null), 2000);
  }

  function handleSubmit() {
    if (!form.nombre || !form.apellido || !form.email) return;
    setRegistros(p => [{ id: Date.now(), ...form, fecha: new Date().toLocaleDateString("es-UY") }, ...p]);
    setForm({ nombre: "", apellido: "", telefono: "", email: "", origen: "" });
    setEnviado(true); setTimeout(() => setEnviado(false), 3000);
  }

  const origenCount = registros.reduce((acc: Record<string, number>, r) => {
    acc[r.origen] = (acc[r.origen] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <button onClick={onVolver} className="text-gray-400 hover:text-white text-sm transition-colors mb-4 block">
        ← Volver a eventos
      </button>

      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
        <div className="relative h-36">
          <img src={evento.portada} alt={evento.titulo} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-300 mb-0.5">{evento.cliente}</p>
              <h2 className="text-xl font-bold text-white">{evento.titulo}</h2>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${estadoCls[evento.estado]}`}>
              {estadoLabel[evento.estado]}
            </span>
          </div>
        </div>
        <div className="px-5 py-4 grid grid-cols-3 gap-4 border-t border-gray-800 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Inicio</p>
            <p className="text-white">{formatFechaHora(evento.fechaInicio, evento.horaInicio)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Fin</p>
            <p className="text-white">{formatFechaHora(evento.fechaFin, evento.horaFin)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Dirección</p>
            <p className="text-white">{[evento.calle, evento.ciudad].filter(Boolean).join(", ") || "—"}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 mb-6">
        {([
          { key: "acceso", label: "🔑 Acceso y links" },
          { key: "formulario", label: "👁 Vista previa" },
          { key: "registros", label: `📋 Registros (${registros.length})` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB ACCESO */}
      {tab === "acceso" && (
        <div className="space-y-4 max-w-2xl">
          {/* URL pública */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">🌐 URL pública del formulario</h3>
            <div className="flex gap-2">
              <input readOnly value={urlFormulario} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-blue-400 focus:outline-none" />
              <button onClick={() => copiar(urlFormulario, "form")}
                className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:text-white transition-colors whitespace-nowrap">
                {copiado === "form" ? "✅" : "📋 Copiar"}
              </button>
            </div>

            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">📊 URL de estadísticas</h3>
            <div className="flex gap-2">
              <input readOnly value={urlStats} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-blue-400 focus:outline-none" />
              <button onClick={() => copiar(urlStats, "stats")}
                className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:text-white transition-colors whitespace-nowrap">
                {copiado === "stats" ? "✅" : "📋 Copiar"}
              </button>
            </div>
          </div>

          {/* Clave de acceso */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">🔑 Clave de acceso a estadísticas</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 flex-1">
                <span className="text-2xl font-mono font-bold tracking-widest text-white">
                  {evento.claveVisible ? evento.clave : "• • • • • •"}
                </span>
              </div>
              <button onClick={() => onToggleClave(evento.id)}
                className="px-4 py-3 rounded-lg border border-gray-700 text-sm text-gray-300 hover:text-white transition-colors whitespace-nowrap">
                {evento.claveVisible ? "🙈 Ocultar" : "👁 Mostrar"}
              </button>
              {evento.claveVisible && (
                <button onClick={() => copiar(evento.clave, "clave")}
                  className="px-4 py-3 rounded-lg border border-gray-700 text-sm text-gray-300 hover:text-white transition-colors">
                  {copiado === "clave" ? "✅" : "📋"}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">El cliente necesita esta clave para acceder a las estadísticas. No se puede regenerar.</p>
          </div>

          {/* Enviar por mail */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📧 Enviar acceso por email</h3>
            <p className="text-xs text-gray-500 mb-3">
              Se enviará la URL del formulario, la URL de estadísticas y la clave de acceso.
            </p>
            <div className="flex gap-2">
              <input value={emailDestino} onChange={e => setEmailDestino(e.target.value)}
                placeholder={evento.clienteEmail || "email@cliente.com"}
                type="email"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
              <button onClick={() => {
                onEnviarMail(evento.id, emailDestino || evento.clienteEmail);
                setEmailDestino("");
              }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors whitespace-nowrap">
                📨 Enviar
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Por defecto se envía a: <span className="text-gray-400">{evento.clienteEmail}</span>
            </p>
          </div>

          {/* Descargar CSV admin */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📥 Exportar datos</h3>
            <p className="text-xs text-gray-500 mb-3">{registros.length} registros disponibles para exportar.</p>
            <button
              onClick={() => descargarCSV(registros, evento.codigo)}
              disabled={registros.length === 0}
              className="px-4 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              📥 Descargar CSV completo
            </button>
          </div>
        </div>
      )}

      {/* TAB FORMULARIO */}
      {tab === "formulario" && (
        <div className="max-w-lg mx-auto">
          {enviado ? (
            <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-xl">
              <p className="text-4xl mb-3">🎉</p>
              <p className="text-lg font-semibold text-white">¡Registro exitoso!</p>
              <p className="text-gray-400 text-sm mt-1">Tu lugar está confirmado</p>
              <button onClick={() => setEnviado(false)} className="mt-4 text-xs text-blue-400 hover:text-blue-300">
                Registrar otra persona
              </button>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5">Nombre *</label>
                  <input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Juan" className={inp} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5">Apellido *</label>
                  <input value={form.apellido} onChange={e => set("apellido", e.target.value)} placeholder="García" className={inp} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Teléfono</label>
                <input type="tel" value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+598 9XX XXX XXX" className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="juan@gmail.com" className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">¿Dónde nos conociste?</label>
                <select value={form.origen} onChange={e => set("origen", e.target.value)} className={`${inp} cursor-pointer`}>
                  {origenOpciones.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <button onClick={handleSubmit} disabled={!form.nombre || !form.apellido || !form.email}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors disabled:opacity-50">
                Registrarme al evento
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB REGISTROS */}
      {tab === "registros" && (
        <div className="space-y-5">
          {Object.keys(origenCount).length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(origenCount).map(([origen, count]) => (
                <div key={origen} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">{origenLabel(origen)}</p>
                  <p className="text-2xl font-bold text-white">{count}</p>
                </div>
              ))}
            </div>
          )}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
              <span className="text-sm font-medium text-white">{registros.length} registros</span>
              <button onClick={() => descargarCSV(registros, evento.codigo)} disabled={registros.length === 0}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:text-white transition-colors disabled:opacity-40">
                📥 Descargar CSV
              </button>
            </div>
            {registros.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">Sin registros aún</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Nombre</th>
                    <th className="text-left px-5 py-3">Email</th>
                    <th className="text-left px-5 py-3">Teléfono</th>
                    <th className="text-left px-5 py-3">Origen</th>
                    <th className="text-left px-5 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map(r => (
                    <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-white">{r.nombre} {r.apellido}</td>
                      <td className="px-5 py-3 text-gray-400">{r.email}</td>
                      <td className="px-5 py-3 text-gray-400">{r.telefono || "—"}</td>
                      <td className="px-5 py-3 text-gray-300">{origenLabel(r.origen) || "—"}</td>
                      <td className="px-5 py-3 text-gray-500">{r.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function GeneradorEventosPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>(eventosMock);
  const [showNuevo, setShowNuevo] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [filtro, setFiltro] = useState<"todos" | "activo" | "borrador" | "finalizado">("todos");
  const [mailEnviado, setMailEnviado] = useState<number | null>(null);

  const filtrados = eventos.filter(e => filtro === "todos" || e.estado === filtro);

  function toggleClave(id: number) {
    setEventos(p => p.map(e => e.id === id ? { ...e, claveVisible: !e.claveVisible } : e));
    if (eventoSeleccionado?.id === id) {
      setEventoSeleccionado(p => p ? { ...p, claveVisible: !p.claveVisible } : p);
    }
  }

  function simularEnvioMail(id: number, email: string) {
    // En hardcode simula el envío — cuando se conecte a Supabase + Resend será real
    console.log(`Enviando acceso a ${email} para evento ${id}`);
    setMailEnviado(id);
    setTimeout(() => setMailEnviado(null), 3000);
  }

  const totales = {
    activo: eventos.filter(e => e.estado === "activo").length,
    borrador: eventos.filter(e => e.estado === "borrador").length,
    finalizado: eventos.filter(e => e.estado === "finalizado").length,
    registros: eventos.reduce((acc, e) => acc + e.registros.length, 0),
  };

  if (eventoSeleccionado) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/herramientas")}
            className="text-gray-400 hover:text-white text-sm transition-colors">← Herramientas</button>
          <span className="text-gray-600">|</span>
          <span className="text-lg font-semibold">⚡ LabOS</span>
        </header>
        <main className="px-6 py-8 max-w-5xl mx-auto">
          {mailEnviado === eventoSeleccionado.id && (
            <div className="mb-4 bg-green-900/30 border border-green-700/40 rounded-lg px-4 py-3 text-sm text-green-300">
              ✅ Acceso enviado por email (simulado — se conectará con Resend)
            </div>
          )}
          <EventoDetalle
            evento={eventoSeleccionado}
            onVolver={() => setEventoSeleccionado(null)}
            onToggleClave={toggleClave}
            onEnviarMail={simularEnvioMail}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {showNuevo && (
        <NuevoEventoModal
          onClose={() => setShowNuevo(false)}
          onCrear={e => { setEventos(p => [e, ...p]); setEventoSeleccionado(e); }}
        />
      )}

      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push("/dashboard/herramientas")}
          className="text-gray-400 hover:text-white text-sm transition-colors">← Herramientas</button>
        <span className="text-gray-600">|</span>
        <span className="text-lg font-semibold">⚡ LabOS</span>
      </header>

      <main className="px-6 py-8 max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📋 Generador de eventos</h1>
            <p className="text-gray-400 text-sm mt-1">Formularios de registro para eventos de clientes</p>
          </div>
          <button onClick={() => setShowNuevo(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors">
            + Nuevo evento
          </button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Activos", value: totales.activo, color: "text-green-400" },
            { label: "Borradores", value: totales.borrador, color: "text-yellow-400" },
            { label: "Finalizados", value: totales.finalizado, color: "text-gray-400" },
            { label: "Total registros", value: totales.registros, color: "text-blue-400" },
          ].map(m => (
            <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">{m.label}</p>
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {([
            { key: "todos", label: "Todos" },
            { key: "activo", label: "Activos" },
            { key: "borrador", label: "Borradores" },
            { key: "finalizado", label: "Finalizados" },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === f.key ? "bg-blue-600 text-white" : "bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtrados.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">
            <p className="text-3xl mb-3">📋</p>
            <p>No hay eventos en esta categoría</p>
            <button onClick={() => setShowNuevo(true)} className="mt-3 text-blue-400 hover:text-blue-300 text-sm">
              + Crear el primero
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtrados.map(evento => (
              <div key={evento.id}
                onClick={() => setEventoSeleccionado(evento)}
                className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl overflow-hidden cursor-pointer transition-all group">
                <div className="relative h-36">
                  <img src={evento.portada} alt={evento.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <p className="text-xs text-gray-300">{evento.cliente}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${estadoCls[evento.estado]}`}>
                      {estadoLabel[evento.estado]}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">{evento.titulo}</h3>
                  {evento.descripcion && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{evento.descripcion}</p>}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
                    <span><span className="text-gray-600">Inicio: </span>{formatFechaHora(evento.fechaInicio, evento.horaInicio)}</span>
                    <span><span className="text-gray-600">📍 </span>{evento.ciudad || "Sin dirección"}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{evento.registros.length} registros</span>
                      <span className="text-xs font-mono text-gray-600">
                        🔑 {evento.claveVisible ? evento.clave : "••••••"}
                      </span>
                    </div>
                    <span className="text-xs text-blue-400 group-hover:text-blue-300 transition-colors">Ver detalle →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}