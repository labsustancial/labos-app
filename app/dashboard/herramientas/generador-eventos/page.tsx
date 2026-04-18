"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { ImagenPortada } from "@/components/ImagenPortada";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Cliente { id: string; nombre: string; email?: string; }

interface Evento {
  id: string;
  titulo: string;
  descripcion?: string;
  cliente_id: string;
  portada_url?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  calle?: string;
  ciudad?: string;
  departamento?: string;
  estado: "activo" | "borrador" | "finalizado";
  codigo: string;
  clave: string;
  clave_visible?: boolean;
  created_at: string;
  clientes?: { nombre: string; email?: string };
  _registros_count?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generarClave(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function generarCodigo(titulo: string): string {
  return titulo.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

function tituloDefault(): string {
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = ahora.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" });
  return `Nuevo evento (${fecha} - ${hora})`;
}

function formatFechaHora(f?: string) {
  if (!f) return "—";
  const d = new Date(f);
  return d.toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" }) + "hs";
}

const estadoCls: Record<string, string> = {
  activo: "bg-green-900/40 text-green-400 border-green-800/30",
  borrador: "bg-yellow-900/40 text-yellow-400 border-yellow-800/30",
  finalizado: "bg-gray-800 text-gray-400 border-gray-700",
};
const estadoLabel: Record<string, string> = {
  activo: "Activo", borrador: "Borrador", finalizado: "Finalizado",
};

const origenLabels: Record<string, string> = {
  instagram: "📸 Instagram", facebook: "📘 Facebook", tiktok: "🎵 TikTok",
  google: "🔍 Google", recomendacion: "🤝 Recomendación", cliente: "⭐ Soy cliente",
};

// ─── Modal de crear/editar evento ─────────────────────────────────────────────

interface EventoForm {
  titulo: string; descripcion: string; cliente_id: string; portada_url: string;
  fecha_inicio: string; hora_inicio: string; fecha_fin: string; hora_fin: string;
  calle: string; ciudad: string; departamento: string;
  estado: "activo" | "borrador" | "finalizado";
}

function EventoModal({ evento, clientes, onClose, onGuardado }: {
  evento: Evento;
  clientes: Cliente[];
  onClose: () => void;
  onGuardado: (e: Evento) => void;
}) {
  const fi = evento.fecha_inicio ? new Date(evento.fecha_inicio) : null;
  const ff = evento.fecha_fin ? new Date(evento.fecha_fin) : null;

  const [form, setForm] = useState<EventoForm>({
    titulo: evento.titulo,
    descripcion: evento.descripcion || "",
    cliente_id: evento.cliente_id || "",
    portada_url: evento.portada_url || "",
    fecha_inicio: fi ? fi.toISOString().split("T")[0] : "",
    hora_inicio: fi ? fi.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit", hour12: false }) : "",
    fecha_fin: ff ? ff.toISOString().split("T")[0] : "",
    hora_fin: ff ? ff.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit", hour12: false }) : "",
    calle: evento.calle || "",
    ciudad: evento.ciudad || "",
    departamento: evento.departamento || "",
    estado: evento.estado,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof EventoForm, v: string) => setForm(p => ({ ...p, [k]: v }));
  const clienteSeleccionado = clientes.find(c => c.id === form.cliente_id);
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors";

  // Guardar portada_url en Supabase cada vez que cambia
  async function handlePortadaChange(url: string) {
    set("portada_url", url);
    if (url && !url.startsWith("blob:")) {
      const supabase = createClient();
      await supabase.from("eventos").update({ portada_url: url }).eq("id", evento.id);
    }
  }

  async function handleGuardar() {
    if (!form.titulo.trim()) { setError("El título es obligatorio"); return; }
    if (!form.cliente_id) { setError("Seleccioná un cliente"); return; }
    if (!form.fecha_inicio) { setError("La fecha de inicio es obligatoria"); return; }

    setLoading(true); setError("");
    try {
      const supabase = createClient();
      const codigoActualizado = form.titulo.trim() !== evento.titulo
  ? generarCodigo(form.titulo.trim()) + "-" + evento.id.slice(0, 4)
  : evento.codigo
      
      const fechaInicio = form.fecha_inicio
        ? new Date(`${form.fecha_inicio}T${form.hora_inicio || "00:00"}:00`).toISOString() : null;
      const fechaFin = form.fecha_fin
        ? new Date(`${form.fecha_fin}T${form.hora_fin || "00:00"}:00`).toISOString() : null;

      const { data, error: err } = await supabase.from("eventos").update({
        titulo: form.titulo.trim(),
        codigo: codigoActualizado,
        descripcion: form.descripcion || null,
        cliente_id: form.cliente_id,
        portada_url: form.portada_url || null,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        calle: form.calle || null,
        ciudad: form.ciudad || null,
        departamento: form.departamento || null,
        estado: form.estado,
      }).eq("id", evento.id).select("*, clientes(nombre, email)").single();

      if (err) throw err;
      onGuardado({ ...data, clave_visible: false });
      onClose();
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar() {
    if (!confirm("¿Estás seguro que querés eliminar este evento? Esta acción no se puede deshacer.")) return;
    const supabase = createClient();
    await supabase.from("eventos").delete().eq("id", evento.id);
    onClose();
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {evento.titulo === tituloDefault() || evento.titulo.startsWith("Nuevo evento") ? "+ Nuevo evento" : "✏️ Editar evento"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {error && <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-4 py-3 text-sm text-red-300">⚠️ {error}</div>}

          {/* Info básica */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📋 Información del evento</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Cliente *</label>
                <select value={form.cliente_id} onChange={e => set("cliente_id", e.target.value)} className={inp}>
                  <option value="">Seleccioná un cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              {clienteSeleccionado && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${clienteSeleccionado.email ? "bg-blue-500/10 border-blue-500/20" : "bg-yellow-500/10 border-yellow-500/20"}`}>
                  <span className="text-xs text-gray-400">📧 Email del cliente:</span>
                  {clienteSeleccionado.email
                    ? <span className="text-xs text-blue-400 font-medium">{clienteSeleccionado.email}</span>
                    : <span className="text-xs text-yellow-400">Sin email — completar en módulo Clientes</span>}
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Título *</label>
                <input value={form.titulo} onChange={e => set("titulo", e.target.value)}
                  placeholder="Ej: Lanzamiento temporada otoño" className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Descripción</label>
                <textarea value={form.descripcion} onChange={e => set("descripcion", e.target.value)}
                  rows={2} className={`${inp} resize-none`} />
              </div>
            </div>
          </div>

          {/* Imagen de portada — con eventoId real desde el inicio */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">🖼️ Imagen de portada</h3>
            <ImagenPortada
              eventoId={evento.id}
              value={form.portada_url}
              onChange={handlePortadaChange}
            />
          </div>

          {/* Fechas */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📅 Fechas y horarios</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Fecha inicio *</label>
                <input type="date" value={form.fecha_inicio} onChange={e => set("fecha_inicio", e.target.value)} className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Hora inicio</label>
                <input type="time" value={form.hora_inicio} onChange={e => set("hora_inicio", e.target.value)} className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Fecha fin</label>
                <input type="date" value={form.fecha_fin} onChange={e => set("fecha_fin", e.target.value)} className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Hora fin</label>
                <input type="time" value={form.hora_fin} onChange={e => set("hora_fin", e.target.value)} className={inp} />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📍 Dirección</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Calle</label>
                <input value={form.calle} onChange={e => set("calle", e.target.value)}
                  placeholder="Ej: Av. 18 de Julio 1234" className={inp} />
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

          {/* Estado */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Estado</h3>
            <div className="flex gap-2">
              {(["borrador", "activo", "finalizado"] as const).map(e => (
                <button key={e} onClick={() => set("estado", e)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.estado === e ? estadoCls[e] : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                  {estadoLabel[e]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-6 py-4 flex items-center justify-between gap-3">
          {/* Botón eliminar siempre visible */}
          <button onClick={handleEliminar}
            className="px-4 py-2.5 rounded-lg border border-red-800 bg-red-900/20 text-sm text-red-400 hover:bg-red-900/30 transition-colors">
            🗑 Eliminar evento
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading}
              className="px-4 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={loading}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors disabled:opacity-50">
              {loading ? "Guardando..." : "✅ Guardar evento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Detalle del evento (tabs) ─────────────────────────────────────────────────

function EventoDetalle({ evento, clientes, onVolver, onToggleClave, onEventoActualizado }: {
  evento: Evento;
  clientes: Cliente[];
  onVolver: () => void;
  onToggleClave: (id: string) => void;
  onEventoActualizado: (e: Evento) => void;
}) {
  const [tab, setTab] = useState<"acceso" | "registros">("acceso");
  const [registros, setRegistros] = useState<any[]>([]);
  const [loadingReg, setLoadingReg] = useState(true);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [emailDestino, setEmailDestino] = useState("");
  const [mailEnviado, setMailEnviado] = useState(false);
  const [showEditar, setShowEditar] = useState(false);

  const base = typeof window !== "undefined" ? window.location.origin : "https://labos-app.vercel.app";
  const urlFormulario = `${base}/evento/${evento.codigo}`;
  const urlStats = `${urlFormulario}/stats`;

  useEffect(() => {
    const supabase = createClient();
    supabase.from("registros_evento").select("*").eq("evento_id", evento.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setRegistros(data); setLoadingReg(false); });
  }, [evento.id]);

  function copiar(texto: string, id: string) {
    navigator.clipboard.writeText(texto).catch(() => {});
    setCopiado(id); setTimeout(() => setCopiado(null), 2000);
  }

  function descargarCSV() {
    const headers = ["Nombre", "Apellido", "Teléfono", "Email", "Origen", "Dispositivo", "Fecha"];
    const rows = registros.map(r => [r.nombre, r.apellido, r.telefono || "", r.email,
      r.origen || "", r.dispositivo || "", new Date(r.created_at).toLocaleDateString("es-UY")]);
    const csv = [headers, ...rows].map(r => r.map((v: string) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `registros-${evento.codigo}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const origenCount = registros.reduce((acc: Record<string, number>, r) => {
    if (r.origen) acc[r.origen] = (acc[r.origen] || 0) + 1; return acc;
  }, {});

  return (
    <div>
      {showEditar && (
        <EventoModal
          evento={evento}
          clientes={clientes}
          onClose={() => setShowEditar(false)}
          onGuardado={e => { onEventoActualizado(e); setShowEditar(false); }}
        />
      )}

      <button onClick={onVolver} className="text-gray-400 hover:text-white text-sm mb-4 block transition-colors">
        ← Volver a eventos
      </button>

      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
        {evento.portada_url ? (
          <div className="relative h-36">
            <img src={evento.portada_url} alt={evento.titulo} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-300 mb-0.5">{evento.clientes?.nombre}</p>
                <h2 className="text-xl font-bold text-white">{evento.titulo}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${estadoCls[evento.estado]}`}>
                  {estadoLabel[evento.estado]}
                </span>
                <button onClick={() => setShowEditar(true)}
                  className="px-3 py-1.5 rounded-lg bg-gray-900/80 border border-gray-600 text-xs text-gray-300 hover:text-white transition-colors">
                  ✏️ Editar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">{evento.clientes?.nombre}</p>
              <h2 className="text-lg font-bold text-white">{evento.titulo}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${estadoCls[evento.estado]}`}>
                {estadoLabel[evento.estado]}
              </span>
              <button onClick={() => setShowEditar(true)}
                className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-300 hover:text-white transition-colors">
                ✏️ Editar
              </button>
            </div>
          </div>
        )}
        <div className="px-5 py-4 grid grid-cols-3 gap-4 border-t border-gray-800 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Inicio</p>
            <p className="text-white">{formatFechaHora(evento.fecha_inicio)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Fin</p>
            <p className="text-white">{formatFechaHora(evento.fecha_fin)}</p>
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
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">🌐 URL pública del formulario</h3>
              <div className="flex gap-2">
                <input readOnly value={urlFormulario} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-blue-400 focus:outline-none" />
                <button onClick={() => copiar(urlFormulario, "form")}
                  className="px-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:text-white transition-colors">
                  {copiado === "form" ? "✅" : "📋"}
                </button>
                <a href={urlFormulario} target="_blank"
                  className="px-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:text-white transition-colors">
                  Ver →
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">📊 URL de estadísticas</h3>
              <div className="flex gap-2">
                <input readOnly value={urlStats} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-blue-400 focus:outline-none" />
                <button onClick={() => copiar(urlStats, "stats")}
                  className="px-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:text-white transition-colors">
                  {copiado === "stats" ? "✅" : "📋"}
                </button>
                <a href={urlStats} target="_blank"
                  className="px-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:text-white transition-colors">
                  Ver →
                </a>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">🔑 Clave de acceso a estadísticas</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                <span className="text-2xl font-mono font-bold tracking-widest text-white">
                  {evento.clave_visible ? evento.clave : "• • • • • •"}
                </span>
              </div>
              <button onClick={() => onToggleClave(evento.id)}
                className="px-4 py-3 rounded-lg border border-gray-700 text-sm text-gray-300 hover:text-white transition-colors whitespace-nowrap">
                {evento.clave_visible ? "🙈 Ocultar" : "👁 Mostrar"}
              </button>
              {evento.clave_visible && (
                <button onClick={() => copiar(evento.clave, "clave")}
                  className="px-4 py-3 rounded-lg border border-gray-700 text-sm text-gray-300 hover:text-white transition-colors">
                  {copiado === "clave" ? "✅" : "📋"}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">La clave no se puede regenerar una vez creada.</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📧 Enviar acceso por email</h3>
            {evento.clientes?.email && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                <span className="text-xs text-gray-500">Email del cliente:</span>
                <span className="text-xs text-blue-400">{evento.clientes.email}</span>
                <button onClick={() => setEmailDestino(evento.clientes!.email!)}
                  className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors">
                  Usar este →
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input value={emailDestino} onChange={e => setEmailDestino(e.target.value)}
                placeholder={evento.clientes?.email || "email@cliente.com"} type="email"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
              <button onClick={() => { setMailEnviado(true); setTimeout(() => setMailEnviado(false), 3000); }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors whitespace-nowrap">
                📨 Enviar
              </button>
            </div>
            {mailEnviado && <p className="text-xs text-green-400 mt-2">✅ Email enviado</p>}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📥 Exportar datos</h3>
            <p className="text-xs text-gray-500 mb-3">{registros.length} registros disponibles.</p>
            <button onClick={descargarCSV} disabled={registros.length === 0}
              className="px-4 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-40">
              📥 Descargar CSV completo
            </button>
          </div>
        </div>
      )}

      {/* TAB REGISTROS */}
      {tab === "registros" && (
        <div className="space-y-5">
          {Object.keys(origenCount).length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(origenCount).map(([origen, count]) => (
                <div key={origen} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">{origenLabels[origen] ?? origen}</p>
                  <p className="text-2xl font-bold text-white">{count}</p>
                </div>
              ))}
            </div>
          )}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
              <span className="text-sm font-medium text-white">{registros.length} registros</span>
              <button onClick={descargarCSV} disabled={registros.length === 0}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:text-white transition-colors disabled:opacity-40">
                📥 CSV
              </button>
            </div>
            {loadingReg ? (
              <div className="text-center py-8 text-gray-500 text-sm">Cargando...</div>
            ) : registros.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">Sin registros aún</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Nombre</th>
                    <th className="text-left px-5 py-3">Email</th>
                    <th className="text-left px-5 py-3">Origen</th>
                    <th className="text-center px-5 py-3">Dispositivo</th>
                    <th className="text-left px-5 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map(r => (
                    <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-white">{r.nombre} {r.apellido}</td>
                      <td className="px-5 py-3 text-gray-400">{r.email}</td>
                      <td className="px-5 py-3 text-gray-300">{origenLabels[r.origen] ?? "—"}</td>
                      <td className="px-5 py-3 text-center">{r.dispositivo === "mobile" ? "📱" : "🖥️"}</td>
                      <td className="px-5 py-3 text-gray-500">{new Date(r.created_at).toLocaleDateString("es-UY")}</td>
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
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [eventoEnModal, setEventoEnModal] = useState<Evento | null>(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [filtro, setFiltro] = useState<"todos" | "activo" | "borrador" | "finalizado">("todos");

  async function cargarEventos() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("eventos")
      .select("*, clientes(nombre, email)").order("created_at", { ascending: false });
    if (data) {
      const { data: counts } = await supabase.from("registros_evento").select("evento_id");
      const countMap: Record<string, number> = {};
      counts?.forEach(r => { countMap[r.evento_id] = (countMap[r.evento_id] || 0) + 1; });
      setEventos(data.map(e => ({ ...e, clave_visible: false, _registros_count: countMap[e.id] || 0 })));
    }
    setLoading(false);
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => { if (!user) router.push("/"); });
    supabase.from("clientes").select("id, nombre, email").order("nombre")
      .then(({ data }) => { if (data) setClientes(data); });
    cargarEventos();
  }, [router]);

  // ← CLAVE DEL FIX: crea el evento como borrador ANTES de abrir el modal
  async function handleNuevoEvento() {
    setCreando(true);
    try {
      const supabase = createClient();
      const titulo = tituloDefault();
      const codigo = generarCodigo(titulo) + "-" + Date.now().toString().slice(-4);
      const clave = generarClave();

      const { data, error } = await supabase.from("eventos").insert({
        titulo,
        codigo,
        clave,
        estado: "borrador",
      }).select("*, clientes(nombre, email)").single();

      if (error) throw error;

      const nuevo = { ...data, clave_visible: false, _registros_count: 0 };
      setEventos(p => [nuevo, ...p]);
      setEventoEnModal(nuevo);
      setShowModal(true);
    } catch (e) {
      console.error("Error al crear evento:", e);
    } finally {
      setCreando(false);
    }
  }

  function handleModalClose() {
    setShowModal(false);
    setEventoEnModal(null);
    cargarEventos(); // Recargar por si se eliminó
  }

  function handleEventoGuardado(eventoActualizado: Evento) {
    setEventos(p => p.map(e => e.id === eventoActualizado.id ? { ...eventoActualizado, clave_visible: e.clave_visible } : e));
    setShowModal(false);
    setEventoEnModal(null);
  }

  function toggleClave(id: string) {
    setEventos(p => p.map(e => e.id === id ? { ...e, clave_visible: !e.clave_visible } : e));
    if (eventoSeleccionado?.id === id) {
      setEventoSeleccionado(p => p ? { ...p, clave_visible: !p.clave_visible } : p);
    }
  }

  const filtrados = eventos.filter(e => filtro === "todos" || e.estado === filtro);
  const totales = {
    activo: eventos.filter(e => e.estado === "activo").length,
    borrador: eventos.filter(e => e.estado === "borrador").length,
    finalizado: eventos.filter(e => e.estado === "finalizado").length,
    registros: eventos.reduce((acc, e) => acc + (e._registros_count || 0), 0),
  };

  if (eventoSeleccionado) return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push("/dashboard/herramientas")} className="text-gray-400 hover:text-white text-sm transition-colors">← Herramientas</button>
        <span className="text-gray-600">|</span>
        <span className="text-lg font-semibold">⚡ LabOS</span>
      </header>
      <main className="px-6 py-8 max-w-5xl mx-auto">
        <EventoDetalle
          evento={eventoSeleccionado}
          clientes={clientes}
          onVolver={() => { setEventoSeleccionado(null); cargarEventos(); }}
          onToggleClave={toggleClave}
          onEventoActualizado={e => { setEventoSeleccionado(e); setEventos(p => p.map(ev => ev.id === e.id ? e : ev)); }}
        />
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {showModal && eventoEnModal && (
        <EventoModal
          evento={eventoEnModal}
          clientes={clientes}
          onClose={handleModalClose}
          onGuardado={handleEventoGuardado}
        />
      )}

      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push("/dashboard/herramientas")} className="text-gray-400 hover:text-white text-sm transition-colors">← Herramientas</button>
        <span className="text-gray-600">|</span>
        <span className="text-lg font-semibold">⚡ LabOS</span>
      </header>

      <main className="px-6 py-8 max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📋 Generador de eventos</h1>
            <p className="text-gray-400 text-sm mt-1">Formularios de registro para eventos de clientes</p>
          </div>
          <button onClick={handleNuevoEvento} disabled={creando}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors disabled:opacity-50">
            {creando ? "Creando..." : "+ Nuevo evento"}
          </button>
        </div>

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

        {loading ? (
          <div className="text-center py-12 text-gray-500 text-sm">Cargando eventos...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">
            <p className="text-3xl mb-3">📋</p>
            <p>No hay eventos en esta categoría</p>
            <button onClick={handleNuevoEvento} className="mt-3 text-blue-400 hover:text-blue-300 text-sm">+ Crear el primero</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtrados.map(evento => (
              <div key={evento.id} onClick={() => setEventoSeleccionado(evento)}
                className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl overflow-hidden cursor-pointer transition-all group">
                {evento.portada_url ? (
                  <div className="relative h-36">
                    <img src={evento.portada_url} alt={evento.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                      <p className="text-xs text-gray-300">{evento.clientes?.nombre}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${estadoCls[evento.estado]}`}>{estadoLabel[evento.estado]}</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-14 bg-gray-800 px-4 flex items-center justify-between">
                    <p className="text-xs text-gray-400">{evento.clientes?.nombre ?? "Sin cliente"}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${estadoCls[evento.estado]}`}>{estadoLabel[evento.estado]}</span>
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">{evento.titulo}</h3>
                  {evento.descripcion && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{evento.descripcion}</p>}
                  <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{evento._registros_count || 0} registros</span>
                      <span className="text-xs font-mono text-gray-600">🔑 {evento.clave_visible ? evento.clave : "••••••"}</span>
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