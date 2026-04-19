"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface Evento {
  id: string;
  titulo: string;
  descripcion?: string;
  portada_url?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  calle?: string;
  ciudad?: string;
  departamento?: string;
  estado: string;
  codigo: string;
  es_gratuito: boolean;
  precio?: number;
  moneda?: string;
  capacidad_maxima?: number;
  clientes?: { nombre: string };
}

interface OrigenOpcion {
  id: string;
  label: string;
  activo: boolean;
  orden: number;
}

interface EventoCampo {
  id: string;
  event_id: string;
  tipo: "text" | "select";
  label: string;
  opciones?: unknown[];
  multiple?: boolean;
  requerido: boolean;
  orden: number;
}

function detectarDispositivo(): "mobile" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    ? "mobile" : "desktop";
}

function formatFecha(f?: string) {
  if (!f) return null;
  const d = new Date(f);
  return {
    fecha: d.toLocaleDateString("es-UY", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }),
    hora: d.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" }),
    fechaCorta: d.toLocaleDateString("es-UY", { day: "2-digit", month: "long", year: "numeric" }),
  };
}

function BotonCompartir({ titulo, url }: { titulo: string; url: string }) {
  const [copiado, setCopiado] = useState(false);
  const [open, setOpen] = useState(false);

  function copiarLink() {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiado(true); setOpen(false);
    setTimeout(() => setCopiado(false), 2000);
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${titulo}\n${url}`)}`;

  return (
    <div className="relative">
      <button onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white text-xs font-medium transition-all">
        {copiado ? "✅ Copiado" : "↗ Compartir"}
      </button>
      {open && (
        <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 min-w-[160px]">
          <button onClick={copiarLink}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            📋 Copiar link
          </button>
          <a href={whatsapp} target="_blank"
            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            💬 Compartir por WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

export default function EventoForm({ codigo }: { codigo: string }) {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [aforoLleno, setAforoLleno] = useState(false);
  const [dispositivo, setDispositivo] = useState<"mobile" | "desktop">("desktop");

  const [origenOpciones, setOrigenOpciones] = useState<OrigenOpcion[]>([]);
  const [eventoCampos, setEventoCampos] = useState<EventoCampo[]>([]);

  const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "", email: "", origen: "" });
  const [respuestas, setRespuestas] = useState<Record<string, string | string[]>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [enviado, setEnviado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [urlActual, setUrlActual] = useState("");

  useEffect(() => {
    setDispositivo(detectarDispositivo());
    setUrlActual(window.location.href);

    const supabase = createClient();

    Promise.all([
      supabase.from("eventos").select("*, clientes(nombre)").eq("codigo", codigo).single(),
      supabase.from("origen_opciones").select("*").eq("activo", true).order("orden"),
    ]).then(async ([eventoRes, origenRes]) => {
      if (eventoRes.error || !eventoRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const ev = eventoRes.data as Evento;
      setEvento(ev);
      setOrigenOpciones(origenRes.data || []);

      const { data: campos } = await supabase
        .from("evento_campos")
        .select("*")
        .eq("event_id", ev.id)
        .order("orden");
      setEventoCampos(campos || []);

      if (ev.capacidad_maxima) {
        const { count } = await supabase
          .from("registros")
          .select("id", { count: "exact", head: true })
          .eq("event_id", ev.id)
          .eq("status", "registered");
        if ((count ?? 0) >= ev.capacidad_maxima) setAforoLleno(true);
      }

      setLoading(false);
    });
  }, [codigo]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const inp = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-all";

  const camposRequeridosOk = eventoCampos
    .filter(c => c.requerido)
    .every(c => {
      const val = respuestas[c.id];
      if (Array.isArray(val)) return val.length > 0;
      return typeof val === "string" && val.trim() !== "";
    });

  const puedeEnviar =
    form.nombre.trim() !== "" &&
    form.apellido.trim() !== "" &&
    form.email.trim() !== "" &&
    termsAccepted &&
    camposRequeridosOk &&
    !guardando;

  async function handleSubmit() {
    if (!puedeEnviar) return;
    setError(""); setGuardando(true);

    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      const { data: registro, error: err } = await supabase
        .from("registros")
        .insert({
          event_id: evento!.id,
          first_name: form.nombre.trim(),
          last_name: form.apellido.trim(),
          email: form.email.trim(),
          phone: form.telefono || null,
          status: "registered",
          terms_accepted: true,
          terms_accepted_at: now,
          marketing_opt_in: marketingOptIn,
        })
        .select()
        .single();

      if (err) throw err;

      const responses: { registro_id: string; campo_id: string | null; valor: string }[] = [];

      if (form.origen) {
        responses.push({ registro_id: registro.id, campo_id: null, valor: form.origen });
      }

      for (const campo of eventoCampos) {
        const val = respuestas[campo.id];
        if (val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) continue;
        responses.push({
          registro_id: registro.id,
          campo_id: campo.id,
          valor: Array.isArray(val) ? val.join(", ") : val,
        });
      }

      if (responses.length > 0) {
        await supabase.from("registro_respuestas").insert(responses);
      }

      const fechaInfo = formatFecha(evento!.fecha_inicio);
      fetch("/api/enviar-confirmacion-registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          email: form.email.trim(),
          eventoTitulo: evento!.titulo,
          eventoFecha: fechaInfo?.fechaCorta || null,
          eventoHora: fechaInfo?.hora || null,
          eventoCalle: evento!.calle || null,
          eventoCiudad: evento!.ciudad || null,
          eventoDepartamento: evento!.departamento || null,
          registroId: registro.id,
        }),
      }).catch(e => console.error("Error enviando email:", e));

      setEnviado(true);
    } catch {
      setError("Error al registrar. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  function renderCampo(campo: EventoCampo) {
    const opciones = (campo.opciones ?? []) as unknown[];

    if (campo.tipo === "text") {
      return (
        <div key={campo.id}>
          <label className="text-xs text-gray-500 font-medium block mb-1.5">
            {campo.label}{campo.requerido && " *"}
          </label>
          <input
            value={(respuestas[campo.id] as string) || ""}
            onChange={e => setRespuestas(p => ({ ...p, [campo.id]: e.target.value }))}
            className={inp}
          />
        </div>
      );
    }

    if (campo.tipo === "select") {
      const selectedValues: string[] = Array.isArray(respuestas[campo.id])
        ? (respuestas[campo.id] as string[])
        : respuestas[campo.id] ? [respuestas[campo.id] as string] : [];

      if (campo.multiple) {
        return (
          <div key={campo.id}>
            <label className="text-xs text-gray-500 font-medium block mb-2">
              {campo.label}{campo.requerido && " *"}
            </label>
            <div className="space-y-2">
              {opciones.map((op) => {
                const val = typeof op === "string" ? op : (op as Record<string, string>).value ?? (op as Record<string, string>).label;
                const label = typeof op === "string" ? op : (op as Record<string, string>).label;
                const checked = selectedValues.includes(val);
                return (
                  <label key={val} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setRespuestas(p => ({
                          ...p,
                          [campo.id]: checked
                            ? selectedValues.filter(v => v !== val)
                            : [...selectedValues, val],
                        }))
                      }
                      className="rounded border-gray-300 accent-gray-900"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      }

      return (
        <div key={campo.id}>
          <label className="text-xs text-gray-500 font-medium block mb-1.5">
            {campo.label}{campo.requerido && " *"}
          </label>
          <select
            value={(respuestas[campo.id] as string) || ""}
            onChange={e => setRespuestas(p => ({ ...p, [campo.id]: e.target.value }))}
            className={`${inp} cursor-pointer`}
          >
            <option value="">Seleccioná una opción</option>
            {opciones.map((op) => {
              const val = typeof op === "string" ? op : (op as Record<string, string>).value ?? (op as Record<string, string>).label;
              const label = typeof op === "string" ? op : (op as Record<string, string>).label;
              return <option key={val} value={val}>{label}</option>;
            })}
          </select>
        </div>
      );
    }

    return null;
  }

  // ─── Estados de carga ────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Cargando evento...</p>
    </div>
  );

  if (notFound || !evento) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-gray-500">Evento no encontrado</p>
      </div>
    </div>
  );

  if (evento.estado !== "activo") return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full">
        <p className="text-4xl mb-3">🔒</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Formulario no disponible</h2>
        <p className="text-gray-500 text-sm">Este formulario no está activo en este momento.</p>
      </div>
    </div>
  );

  const fechaInfo = formatFecha(evento.fecha_inicio);

  if (enviado) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <p className="text-5xl mb-4">🎉</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro exitoso!</h2>
        <p className="text-gray-500 mb-1">Hola {form.nombre}, tu lugar está confirmado.</p>
        <p className="text-gray-400 text-sm mt-1">Te enviamos un email de confirmación con tu código QR de acceso.</p>
        {fechaInfo && <p className="text-gray-400 text-sm mt-2">📅 {fechaInfo.fecha} · {fechaInfo.hora}hs</p>}
        {(evento.calle || evento.ciudad) && (
          <p className="text-gray-400 text-sm mt-1">📍 {[evento.calle, evento.ciudad].filter(Boolean).join(", ")}</p>
        )}
      </div>
    </div>
  );

  // ─── Render principal ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      {evento.portada_url ? (
        <div className="relative h-56 sm:h-72">
          <img src={evento.portada_url} alt={evento.titulo} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div>
              <p className="text-white/70 text-sm mb-1">{evento.clientes?.nombre}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{evento.titulo}</h1>
              {!evento.es_gratuito && evento.precio && (
                <span className="inline-block mt-1 text-sm font-semibold text-amber-400">
                  {evento.moneda} {evento.precio.toLocaleString("es-UY")}
                </span>
              )}
            </div>
            {urlActual && <BotonCompartir titulo={evento.titulo} url={urlActual} />}
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 px-6 py-8">
          <div className="max-w-lg mx-auto flex items-end justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">{evento.clientes?.nombre}</p>
              <h1 className="text-2xl font-bold text-white">{evento.titulo}</h1>
              {!evento.es_gratuito && evento.precio && (
                <span className="inline-block mt-1 text-sm font-semibold text-amber-400">
                  {evento.moneda} {evento.precio.toLocaleString("es-UY")}
                </span>
              )}
            </div>
            {urlActual && <BotonCompartir titulo={evento.titulo} url={urlActual} />}
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Info del evento */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 space-y-3">
          {evento.descripcion && <p className="text-gray-600 text-sm">{evento.descripcion}</p>}
          {fechaInfo && (
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <span>📅</span>
              <span className="capitalize">{fechaInfo.fecha} · {fechaInfo.hora}hs</span>
            </div>
          )}
          {(evento.calle || evento.ciudad) && (
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <span>📍</span>
              <span>{[evento.calle, evento.ciudad, evento.departamento].filter(Boolean).join(", ")}</span>
            </div>
          )}
          <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
            <span>🎟</span>
            {evento.es_gratuito ? (
              <span className="text-sm font-semibold text-green-600">Entrada gratuita</span>
            ) : (
              <span className="text-sm font-semibold text-gray-900">
                {evento.moneda} {evento.precio?.toLocaleString("es-UY")}
              </span>
            )}
          </div>
        </div>

        {/* Formulario / Aforo lleno */}
        {aforoLleno ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-4xl mb-3">😔</p>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Cupos agotados</h2>
            <p className="text-gray-500 text-sm">Ya no hay lugares disponibles para este evento.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Registrarme al evento</h2>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1.5">Nombre *</label>
                  <input value={form.nombre} onChange={e => set("nombre", e.target.value)}
                    placeholder="Juan" className={inp} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1.5">Apellido *</label>
                  <input value={form.apellido} onChange={e => set("apellido", e.target.value)}
                    placeholder="García" className={inp} />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">Teléfono</label>
                <input type="tel" value={form.telefono} onChange={e => set("telefono", e.target.value)}
                  placeholder="+598 9XX XXX XXX" className={inp} />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="juan@gmail.com" className={inp} />
              </div>

              {/* Origen dinámico */}
              {origenOpciones.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1.5">¿Dónde nos conociste?</label>
                  <select value={form.origen} onChange={e => set("origen", e.target.value)}
                    className={`${inp} cursor-pointer`}>
                    <option value="">Seleccioná una opción</option>
                    {origenOpciones.map(o => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Campos dinámicos */}
              {eventoCampos.map(campo => renderCampo(campo))}

              {/* T&C */}
              <div className="pt-1 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 accent-gray-900"
                  />
                  <span className="text-xs text-gray-500 leading-relaxed">
                    Acepto los <span className="underline text-gray-700">términos y condiciones</span> del evento. *
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={e => setMarketingOptIn(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 accent-gray-900"
                  />
                  <span className="text-xs text-gray-500 leading-relaxed">
                    Acepto recibir comunicaciones y novedades relacionadas al evento.
                  </span>
                </label>
              </div>

              {/* Botón */}
              <button
                onClick={handleSubmit}
                disabled={!puedeEnviar}
                className="w-full py-3.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {guardando
                  ? "Registrando..."
                  : evento.es_gratuito
                    ? "Confirmar mi registro →"
                    : `Registrarme — ${evento.moneda} ${evento.precio?.toLocaleString("es-UY")} →`}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Formulario creado con <span className="text-gray-500 font-medium">Sustancial</span>
        </p>
      </div>
    </div>
  );
}
