"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface Evento {
  id: string;
  titulo: string;
  descripcion?: string;
  portada_url?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  calle?: string;
  localidad?: string;
  departamento?: string;
  estado: string;
  codigo: string;
  cliente_id?: string;
  es_gratuito: boolean;
  precio?: number;
  moneda?: string;
  capacidad_maxima?: number;
  tyc_responsable_cliente_id?: string | null;
  tyc_responsable_nombre?: string | null;
  tyc_responsable_rut?: string | null;
  tyc_responsable_email?: string | null;
  tyc_responsable_direccion?: string | null;
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

interface ClienteLegal {
  id: string;
  nombre: string;
  razon_social?: string | null;
  rut?: string | null;
  calle?: string | null;
  localidad?: string | null;
  departamento?: string | null;
  pais?: string | null;
  email?: string | null;
  legal_notas?: string | null;
}

interface ResponsableLegal {
  nombre: string;
  rut?: string | null;
  domicilio?: string | null;
  email?: string | null;
  legalNotas?: string | null;
}

interface OrganizadorPublico {
  id: string;
  nombre: string;
  telefono?: string | null;
}

type ModalLegal = "terms" | "marketing" | null;

function formatFecha(f?: string) {
  if (!f) return null;
  const d = new Date(f);
  return {
    fecha: d.toLocaleDateString("es-UY", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    hora: d.toLocaleTimeString("es-UY", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    fechaCorta: d.toLocaleDateString("es-UY", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  };
}

function componerDomicilio(cliente?: Partial<ClienteLegal> | null) {
  if (!cliente) return "";

  return [
    cliente.calle,
    cliente.localidad,
    cliente.departamento,
    cliente.pais || "Uruguay",
  ]
    .filter(Boolean)
    .join(", ");
}

function resolverResponsableManual(evento: Evento): ResponsableLegal | null {
  const nombre = evento.tyc_responsable_nombre?.trim();
  const rut = evento.tyc_responsable_rut?.trim();
  const email = evento.tyc_responsable_email?.trim();
  const direccion = evento.tyc_responsable_direccion?.trim();

  if (!nombre && !rut && !email && !direccion) return null;

  return {
    nombre: nombre || "Responsable del evento",
    rut: rut || null,
    domicilio: direccion || null,
    email: email || null,
    legalNotas: null,
  };
}

function resolverResponsableCliente(cliente?: ClienteLegal | null): ResponsableLegal | null {
  if (!cliente) return null;

  return {
    nombre: cliente.razon_social || cliente.nombre,
    rut: cliente.rut || null,
    domicilio: componerDomicilio(cliente) || null,
    email: cliente.email || null,
    legalNotas: cliente.legal_notas || null,
  };
}

function BotonCompartir({ titulo, url }: { titulo: string; url: string }) {
  const [copiado, setCopiado] = useState(false);
  const [open, setOpen] = useState(false);

  function copiarLink() {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiado(true);
    setOpen(false);
    setTimeout(() => setCopiado(false), 2000);
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${titulo}\n${url}`)}`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-white/30"
      >
        {copiado ? "Copiado" : "Compartir"}
      </button>
      {open ? (
        <div className="absolute right-0 top-9 z-20 min-w-[160px] rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
          <button
            type="button"
            onClick={copiarLink}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            Copiar link
          </button>
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="block px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            Compartir por WhatsApp
          </a>
        </div>
      ) : null}
    </div>
  );
}

function ModalLegalContenido({
  type,
  onClose,
  responsable,
}: {
  type: Exclude<ModalLegal, null>;
  onClose: () => void;
  responsable: ResponsableLegal | null;
}) {
  const domicilio = responsable?.domicilio?.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute right-4 top-4 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900"
        >
          Cerrar
        </button>

        {type === "terms" ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
              Términos y condiciones
            </p>
            <h3 className="mt-2 pr-14 text-2xl font-semibold text-gray-900">
              Tratamiento de datos personales
            </h3>
            <div className="mt-6 space-y-4 text-sm leading-7 text-gray-600">
              <p>
                Los datos personales recabados a través de este formulario serán
                tratados por{" "}
                <span className="font-medium text-gray-900">
                  {responsable?.nombre || "el organizador del evento"}
                </span>
                {responsable?.rut ? (
                  <>
                    , RUT{" "}
                    <span className="font-medium text-gray-900">
                      {responsable.rut}
                    </span>
                  </>
                ) : null}
                {domicilio ? (
                  <>
                    , con domicilio en{" "}
                    <span className="font-medium text-gray-900">{domicilio}</span>
                  </>
                ) : null}
                , con la finalidad de gestionar tu participación en el evento,
                validar tu registro y administrar las comunicaciones operativas
                relacionadas a esta actividad.
              </p>
              <p>
                El tratamiento de la información se realiza conforme a la Ley
                18.331 de Protección de Datos Personales de la República Oriental
                del Uruguay. Podés ejercer tus derechos de acceso, rectificación,
                actualización, inclusión o supresión solicitándolo{" "}
                {responsable?.email ? (
                  <>
                    escribiendo a{" "}
                    <span className="font-medium text-gray-900">
                      {responsable.email}
                    </span>
                  </>
                ) : (
                  "a través de los canales de contacto del organizador"
                )}
                .
              </p>
              {responsable?.legalNotas ? (
                <p className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 italic text-gray-700">
                  {responsable.legalNotas}
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
              Comunicaciones y promociones
            </p>
            <h3 className="mt-2 pr-14 text-2xl font-semibold text-gray-900">
              Consentimiento opcional
            </h3>
            <div className="mt-6 space-y-4 text-sm leading-7 text-gray-600">
              <p>
                Al marcar esta opción autorizás el envío de novedades, contenidos,
                comunicaciones comerciales y promociones relacionadas con este
                evento o con futuras acciones del organizador.
              </p>
              <p>
                Este consentimiento es opcional e independiente de la aceptación
                de los términos y condiciones del registro. No marcar esta casilla
                no afecta tu posibilidad de inscribirte al evento.
              </p>
              <p>
                En cualquier momento podrás dejar de recibir estas comunicaciones
                utilizando los medios de baja o escribiendo al organizador por sus
                canales habituales de contacto.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function EventoForm({ codigo }: { codigo: string }) {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [responsableLegal, setResponsableLegal] = useState<ResponsableLegal | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [aforoLleno, setAforoLleno] = useState(false);

  const [origenOpciones, setOrigenOpciones] = useState<OrigenOpcion[]>([]);
  const [eventoCampos, setEventoCampos] = useState<EventoCampo[]>([]);
  const [organizadores, setOrganizadores] = useState<OrganizadorPublico[]>([]);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    origen: "",
  });
  const [respuestas, setRespuestas] = useState<Record<string, string | string[]>>(
    {},
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [enviado, setEnviado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [urlActual, setUrlActual] = useState("");
  const [modalLegal, setModalLegal] = useState<ModalLegal>(null);

  useEffect(() => {
    setUrlActual(window.location.href);

    const supabase = createClient();

    Promise.all([
      supabase
        .from("eventos")
        .select("*, clientes!eventos_cliente_id_fkey(nombre)")
        .eq("codigo", codigo)
        .single(),
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

      const responsableManual = resolverResponsableManual(ev);
      if (ev.tyc_responsable_cliente_id) {
        const { data: clienteTyC } = await supabase
          .from("clientes")
          .select(
            "id, nombre, razon_social, rut, calle, localidad, departamento, pais, email, legal_notas",
          )
          .eq("id", ev.tyc_responsable_cliente_id)
          .single();
        setResponsableLegal(
          resolverResponsableCliente(clienteTyC as ClienteLegal | null),
        );
      } else if (responsableManual) {
        setResponsableLegal(responsableManual);
      } else if (ev.cliente_id) {
        const { data: clienteEvento } = await supabase
          .from("clientes")
          .select(
            "id, nombre, razon_social, rut, calle, localidad, departamento, pais, email, legal_notas",
          )
          .eq("id", ev.cliente_id)
          .single();
        setResponsableLegal(
          resolverResponsableCliente(clienteEvento as ClienteLegal | null),
        );
      } else {
        setResponsableLegal(null);
      }

      const { data: campos } = await supabase
        .from("evento_campos")
        .select("*")
        .eq("event_id", ev.id)
        .order("orden");
      setEventoCampos(campos || []);

      const { data: organizadoresData } = await supabase
        .from("evento_organizadores")
        .select("id, nombre, telefono")
        .eq("evento_id", ev.id)
        .order("orden");
      setOrganizadores(organizadoresData || []);

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

  useEffect(() => {
    if (!modalLegal) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setModalLegal(null);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [modalLegal]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const inp =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300";

  const camposRequeridosOk = eventoCampos
    .filter((c) => c.requerido)
    .every((c) => {
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
    if (!puedeEnviar || !evento) return;
    setError("");
    setGuardando(true);

    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      const { data: registro, error: err } = await supabase
        .from("registros")
        .insert({
          event_id: evento.id,
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

      const responses: {
        registro_id: string;
        campo_id: string | null;
        valor: string;
      }[] = [];

      if (form.origen) {
        responses.push({
          registro_id: registro.id,
          campo_id: null,
          valor: form.origen,
        });
      }

      for (const campo of eventoCampos) {
        const val = respuestas[campo.id];
        if (
          val === undefined ||
          val === "" ||
          (Array.isArray(val) && val.length === 0)
        ) {
          continue;
        }

        responses.push({
          registro_id: registro.id,
          campo_id: campo.id,
          valor: Array.isArray(val) ? val.join(", ") : val,
        });
      }

      if (responses.length > 0) {
        await supabase.from("registro_respuestas").insert(responses);
      }

      const fechaInfo = formatFecha(evento.fecha_inicio);
      fetch("/api/enviar-confirmacion-registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          email: form.email.trim(),
          eventoId: evento.id,
          eventoTitulo: evento.titulo,
          eventoFecha: fechaInfo?.fechaCorta || null,
          eventoHora: fechaInfo?.hora || null,
          eventoCalle: evento.calle || null,
          eventoCiudad: evento.localidad || null,
          eventoDepartamento: evento.departamento || null,
          registroId: registro.id,
        }),
      }).catch((submitError) =>
        console.error("Error enviando email de confirmacion:", submitError),
      );

      setEnviado(true);
    } catch {
      setError("Error al registrar. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  function renderCampo(campo: EventoCampo) {
    const opciones = (campo.opciones ?? []) as unknown[];

    if (campo.tipo === "text") {
      return (
        <div key={campo.id}>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">
            {campo.label}
            {campo.requerido ? " *" : ""}
          </label>
          <input
            value={(respuestas[campo.id] as string) || ""}
            onChange={(e) =>
              setRespuestas((p) => ({ ...p, [campo.id]: e.target.value }))
            }
            className={inp}
          />
        </div>
      );
    }

    if (campo.tipo === "select") {
      const selectedValues: string[] = Array.isArray(respuestas[campo.id])
        ? (respuestas[campo.id] as string[])
        : respuestas[campo.id]
          ? [respuestas[campo.id] as string]
          : [];

      if (campo.multiple) {
        return (
          <div key={campo.id}>
            <label className="mb-2 block text-xs font-medium text-gray-500">
              {campo.label}
              {campo.requerido ? " *" : ""}
            </label>
            <div className="space-y-2">
              {opciones.map((op) => {
                const val =
                  typeof op === "string"
                    ? op
                    : (op as Record<string, string>).value ??
                      (op as Record<string, string>).label;
                const label =
                  typeof op === "string"
                    ? op
                    : (op as Record<string, string>).label;
                const checked = selectedValues.includes(val);

                return (
                  <label
                    key={val}
                    className="flex cursor-pointer items-center gap-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setRespuestas((p) => ({
                          ...p,
                          [campo.id]: checked
                            ? selectedValues.filter((v) => v !== val)
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
          <label className="mb-1.5 block text-xs font-medium text-gray-500">
            {campo.label}
            {campo.requerido ? " *" : ""}
          </label>
          <select
            value={(respuestas[campo.id] as string) || ""}
            onChange={(e) =>
              setRespuestas((p) => ({ ...p, [campo.id]: e.target.value }))
            }
            className={`${inp} cursor-pointer`}
          >
            <option value="">Seleccioná una opción</option>
            {opciones.map((op) => {
              const val =
                typeof op === "string"
                  ? op
                  : (op as Record<string, string>).value ??
                    (op as Record<string, string>).label;
              const label =
                typeof op === "string"
                  ? op
                  : (op as Record<string, string>).label;
              return (
                <option key={val} value={val}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      );
    }

    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Cargando evento...</p>
      </div>
    );
  }

  if (notFound || !evento) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-3 text-4xl">🔍</p>
          <p className="text-gray-500">Evento no encontrado</p>
        </div>
      </div>
    );
  }

  if (evento.estado !== "activo") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <p className="mb-3 text-4xl">🔒</p>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Formulario no disponible
          </h2>
          <p className="text-sm text-gray-500">
            Este formulario no está activo en este momento.
          </p>
        </div>
      </div>
    );
  }

  const fechaInfo = formatFecha(evento.fecha_inicio);

  if (enviado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <p className="mb-4 text-5xl">🎉</p>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            ¡Registro exitoso!
          </h2>
          <p className="mb-1 text-gray-500">
            Hola {form.nombre}, tu lugar está confirmado.
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Te enviamos un email de confirmación con tu código QR de acceso.
          </p>
          {fechaInfo ? (
            <p className="mt-2 text-sm text-gray-400">
              📅 {fechaInfo.fecha} · {fechaInfo.hora}hs
            </p>
          ) : null}
          {evento.calle || evento.localidad ? (
            <p className="mt-1 text-sm text-gray-400">
              📍 {[evento.calle, evento.localidad, evento.departamento].filter(Boolean).join(", ")}
            </p>
          ) : null}
          {organizadores.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-left">
              <p className="text-sm font-medium text-gray-700">📞 Contacto del organizador</p>
              <div className="mt-2 space-y-1">
                {organizadores.map((organizador) => (
                  <p key={organizador.id} className="text-sm text-gray-500">
                    {organizador.nombre}
                    {organizador.telefono ? ` — ${organizador.telefono}` : ""}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {modalLegal ? (
        <ModalLegalContenido
          type={modalLegal}
          onClose={() => setModalLegal(null)}
          responsable={responsableLegal}
        />
      ) : null}

      {evento.portada_url ? (
        <div className="relative h-56 sm:h-72">
          <img
            src={evento.portada_url}
            alt={evento.titulo}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-sm text-white/70">{evento.clientes?.nombre}</p>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {evento.titulo}
              </h1>
              {!evento.es_gratuito && evento.precio ? (
                <span className="mt-1 inline-block text-sm font-semibold text-amber-400">
                  {evento.moneda} {evento.precio.toLocaleString("es-UY")}
                </span>
              ) : null}
            </div>
            {urlActual ? <BotonCompartir titulo={evento.titulo} url={urlActual} /> : null}
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 px-6 py-8">
          <div className="mx-auto flex max-w-lg items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-sm text-gray-400">{evento.clientes?.nombre}</p>
              <h1 className="text-2xl font-bold text-white">{evento.titulo}</h1>
              {!evento.es_gratuito && evento.precio ? (
                <span className="mt-1 inline-block text-sm font-semibold text-amber-400">
                  {evento.moneda} {evento.precio.toLocaleString("es-UY")}
                </span>
              ) : null}
            </div>
            {urlActual ? <BotonCompartir titulo={evento.titulo} url={urlActual} /> : null}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6 space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          {evento.descripcion ? (
            <p className="text-sm text-gray-600">{evento.descripcion}</p>
          ) : null}
          {fechaInfo ? (
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <span>📅</span>
              <span className="capitalize">
                {fechaInfo.fecha} · {fechaInfo.hora}hs
              </span>
            </div>
          ) : null}
          {evento.calle || evento.localidad ? (
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <span>📍</span>
              <span>
                {[evento.calle, evento.localidad, evento.departamento]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          ) : null}
          <div className="flex items-center gap-3 border-t border-gray-100 pt-1">
            <span>🎟</span>
            {evento.es_gratuito ? (
              <span className="text-sm font-semibold text-green-600">
                Entrada gratuita
              </span>
            ) : (
              <span className="text-sm font-semibold text-gray-900">
                {evento.moneda} {evento.precio?.toLocaleString("es-UY")}
              </span>
            )}
          </div>
        </div>

        {aforoLleno ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <p className="mb-3 text-4xl">😔</p>
            <h2 className="mb-2 text-lg font-bold text-gray-900">
              Cupos agotados
            </h2>
            <p className="text-sm text-gray-500">
              Ya no hay lugares disponibles para este evento.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Registrarme al evento
            </h2>

            {error ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">
                    Nombre *
                  </label>
                  <input
                    value={form.nombre}
                    onChange={(e) => set("nombre", e.target.value)}
                    placeholder="Juan"
                    className={inp}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">
                    Apellido *
                  </label>
                  <input
                    value={form.apellido}
                    onChange={(e) => set("apellido", e.target.value)}
                    placeholder="García"
                    className={inp}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => set("telefono", e.target.value)}
                  placeholder="+598 9XX XXX XXX"
                  className={inp}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="juan@gmail.com"
                  className={inp}
                />
              </div>

              {origenOpciones.length > 0 ? (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">
                    ¿Dónde nos conociste?
                  </label>
                  <select
                    value={form.origen}
                    onChange={(e) => set("origen", e.target.value)}
                    className={`${inp} cursor-pointer`}
                  >
                    <option value="">Seleccioná una opción</option>
                    {origenOpciones.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {eventoCampos.map((campo) => renderCampo(campo))}

              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3">
                  <input
                    id="termsAccepted"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 accent-gray-900"
                  />
                  <div className="text-xs leading-relaxed text-gray-500">
                    <label htmlFor="termsAccepted" className="cursor-pointer">
                      Acepto los{" "}
                    </label>
                    <button
                      type="button"
                      onClick={() => setModalLegal("terms")}
                      className="font-medium text-gray-700 underline decoration-gray-300 underline-offset-2 transition-colors hover:text-gray-900"
                    >
                      términos y condiciones
                    </button>
                    <span> del evento. *</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    id="marketingOptIn"
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 accent-gray-900"
                  />
                  <div className="text-xs leading-relaxed text-gray-500">
                    <label htmlFor="marketingOptIn" className="cursor-pointer">
                      Acepto recibir{" "}
                    </label>
                    <button
                      type="button"
                      onClick={() => setModalLegal("marketing")}
                      className="font-medium text-gray-700 underline decoration-gray-300 underline-offset-2 transition-colors hover:text-gray-900"
                    >
                      comunicaciones y promociones
                    </button>
                    <span> relacionadas al evento.</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!puedeEnviar}
                className="w-full rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {guardando
                  ? "Registrando..."
                  : evento.es_gratuito
                    ? "Confirmar mi registro ->"
                    : `Registrarme - ${evento.moneda} ${evento.precio?.toLocaleString("es-UY")} ->`}
              </button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          Formulario creado con{" "}
          <span className="font-medium text-gray-500">Sustancial</span>
        </p>
      </div>
    </div>
  );
}
