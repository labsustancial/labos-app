"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { ImagenPortada } from "@/components/ImagenPortada";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  telefono2?: string;
  whatsapp1?: string;
  whatsapp2?: string;
  so_nombre?: string;
  so_apellido?: string;
  so_telefono?: string;
}

interface OrigenOpcion {
  id: string;
  evento_id: string;
  valor: string;
  label: string;
  emoji?: string;
  orden: number;
  activo: boolean;
}

interface CampoAdicional {
  id: string;
  evento_id: string;
  tipo: "texto" | "email" | "telefono" | "select" | "checkbox" | "textarea";
  label: string;
  placeholder?: string;
  requerido: boolean;
  orden: number;
  opciones?: string[];
}

interface Evento {
  id: string;
  titulo: string;
  descripcion?: string;
  cliente_id: string;
  portada_url?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  calle?: string;
  localidad?: string;
  departamento?: string;
  estado: "activo" | "borrador" | "finalizado";
  codigo: string;
  clave: string;
  clave_visible?: boolean;
  created_at: string;
  es_gratuito: boolean;
  precio?: number;
  moneda: string;
  emails_admin: string[];
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

function formatPrecio(precio?: number, moneda?: string) {
  if (!precio) return "";
  return `${moneda || "UYU"} ${precio.toLocaleString("es-UY")}`;
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

const DEPARTAMENTOS_UY = [
  "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno",
  "Flores", "Florida", "Lavalleja", "Maldonado", "Montevideo",
  "Paysandú", "Río Negro", "Rivera", "Rocha", "Salto",
  "San José", "Soriano", "Tacuarembó", "Treinta y Tres",
];

// ─── Menú 3 puntos ────────────────────────────────────────────────────────────

function MenuTarjeta({ evento, onCambiarEstado, onEliminar }: {
  evento: Evento;
  onCambiarEstado: (id: string, estado: "activo" | "borrador" | "finalizado") => void;
  onEliminar: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(p => !p)}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-900/80 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 transition-colors text-lg leading-none">
        ···
      </button>
      {open && (
        <div className="absolute right-0 top-9 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-20 py-1 min-w-[160px]">
          {evento.estado !== "activo" && (
            <button onClick={() => { onCambiarEstado(evento.id, "activo"); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-green-400 hover:bg-gray-700 transition-colors">
              ✅ Marcar como activo
            </button>
          )}
          {evento.estado !== "borrador" && (
            <button onClick={() => { onCambiarEstado(evento.id, "borrador"); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-yellow-400 hover:bg-gray-700 transition-colors">
              📝 Pasar a borrador
            </button>
          )}
          {evento.estado !== "finalizado" && (
            <button onClick={() => { onCambiarEstado(evento.id, "finalizado"); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-700 transition-colors">
              🏁 Finalizar evento
            </button>
          )}
          <div className="h-px bg-gray-700 my-1" />
          <button onClick={() => { onEliminar(evento.id); setOpen(false); }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition-colors">
            🗑 Eliminar evento
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tarjeta de evento ────────────────────────────────────────────────────────

function TarjetaEvento({ evento, base, onAbrir, onCambiarEstado, onEliminar, onCopiar, copiado }: {
  evento: Evento; base: string;
  onAbrir: () => void;
  onCambiarEstado: (id: string, estado: "activo" | "borrador" | "finalizado") => void;
  onEliminar: (id: string) => void;
  onCopiar: (url: string, id: string) => void;
  copiado: string | null;
}) {
  const urlFormulario = `${base}/evento/${evento.codigo}`;
  const urlStats = `${urlFormulario}/stats`;

  return (
    <div className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl overflow-hidden transition-all group">
      <div onClick={onAbrir} className="cursor-pointer">
        {evento.portada_url ? (
          <div className="relative h-36">
            <img src={evento.portada_url} alt={evento.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-300">{evento.clientes?.nombre}</p>
                {!evento.es_gratuito && evento.precio && (
                  <span className="text-xs font-medium text-amber-400">{formatPrecio(evento.precio, evento.moneda)}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${estadoCls[evento.estado]}`}>
                  {estadoLabel[evento.estado]}
                </span>
                <MenuTarjeta evento={evento} onCambiarEstado={onCambiarEstado} onEliminar={onEliminar} />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-14 bg-gray-800 px-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">{evento.clientes?.nombre ?? "Sin cliente"}</p>
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${estadoCls[evento.estado]}`}>
                {estadoLabel[evento.estado]}
              </span>
              <MenuTarjeta evento={evento} onCambiarEstado={onCambiarEstado} onEliminar={onEliminar} />
            </div>
          </div>
        )}
        <div className="px-4 pt-4 pb-2">
          <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">{evento.titulo}</h3>
          {evento.descripcion && <p className="text-xs text-gray-500 line-clamp-2">{evento.descripcion}</p>}
        </div>
      </div>

      {/* Tira inferior */}
      <div className="px-4 pb-3 pt-2 border-t border-gray-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white">
            {evento._registros_count || 0}
            <span className="text-xs font-normal text-gray-400 ml-1">registros</span>
          </span>
          {!evento.es_gratuito && evento.precio && (
            <span className="text-xs text-amber-400 font-medium">{formatPrecio(evento.precio, evento.moneda)}</span>
          )}
          {evento.es_gratuito && (
            <span className="text-xs text-gray-600">Gratuito</span>
          )}
        </div>
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <a href={urlFormulario} target="_blank"
            className="px-2.5 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300 hover:text-white hover:border-gray-500 transition-colors">
            Ver evento
          </a>
          <a href={urlStats} target="_blank"
            className="px-2.5 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300 hover:text-white hover:border-gray-500 transition-colors">
            Stats
          </a>
          <button onClick={() => onCopiar(urlFormulario, evento.id)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300 hover:text-white hover:border-gray-500 transition-colors">
            {copiado === evento.id ? "✅" : "📋 Link"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de crear/editar evento ─────────────────────────────────────────────

interface EventoForm {
  titulo: string; descripcion: string; cliente_id: string; portada_url: string;
  fecha_inicio: string; hora_inicio: string; fecha_fin: string; hora_fin: string;
  calle: string; localidad: string; departamento: string;
  estado: "activo" | "borrador" | "finalizado";
  es_gratuito: boolean; precio: string; moneda: string;
  emails_admin: string[];
}

function EventoModal({ evento, clientes, onClose, onGuardado }: {
  evento: Evento; clientes: Cliente[];
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
    localidad: evento.localidad || "",
    departamento: evento.departamento || "",
    estado: evento.estado,
    es_gratuito: evento.es_gratuito ?? true,
    precio: evento.precio?.toString() || "",
    moneda: evento.moneda || "UYU",
    emails_admin: evento.emails_admin || [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [clienteCRM, setClienteCRM] = useState<Cliente | null>(null);

  const set = (k: keyof EventoForm, v: any) => setForm(p => ({ ...p, [k]: v }));
  const clienteSeleccionado = clientes.find(c => c.id === form.cliente_id);
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors";

  // Cargar datos CRM del cliente seleccionado
  useEffect(() => {
    if (!form.cliente_id) { setClienteCRM(null); return; }
    const supabase = createClient();
    supabase.from("clientes")
      .select("id, nombre, email, telefono, telefono2, whatsapp1, whatsapp2, so_nombre, so_apellido, so_telefono")
      .eq("id", form.cliente_id)
      .single()
      .then(({ data }) => { if (data) setClienteCRM(data); });
  }, [form.cliente_id]);

  function agregarEmail() {
    const email = nuevoEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    if (form.emails_admin.includes(email)) return;
    set("emails_admin", [...form.emails_admin, email]);
    setNuevoEmail("");
  }

  function quitarEmail(email: string) {
    set("emails_admin", form.emails_admin.filter(e => e !== email));
  }

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
    if (!form.es_gratuito && !form.precio) { setError("Ingresá el precio del evento"); return; }

    setLoading(true); setError("");
    try {
      const supabase = createClient();
      const codigoActualizado = form.titulo.trim() !== evento.titulo
        ? generarCodigo(form.titulo.trim()) + "-" + evento.id.slice(0, 4)
        : evento.codigo;
      const fechaInicio = form.fecha_inicio
        ? new Date(`${form.fecha_inicio}T${form.hora_inicio || "00:00"}:00`).toISOString() : null;
      const fechaFin = form.fecha_fin
        ? new Date(`${form.fecha_fin}T${form.hora_fin || "00:00"}:00`).toISOString() : null;

      const emailsAdmin = [...form.emails_admin];

      const { data, error: err } = await supabase.from("eventos").update({
        titulo: form.titulo.trim(),
        codigo: codigoActualizado,
        descripcion: form.descripcion || null,
        cliente_id: form.cliente_id,
        portada_url: form.portada_url || null,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        calle: form.calle || null,
        localidad: form.localidad || null,
        departamento: form.departamento || null,
        estado: form.estado,
        es_gratuito: form.es_gratuito,
        precio: form.es_gratuito ? null : parseFloat(form.precio) || null,
        moneda: form.es_gratuito ? null : form.moneda,
        emails_admin: emailsAdmin,
      }).eq("id", evento.id).select("*, clientes!eventos_cliente_id_fkey(nombre, email)").single();

      if (err) throw err;
      onGuardado({ ...data, clave_visible: false, emails_admin: data.emails_admin || [] });
      onClose();
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar() {
    if (!confirm("¿Estás seguro que querés eliminar este evento?")) return;
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
            {evento.titulo.startsWith("Nuevo evento") ? "+ Nuevo evento" : "✏️ Editar evento"}
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

              {/* Email del cliente */}
              {clienteSeleccionado && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${clienteSeleccionado.email ? "bg-blue-500/10 border-blue-500/20" : "bg-yellow-500/10 border-yellow-500/20"}`}>
                  <span className="text-xs text-gray-400">📧 Email del cliente:</span>
                  {clienteSeleccionado.email
                    ? <span className="text-xs text-blue-400 font-medium">{clienteSeleccionado.email}</span>
                    : <span className="text-xs text-yellow-400">Sin email — completar en módulo Clientes</span>}
                </div>
              )}

              {/* Contactos del CRM */}
              {clienteCRM && (clienteCRM.telefono || clienteCRM.whatsapp1 || clienteCRM.so_nombre) && (
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-3 space-y-1.5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">📋 Contactos del CRM</p>
                  {clienteCRM.telefono && (
                    <p className="text-xs text-gray-300">📞 Teléfono: <span className="text-white">{clienteCRM.telefono}</span></p>
                  )}
                  {clienteCRM.telefono2 && (
                    <p className="text-xs text-gray-300">📞 Teléfono 2: <span className="text-white">{clienteCRM.telefono2}</span></p>
                  )}
                  {clienteCRM.whatsapp1 && (
                    <p className="text-xs text-gray-300">💬 WhatsApp: <span className="text-white">{clienteCRM.whatsapp1}</span></p>
                  )}
                  {clienteCRM.whatsapp2 && (
                    <p className="text-xs text-gray-300">💬 WhatsApp 2: <span className="text-white">{clienteCRM.whatsapp2}</span></p>
                  )}
                  {clienteCRM.so_nombre && (
                    <p className="text-xs text-gray-300">👤 Service Owner: <span className="text-white">{[clienteCRM.so_nombre, clienteCRM.so_apellido].filter(Boolean).join(" ")}{clienteCRM.so_telefono ? ` · ${clienteCRM.so_telefono}` : ""}</span></p>
                  )}
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

          {/* Imagen de portada */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">🖼️ Imagen de portada</h3>
            <ImagenPortada eventoId={evento.id} value={form.portada_url} onChange={handlePortadaChange} />
          </div>

          {/* Precio */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">💰 Precio</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => set("es_gratuito", true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.es_gratuito ? "bg-green-900/40 text-green-400 border-green-800/30" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                  🎟 Gratuito
                </button>
                <button onClick={() => set("es_gratuito", false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${!form.es_gratuito ? "bg-amber-900/40 text-amber-400 border-amber-800/30" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                  💳 De pago
                </button>
              </div>
              {!form.es_gratuito && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 block mb-1.5">Precio *</label>
                    <input type="number" value={form.precio} onChange={e => set("precio", e.target.value)}
                      placeholder="0" min="0" className={inp} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1.5">Moneda</label>
                    <select value={form.moneda} onChange={e => set("moneda", e.target.value)} className={inp}>
                      <option value="UYU">UYU</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Emails de administración */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📧 Emails de administración</h3>
            <p className="text-xs text-gray-500 mb-3">
              Estos emails recibirán el acceso a las estadísticas del evento.
            </p>
            {form.emails_admin.length > 0 && (
              <div className="space-y-2 mb-3">
                {form.emails_admin.map(email => (
                  <div key={email} className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                    <span className="text-xs text-blue-400 flex-1">{email}</span>
                    <button onClick={() => quitarEmail(email)}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors">✕</button>
                  </div>
                ))}
              </div>
            )}
            {clienteSeleccionado?.email && !form.emails_admin.includes(clienteSeleccionado.email) && (
              <button onClick={() => set("emails_admin", [...form.emails_admin, clienteSeleccionado.email!])}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors mb-3 block">
                + Agregar email del cliente ({clienteSeleccionado.email})
              </button>
            )}
            <div className="flex gap-2">
              <input value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && agregarEmail()}
                type="email" placeholder="email@ejemplo.com"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors" />
              <button onClick={agregarEmail}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm text-white transition-colors">
                + Agregar
              </button>
            </div>
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
                  <label className="text-xs text-gray-500 block mb-1.5">Localidad</label>
                  <input value={form.localidad} onChange={e => set("localidad", e.target.value)}
                    placeholder="Ej: Punta del Este" className={inp} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5">Departamento</label>
                  <select value={form.departamento} onChange={e => set("departamento", e.target.value)} className={`${inp} cursor-pointer`}>
                    <option value="">Seleccioná un departamento</option>
                    {DEPARTAMENTOS_UY.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
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

        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-6 py-4 flex items-center justify-between gap-3">
          <button onClick={handleEliminar}
            className="px-4 py-2.5 rounded-lg border border-red-800 bg-red-900/20 text-sm text-red-400 hover:bg-red-900/30 transition-colors">
            🗑 Eliminar
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

// ─── Constructor de formulario ────────────────────────────────────────────────

function ConstructorFormulario({ evento }: { evento: Evento }) {
  const [campos, setCampos] = useState<CampoAdicional[]>([]);
  const [origenes, setOrigenes] = useState<OrigenOpcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [nuevoCampo, setNuevoCampo] = useState<Partial<CampoAdicional> | null>(null);
  const [nuevoOrigen, setNuevoOrigen] = useState<{ valor: string; label: string; emoji: string } | null>(null);

  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors";

  const tipoLabels: Record<string, string> = {
    texto: "Texto corto", email: "Email", telefono: "Teléfono",
    select: "Selección", checkbox: "Checkbox", textarea: "Texto largo",
  };

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("evento_campos").select("*").eq("evento_id", evento.id).order("orden"),
      supabase.from("origen_opciones").select("*").eq("evento_id", evento.id).order("orden"),
    ]).then(([{ data: c }, { data: o }]) => {
      if (c) setCampos(c);
      if (o) setOrigenes(o);
      setLoading(false);
    });
  }, [evento.id]);

  async function guardarCampo() {
    if (!nuevoCampo?.label?.trim() || !nuevoCampo.tipo) return;
    setGuardando(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("evento_campos").insert({
      evento_id: evento.id,
      tipo: nuevoCampo.tipo,
      label: nuevoCampo.label.trim(),
      placeholder: nuevoCampo.placeholder || null,
      requerido: nuevoCampo.requerido ?? false,
      orden: campos.length,
      opciones: nuevoCampo.opciones || null,
    }).select().single();
    if (!error && data) { setCampos(p => [...p, data]); setNuevoCampo(null); }
    setGuardando(false);
  }

  async function eliminarCampo(id: string) {
    const supabase = createClient();
    await supabase.from("evento_campos").delete().eq("id", id);
    setCampos(p => p.filter(c => c.id !== id));
  }

  async function toggleRequerido(campo: CampoAdicional) {
    const supabase = createClient();
    await supabase.from("evento_campos").update({ requerido: !campo.requerido }).eq("id", campo.id);
    setCampos(p => p.map(c => c.id === campo.id ? { ...c, requerido: !c.requerido } : c));
  }

  async function guardarOrigen() {
    if (!nuevoOrigen?.valor?.trim() || !nuevoOrigen.label?.trim()) return;
    setGuardando(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("origen_opciones").insert({
      evento_id: evento.id,
      valor: nuevoOrigen.valor.trim().toLowerCase().replace(/\s+/g, "_"),
      label: nuevoOrigen.label.trim(),
      emoji: nuevoOrigen.emoji || null,
      orden: origenes.length,
      activo: true,
    }).select().single();
    if (!error && data) { setOrigenes(p => [...p, data]); setNuevoOrigen(null); }
    setGuardando(false);
  }

  async function toggleOrigenActivo(origen: OrigenOpcion) {
    const supabase = createClient();
    await supabase.from("origen_opciones").update({ activo: !origen.activo }).eq("id", origen.id);
    setOrigenes(p => p.map(o => o.id === origen.id ? { ...o, activo: !o.activo } : o));
  }

  async function eliminarOrigen(id: string) {
    const supabase = createClient();
    await supabase.from("origen_opciones").delete().eq("id", id);
    setOrigenes(p => p.filter(o => o.id !== id));
  }

  if (loading) return <div className="text-center py-8 text-gray-500 text-sm">Cargando formulario...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">📋 Campos del formulario</h3>
        <div className="space-y-2 mb-4">
          {[
            { label: "Nombre", tipo: "texto", requerido: true },
            { label: "Apellido", tipo: "texto", requerido: true },
            { label: "Email", tipo: "email", requerido: true },
            { label: "Teléfono", tipo: "telefono", requerido: false },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-3 px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg opacity-60">
              <span className="text-xs text-gray-500 w-20">{tipoLabels[c.tipo]}</span>
              <span className="text-sm text-gray-300 flex-1">{c.label}</span>
              {c.requerido && <span className="text-xs text-blue-400">Requerido</span>}
              <span className="text-xs text-gray-600">Base</span>
            </div>
          ))}
        </div>
        {campos.length > 0 && (
          <div className="space-y-2 mb-4">
            {campos.map(campo => (
              <div key={campo.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg">
                <span className="text-xs text-gray-500 w-20">{tipoLabels[campo.tipo]}</span>
                <span className="text-sm text-white flex-1">{campo.label}</span>
                <button onClick={() => toggleRequerido(campo)}
                  className={`text-xs px-2 py-0.5 rounded border transition-colors ${campo.requerido ? "text-blue-400 border-blue-800/40 bg-blue-900/20" : "text-gray-500 border-gray-700"}`}>
                  {campo.requerido ? "Requerido" : "Opcional"}
                </button>
                <button onClick={() => eliminarCampo(campo.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors text-xs">✕</button>
              </div>
            ))}
          </div>
        )}
        {nuevoCampo ? (
          <div className="border border-gray-700 rounded-xl p-4 space-y-3 bg-gray-800/30">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Tipo de campo</label>
                <select value={nuevoCampo.tipo || ""} onChange={e => setNuevoCampo(p => ({ ...p, tipo: e.target.value as CampoAdicional["tipo"] }))} className={inp}>
                  <option value="">Seleccioná</option>
                  {Object.entries(tipoLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Etiqueta</label>
                <input value={nuevoCampo.label || ""} onChange={e => setNuevoCampo(p => ({ ...p, label: e.target.value }))}
                  placeholder="Ej: Empresa" className={inp} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Placeholder (opcional)</label>
              <input value={nuevoCampo.placeholder || ""} onChange={e => setNuevoCampo(p => ({ ...p, placeholder: e.target.value }))}
                placeholder="Ej: Ingresá el nombre de tu empresa" className={inp} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={nuevoCampo.requerido ?? false}
                onChange={e => setNuevoCampo(p => ({ ...p, requerido: e.target.checked }))} className="rounded" />
              <span className="text-sm text-gray-300">Campo requerido</span>
            </label>
            <div className="flex gap-2">
              <button onClick={guardarCampo} disabled={guardando}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm text-white transition-colors disabled:opacity-50">
                {guardando ? "Guardando..." : "✅ Agregar campo"}
              </button>
              <button onClick={() => setNuevoCampo(null)}
                className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setNuevoCampo({ requerido: false })}
            className="w-full py-2.5 border border-dashed border-gray-700 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors">
            + Agregar campo personalizado
          </button>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">📣 ¿Cómo nos conociste?</h3>
        <p className="text-xs text-gray-500 mb-4">
          {origenes.length === 0
            ? "Usando las opciones predeterminadas del sistema."
            : `${origenes.filter(o => o.activo).length} opciones activas.`}
        </p>
        {origenes.length > 0 && (
          <div className="space-y-2 mb-4">
            {origenes.map(origen => (
              <div key={origen.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg">
                <span className="text-base">{origen.emoji}</span>
                <span className="text-sm text-white flex-1">{origen.label}</span>
                <span className="text-xs text-gray-600 font-mono">{origen.valor}</span>
                <button onClick={() => toggleOrigenActivo(origen)}
                  className={`text-xs px-2 py-0.5 rounded border transition-colors ${origen.activo ? "text-green-400 border-green-800/40 bg-green-900/20" : "text-gray-500 border-gray-700"}`}>
                  {origen.activo ? "Activo" : "Oculto"}
                </button>
                <button onClick={() => eliminarOrigen(origen.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors text-xs">✕</button>
              </div>
            ))}
          </div>
        )}
        {nuevoOrigen ? (
          <div className="border border-gray-700 rounded-xl p-4 space-y-3 bg-gray-800/30">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Emoji</label>
                <input value={nuevoOrigen.emoji} onChange={e => setNuevoOrigen(p => p ? { ...p, emoji: e.target.value } : p)}
                  placeholder="🎯" className={inp} maxLength={2} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1.5">Etiqueta</label>
                <input value={nuevoOrigen.label} onChange={e => setNuevoOrigen(p => p ? { ...p, label: e.target.value } : p)}
                  placeholder="Ej: YouTube" className={inp} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Valor (identificador)</label>
              <input value={nuevoOrigen.valor} onChange={e => setNuevoOrigen(p => p ? { ...p, valor: e.target.value } : p)}
                placeholder="Ej: youtube" className={`${inp} font-mono`} />
            </div>
            <div className="flex gap-2">
              <button onClick={guardarOrigen} disabled={guardando}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm text-white transition-colors disabled:opacity-50">
                {guardando ? "Guardando..." : "✅ Agregar opción"}
              </button>
              <button onClick={() => setNuevoOrigen(null)}
                className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setNuevoOrigen({ valor: "", label: "", emoji: "" })}
            className="w-full py-2.5 border border-dashed border-gray-700 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors">
            + Agregar opción de origen
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Detalle del evento (tabs) ────────────────────────────────────────────────

function EventoDetalle({ evento, clientes, onVolver, onToggleClave, onEventoActualizado }: {
  evento: Evento; clientes: Cliente[];
  onVolver: () => void;
  onToggleClave: (id: string) => void;
  onEventoActualizado: (e: Evento) => void;
}) {
  const [tab, setTab] = useState<"acceso" | "registros" | "formulario">("acceso");
  const [registros, setRegistros] = useState<any[]>([]);
  const [loadingReg, setLoadingReg] = useState(true);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [mailEnviado, setMailEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [showEditar, setShowEditar] = useState(false);

  const base = typeof window !== "undefined" ? window.location.origin : "https://labos.sustancial.uy";
  const urlFormulario = `${base}/evento/${evento.codigo}`;
  const urlStats = `${urlFormulario}/stats`;

  useEffect(() => {
    const supabase = createClient();
    supabase.from("registros").select("*").eq("event_id", evento.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setRegistros(data); setLoadingReg(false); });
  }, [evento.id]);

  function copiar(texto: string, id: string) {
    navigator.clipboard.writeText(texto).catch(() => {});
    setCopiado(id); setTimeout(() => setCopiado(null), 2000);
  }

  function descargarCSV() {
    const headers = ["Nombre", "Apellido", "Teléfono", "Email", "Fecha"];
    const rows = registros.map(r => [
      r.first_name, r.last_name, r.phone || "", r.email,
      new Date(r.created_at).toLocaleDateString("es-UY")
    ]);
    const csv = [headers, ...rows].map(r => r.map((v: string) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `registros-${evento.codigo}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleEnviarAcceso() {
    const emails = evento.emails_admin || [];
    if (emails.length === 0) { alert("No hay emails de administración configurados para este evento."); return; }
    setEnviando(true);
    try {
      await Promise.all(emails.map(email =>
        fetch("/api/enviar-acceso-evento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            eventoTitulo: evento.titulo,
            urlFormulario,
            urlStats,
            clave: evento.clave,
          }),
        })
      ));
      setMailEnviado(true);
      setTimeout(() => setMailEnviado(false), 3000);
    } catch (e) {
      console.error("Error enviando acceso:", e);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      {showEditar && (
        <EventoModal evento={evento} clientes={clientes}
          onClose={() => setShowEditar(false)}
          onGuardado={e => { onEventoActualizado(e); setShowEditar(false); }} />
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
                {!evento.es_gratuito && evento.precio && (
                  <span className="text-sm font-medium text-amber-400">{formatPrecio(evento.precio, evento.moneda)}</span>
                )}
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
              {!evento.es_gratuito && evento.precio && (
                <span className="text-sm font-medium text-amber-400">{formatPrecio(evento.precio, evento.moneda)}</span>
              )}
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
            <p className="text-white">{[evento.calle, evento.localidad, evento.departamento].filter(Boolean).join(", ") || "—"}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 mb-6">
        {([
          { key: "acceso", label: "🔑 Acceso y links" },
          { key: "registros", label: `📋 Registros (${registros.length})` },
          { key: "formulario", label: "🧩 Formulario" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

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
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📧 Emails de administración</h3>
            {evento.emails_admin?.length > 0 ? (
              <div className="space-y-2 mb-4">
                {evento.emails_admin.map(email => (
                  <div key={email} className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                    <span className="text-xs text-blue-400">{email}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mb-4">Sin emails configurados. Editá el evento para agregar.</p>
            )}
            <button onClick={handleEnviarAcceso} disabled={enviando || evento.emails_admin?.length === 0}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors disabled:opacity-40">
              {enviando ? "Enviando..." : `📨 Enviar acceso a ${evento.emails_admin?.length || 0} email${evento.emails_admin?.length !== 1 ? "s" : ""}`}
            </button>
            {mailEnviado && <p className="text-xs text-green-400 mt-2">✅ Acceso enviado correctamente</p>}
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

      {tab === "formulario" && <ConstructorFormulario evento={evento} />}

      {tab === "registros" && (
        <div className="space-y-5">
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
                    <th className="text-left px-5 py-3">Teléfono</th>
                    <th className="text-left px-5 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map(r => (
                    <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-white">{r.first_name} {r.last_name}</td>
                      <td className="px-5 py-3 text-gray-400">{r.email}</td>
                      <td className="px-5 py-3 text-gray-400">{r.phone || "—"}</td>
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

// ─── Página principal ─────────────────────────────────────────────────────────

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
  const [copiado, setCopiado] = useState<string | null>(null);

  const base = typeof window !== "undefined" ? window.location.origin : "https://labos.sustancial.uy";

  async function cargarEventos() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("eventos")
      .select("*, clientes!eventos_cliente_id_fkey(nombre, email)").order("created_at", { ascending: false });
    if (data) {
      const { data: counts } = await supabase.from("registros").select("event_id");
      const countMap: Record<string, number> = {};
      counts?.forEach(r => { countMap[r.event_id] = (countMap[r.event_id] || 0) + 1; });
      setEventos(data.map(e => ({
        ...e,
        clave_visible: false,
        _registros_count: countMap[e.id] || 0,
        es_gratuito: e.es_gratuito ?? true,
        emails_admin: e.emails_admin || [],
      })));
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

  async function handleNuevoEvento() {
    setCreando(true);
    try {
      if (clientes.length === 0) {
        throw new Error("Necesitás al menos un cliente para crear un evento.");
      }
      const supabase = createClient();
      const clienteBase = clientes[0];
      const titulo = tituloDefault();
      const codigo = generarCodigo(titulo) + "-" + Date.now().toString().slice(-4);
      const clave = generarClave();
      const ahora = new Date().toISOString();
      const { data, error } = await supabase.from("eventos").insert({
        titulo,
        codigo,
        clave,
        cliente_id: clienteBase.id,
        fecha_inicio: ahora,
        estado: "borrador",
        es_gratuito: true,
        moneda: "UYU",
        emails_admin: [],
      }).select("*, clientes!eventos_cliente_id_fkey(nombre, email)").single();
      if (error) throw error;
      const nuevo = { ...data, clave_visible: false, _registros_count: 0, emails_admin: [] };
      setEventos(p => [nuevo, ...p]);
      setEventoEnModal(nuevo);
      setShowModal(true);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "No se pudo crear el evento.");
    } finally {
      setCreando(false);
    }
  }

  async function handleCambiarEstado(id: string, estado: "activo" | "borrador" | "finalizado") {
    const supabase = createClient();
    await supabase.from("eventos").update({ estado }).eq("id", id);
    setEventos(p => p.map(e => e.id === id ? { ...e, estado } : e));
  }

  async function handleEliminarDesdeMenu(id: string) {
    if (!confirm("¿Estás seguro que querés eliminar este evento?")) return;
    const supabase = createClient();
    await supabase.from("eventos").delete().eq("id", id);
    setEventos(p => p.filter(e => e.id !== id));
  }

  function handleCopiar(url: string, id: string) {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiado(id); setTimeout(() => setCopiado(null), 2000);
  }

  function handleModalClose() {
    setShowModal(false); setEventoEnModal(null);
    cargarEventos();
  }

  function handleEventoGuardado(eventoActualizado: Evento) {
    setEventos(p => p.map(e => e.id === eventoActualizado.id ? { ...eventoActualizado, clave_visible: e.clave_visible } : e));
    setShowModal(false); setEventoEnModal(null);
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
        <EventoDetalle evento={eventoSeleccionado} clientes={clientes}
          onVolver={() => { setEventoSeleccionado(null); cargarEventos(); }}
          onToggleClave={toggleClave}
          onEventoActualizado={e => { setEventoSeleccionado(e); setEventos(p => p.map(ev => ev.id === e.id ? e : ev)); }} />
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {showModal && eventoEnModal && (
        <EventoModal evento={eventoEnModal} clientes={clientes}
          onClose={handleModalClose} onGuardado={handleEventoGuardado} />
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
              <TarjetaEvento key={evento.id} evento={evento} base={base}
                onAbrir={() => setEventoSeleccionado(evento)}
                onCambiarEstado={handleCambiarEstado}
                onEliminar={handleEliminarDesdeMenu}
                onCopiar={handleCopiar}
                copiado={copiado} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}