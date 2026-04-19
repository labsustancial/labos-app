"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type EstadoEvento = "borrador" | "activo" | "finalizado" | "cancelado";

interface ClienteOption {
  id: string;
  nombre: string;
  email: string;
}

interface EventoFormData {
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  capacidad_maxima: string;
  estado: EstadoEvento;
  direccion: string;
  link_mapa: string;
  organizador_nombre: string;
  organizador_telefono: string;
  organizador_cliente_id: string;
}

interface EventoFormProps {
  eventoId?: string; // si viene → modo edición
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INITIAL_FORM: EventoFormData = {
  titulo: "",
  descripcion: "",
  fecha_inicio: "",
  fecha_fin: "",
  capacidad_maxima: "",
  estado: "borrador",
  direccion: "",
  link_mapa: "",
  organizador_nombre: "",
  organizador_telefono: "",
  organizador_cliente_id: "",
};

const ESTADOS: { value: EstadoEvento; label: string; color: string }[] = [
  { value: "borrador", label: "Borrador", color: "text-gray-400 border-gray-600 bg-gray-800/50" },
  { value: "activo", label: "Activo", color: "text-emerald-400 border-emerald-700 bg-emerald-900/20" },
  { value: "finalizado", label: "Finalizado", color: "text-blue-400 border-blue-700 bg-blue-900/20" },
  { value: "cancelado", label: "Cancelado", color: "text-red-400 border-red-700 bg-red-900/20" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function EventoForm({ eventoId, onSuccess, onCancel }: EventoFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const esEdicion = Boolean(eventoId);

  // Form state
  const [form, setForm] = useState<EventoFormData>(INITIAL_FORM);
  const [modoOrganizador, setModoOrganizador] = useState<"crm" | "manual">("crm");

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingEvento, setLoadingEvento] = useState(esEdicion);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // CRM search state
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteOption | null>(null);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [buscandoClientes, setBuscandoClientes] = useState(false);

  // ─── Cargar evento en modo edición ──────────────────────────────────────────

  useEffect(() => {
    if (!eventoId) return;

    const cargarEvento = async () => {
      setLoadingEvento(true);
      const { data, error } = await supabase
        .from("eventos")
        .select("*")
        .eq("id", eventoId)
        .single();

      if (error || !data) {
        setError("No se pudo cargar el evento.");
        setLoadingEvento(false);
        return;
      }

      setForm({
        titulo: data.titulo ?? "",
        descripcion: data.descripcion ?? "",
        fecha_inicio: data.fecha_inicio ? data.fecha_inicio.slice(0, 16) : "",
        fecha_fin: data.fecha_fin ? data.fecha_fin.slice(0, 16) : "",
        capacidad_maxima: data.capacidad_maxima?.toString() ?? "",
        estado: data.estado ?? "borrador",
        direccion: data.direccion ?? "",
        link_mapa: data.link_mapa ?? "",
        organizador_nombre: data.organizador_nombre ?? "",
        organizador_telefono: data.organizador_telefono ?? "",
        organizador_cliente_id: data.organizador_cliente_id ?? "",
      });

      if (data.organizador_cliente_id) {
        setModoOrganizador("crm");
        // cargar cliente seleccionado para mostrar en UI
        const { data: cliente } = await supabase
          .from("clientes")
          .select("id, nombre, email")
          .eq("id", data.organizador_cliente_id)
          .single();
        if (cliente) setClienteSeleccionado(cliente);
      } else if (data.organizador_nombre) {
        setModoOrganizador("manual");
      }

      setLoadingEvento(false);
    };

    cargarEvento();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  // ─── Búsqueda de clientes ────────────────────────────────────────────────────

  const buscarClientes = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setClientes([]);
        setMostrarDropdown(false);
        return;
      }
      setBuscandoClientes(true);
      const { data } = await supabase
        .from("clientes")
        .select("id, nombre, email")
        .ilike("nombre", `%${query}%`)
        .limit(8);

      setClientes(data ?? []);
      setMostrarDropdown(true);
      setBuscandoClientes(false);
    },
    [supabase]
  );

  useEffect(() => {
    const timeout = setTimeout(() => buscarClientes(busquedaCliente), 300);
    return () => clearTimeout(timeout);
  }, [busquedaCliente, buscarClientes]);

  const seleccionarCliente = (cliente: ClienteOption) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente("");
    setMostrarDropdown(false);
    setForm((prev) => ({
      ...prev,
      organizador_nombre: cliente.nombre,
      organizador_cliente_id: cliente.id,
    }));
  };

  const limpiarClienteCRM = () => {
    setClienteSeleccionado(null);
    setBusquedaCliente("");
    setForm((prev) => ({
      ...prev,
      organizador_nombre: "",
      organizador_cliente_id: "",
    }));
  };

  const cambiarModoOrganizador = (modo: "crm" | "manual") => {
    setModoOrganizador(modo);
    setClienteSeleccionado(null);
    setBusquedaCliente("");
    setMostrarDropdown(false);
    setForm((prev) => ({
      ...prev,
      organizador_nombre: "",
      organizador_cliente_id: "",
      organizador_telefono: "",
    }));
  };

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const set = (field: keyof EventoFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!form.titulo.trim()) {
      setError("El título del evento es obligatorio.");
      return;
    }
    if (!form.direccion.trim()) {
      setError("La dirección es obligatoria.");
      return;
    }
    if (form.fecha_inicio && form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
      setError("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }

    setLoading(true);

    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
      capacidad_maxima: form.capacidad_maxima ? parseInt(form.capacidad_maxima) : null,
      estado: form.estado,
      direccion: form.direccion.trim(),
      link_mapa: form.link_mapa.trim() || null,
      organizador_nombre: form.organizador_nombre.trim() || null,
      organizador_telefono: form.organizador_telefono.trim() || null,
      organizador_cliente_id: form.organizador_cliente_id || null,
    };

    let resultId = eventoId;

    if (esEdicion && eventoId) {
      const { error: updateError } = await supabase
        .from("eventos")
        .update(payload)
        .eq("id", eventoId);

      if (updateError) {
        setError("Error al actualizar el evento: " + updateError.message);
        setLoading(false);
        return;
      }
    } else {
      const { data, error: insertError } = await supabase
        .from("eventos")
        .insert(payload)
        .select("id")
        .single();

      if (insertError || !data) {
        setError("Error al crear el evento: " + (insertError?.message ?? "desconocido"));
        setLoading(false);
        return;
      }
      resultId = data.id;
    }

    setLoading(false);
    setSuccess(true);

    if (onSuccess && resultId) {
      onSuccess(resultId);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loadingEvento) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm">Cargando evento…</span>
        </div>
      </div>
    );
  }

  const estadoActual = ESTADOS.find((e) => e.value === form.estado) ?? ESTADOS[0];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <button
              type="button"
              onClick={onCancel ?? (() => router.back())}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">
              {esEdicion ? "Editar evento" : "Nuevo evento"}
            </p>
          </div>
          <h1 className="text-2xl font-semibold text-white">
            {esEdicion ? form.titulo || "Evento" : "Crear evento"}
          </h1>
        </div>

        {/* Error global */}
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-950/40 border border-red-800/60 rounded-lg px-4 py-3 text-sm text-red-300">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 flex items-center gap-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg px-4 py-3 text-sm text-emerald-300">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>Evento {esEdicion ? "actualizado" : "creado"} correctamente.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Sección: Info básica ── */}
          <Section title="Información básica">

            {/* Título */}
            <Field label="Título del evento" required>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => set("titulo", e.target.value)}
                placeholder="Ej: Workshop de Branding 2025"
                className={inputClass}
                required
              />
            </Field>

            {/* Descripción */}
            <Field label="Descripción">
              <textarea
                value={form.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
                placeholder="Descripción opcional del evento…"
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </Field>

            {/* Estado */}
            <Field label="Estado">
              <div className="flex flex-wrap gap-2">
                {ESTADOS.map((e) => (
                  <button
                    key={e.value}
                    type="button"
                    onClick={() => set("estado", e.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                      form.estado === e.value
                        ? e.color
                        : "text-gray-500 border-gray-700 bg-transparent hover:border-gray-600"
                    }`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
              {/* Badge del estado actual */}
              <p className="text-xs text-gray-600 mt-1">
                Estado actual:{" "}
                <span className={estadoActual.color.split(" ")[0]}>{estadoActual.label}</span>
              </p>
            </Field>

          </Section>

          {/* ── Sección: Fechas ── */}
          <Section title="Fechas">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Fecha y hora de inicio">
                <input
                  type="datetime-local"
                  value={form.fecha_inicio}
                  onChange={(e) => set("fecha_inicio", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Fecha y hora de fin">
                <input
                  type="datetime-local"
                  value={form.fecha_fin}
                  onChange={(e) => set("fecha_fin", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          {/* ── Sección: Lugar ── */}
          <Section title="Lugar">

            <Field label="Dirección" required>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => set("direccion", e.target.value)}
                placeholder="Ej: Av. 18 de Julio 1234, Montevideo"
                className={inputClass}
                required
              />
            </Field>

            <Field label="Link al mapa">
              <input
                type="url"
                value={form.link_mapa}
                onChange={(e) => set("link_mapa", e.target.value)}
                placeholder="https://maps.google.com/…"
                className={inputClass}
              />
              {form.link_mapa && (
                <a
                  href={form.link_mapa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ver en mapa
                </a>
              )}
            </Field>

          </Section>

          {/* ── Sección: Capacidad ── */}
          <Section title="Capacidad">
            <Field
              label="Capacidad máxima"
              hint="Si se completa, el sistema controlará el aforo. Dejá vacío para capacidad ilimitada."
            >
              <input
                type="number"
                value={form.capacidad_maxima}
                onChange={(e) => set("capacidad_maxima", e.target.value)}
                placeholder="Sin límite"
                min={1}
                className={`${inputClass} w-48`}
              />
            </Field>
          </Section>

          {/* ── Sección: Organizador ── */}
          <Section title="Organizador">

            {/* Toggle modo */}
            <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-lg w-fit mb-4">
              <button
                type="button"
                onClick={() => cambiarModoOrganizador("crm")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  modoOrganizador === "crm"
                    ? "bg-gray-700 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Buscar en CRM
              </button>
              <button
                type="button"
                onClick={() => cambiarModoOrganizador("manual")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  modoOrganizador === "manual"
                    ? "bg-gray-700 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Ingresar manualmente
              </button>
            </div>

            {/* Modo CRM */}
            {modoOrganizador === "crm" && (
              <div className="space-y-4">
                {clienteSeleccionado ? (
                  /* Cliente ya seleccionado */
                  <div className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{clienteSeleccionado.nombre}</p>
                      <p className="text-xs text-gray-500">{clienteSeleccionado.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={limpiarClienteCRM}
                      className="text-gray-600 hover:text-gray-300 transition-colors ml-4"
                      title="Quitar cliente"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  /* Búsqueda */
                  <Field label="Buscar cliente">
                    <div className="relative">
                      <div className="relative">
                        <svg
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7 7 0 1116.65 16.65z" />
                        </svg>
                        <input
                          type="text"
                          value={busquedaCliente}
                          onChange={(e) => setBusquedaCliente(e.target.value)}
                          onFocus={() => busquedaCliente.length >= 2 && setMostrarDropdown(true)}
                          onBlur={() => setTimeout(() => setMostrarDropdown(false), 150)}
                          placeholder="Escribí para buscar por nombre…"
                          className={`${inputClass} pl-9`}
                        />
                        {buscandoClientes && (
                          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        )}
                      </div>

                      {/* Dropdown resultados */}
                      {mostrarDropdown && clientes.length > 0 && (
                        <ul className="absolute z-20 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                          {clientes.map((c) => (
                            <li key={c.id}>
                              <button
                                type="button"
                                onMouseDown={() => seleccionarCliente(c)}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-800 transition-colors"
                              >
                                <p className="text-sm text-white">{c.nombre}</p>
                                <p className="text-xs text-gray-500">{c.email}</p>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {mostrarDropdown && !buscandoClientes && clientes.length === 0 && busquedaCliente.length >= 2 && (
                        <div className="absolute z-20 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3">
                          <p className="text-sm text-gray-500">No se encontraron clientes con ese nombre.</p>
                        </div>
                      )}
                    </div>
                  </Field>
                )}

                {/* Nombre (autocompleto desde CRM, editable) */}
                <Field label="Nombre del organizador" hint="Se autocompleta al seleccionar un cliente, pero podés editarlo.">
                  <input
                    type="text"
                    value={form.organizador_nombre}
                    onChange={(e) => set("organizador_nombre", e.target.value)}
                    placeholder="Nombre del organizador"
                    className={inputClass}
                  />
                </Field>
              </div>
            )}

            {/* Modo manual */}
            {modoOrganizador === "manual" && (
              <Field label="Nombre del organizador">
                <input
                  type="text"
                  value={form.organizador_nombre}
                  onChange={(e) => set("organizador_nombre", e.target.value)}
                  placeholder="Nombre completo"
                  className={inputClass}
                />
              </Field>
            )}

            {/* Teléfono — siempre visible */}
            <Field
              label="Teléfono del organizador"
              hint="Se guarda directamente en el evento independientemente del modo."
            >
              <input
                type="tel"
                value={form.organizador_telefono}
                onChange={(e) => set("organizador_telefono", e.target.value)}
                placeholder="Ej: +598 99 123 456"
                className={inputClass}
              />
            </Field>

          </Section>

          {/* ── Botones ── */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={onCancel ?? (() => router.back())}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-950 text-sm font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {loading
                ? esEdicion ? "Guardando…" : "Creando…"
                : esEdicion ? "Guardar cambios" : "Crear evento"
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 space-y-4">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-600">{hint}</p>}
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputClass =
  "w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 " +
  "focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-600 transition-colors";