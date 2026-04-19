"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";

interface Cliente {
  id: string;
  nombre: string;
  razon_social?: string;
  rut?: string;
  departamento?: string;
  localidad?: string;
  calle?: string;
  pais?: string;
  email?: string;
  telefono?: string;
  telefono2?: string;
  whatsapp1?: string;
  whatsapp2?: string;
  estado: "activo" | "inactivo";
  // Service Owner
  so_nombre?: string;
  so_apellido?: string;
  so_telefono?: string;
  so_ci?: string;
  so_fecha_nac?: string;
  so_departamento?: string;
  so_localidad?: string;
  so_direccion?: string;
  // Administrador / Contacto Operativo
  admin_nombre?: string;
  admin_apellido?: string;
  admin_telefono?: string;
  admin_email?: string;
  admin_ci?: string;
  admin_departamento?: string;
  admin_localidad?: string;
  admin_direccion?: string;
  // Legales
  legal_notas?: string;
}

const serviciosPorCliente: Record<string, { tipo: string; label: string; icon: string; slug?: string; estado?: string; pct?: number; vence?: string }[]> = {
  "centro-motos-uruguay": [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "centro-motos-uruguay", estado: "Vencido", pct: 100, vence: "10/03/2026" }],
  "franca-comics":        [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "franca-comics", estado: "Por vencer", pct: 90, vence: "18/05/2026" }],
  "finrel":               [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "finrel", estado: "Por vencer", pct: 72, vence: "27/06/2026" }],
  "vistalsur":            [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "vistalsur", estado: "Por vencer", pct: 68, vence: "06/07/2026" }],
  "espacio-chamanga":     [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "espacio-chamanga", estado: "Activo", pct: 13, vence: "02/05/2027" }],
  "jt-de-leon":           [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "jt-de-leon", estado: "Activo", pct: 22, vence: "05/11/2027" }],
  "pastas-florida":       [
    { tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "pastas-florida", estado: "Activo", pct: 34, vence: "06/08/2027" },
    { tipo: "smm", label: "SMM", icon: "📱", estado: "Activo" },
  ],
};

function EditableField({ label, value, onChange, type = "text", placeholder = "", multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      {editing ? (
        multiline ? (
          <textarea autoFocus value={local} placeholder={placeholder}
            onChange={e => setLocal(e.target.value)}
            onBlur={() => { setEditing(false); onChange(local); }}
            rows={3}
            className="text-sm text-white bg-gray-800 border border-blue-500 rounded px-2 py-1 focus:outline-none w-full resize-none" />
        ) : (
          <input autoFocus type={type} value={local} placeholder={placeholder}
            onChange={e => setLocal(e.target.value)}
            onBlur={() => { setEditing(false); onChange(local); }}
            onKeyDown={e => e.key === "Enter" && (setEditing(false), onChange(local))}
            className="text-sm text-white bg-gray-800 border border-blue-500 rounded px-2 py-1 focus:outline-none w-full" />
        )
      ) : (
        <button onClick={() => { setLocal(value); setEditing(true); }}
          className="text-left text-sm text-gray-200 hover:text-white border border-transparent hover:border-gray-600 rounded px-2 py-1 -ml-2 transition-colors flex items-center gap-1.5 group">
          <span>{value || <span className="text-gray-600 italic">Sin dato</span>}</span>
          <span className="opacity-0 group-hover:opacity-100 text-gray-500 text-xs transition-opacity">✏️</span>
        </button>
      )}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
      {description && <p className="text-xs text-gray-600 mt-1 mb-5">{description}</p>}
      {!description && <div className="mb-5" />}
      {children}
    </div>
  );
}

function SubSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-800 pt-4 mt-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</p>
      {description && <p className="text-xs text-gray-600 mb-3 italic">{description}</p>}
      {children}
    </div>
  );
}

function CircleProgressSmall({ pct }: { pct: number }) {
  const r = 18; const circ = 2 * Math.PI * r;
  const color = pct >= 100 ? "#f87171" : pct >= 61 ? "#fbbf24" : "#34d399";
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#1f2937" strokeWidth="5" />
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${(Math.min(pct, 100) / 100) * circ} ${circ}`}
        strokeLinecap="round" transform="rotate(-90 22 22)" />
      <text x="22" y="26" textAnchor="middle" fontSize="9" fontWeight="700" fill="white">{Math.min(pct, 100)}%</text>
    </svg>
  );
}

function TyCPreview({ cliente }: { cliente: Cliente }) {
  const responsable = cliente.razon_social || cliente.nombre;
  const rut = cliente.rut;
  const domicilio = [cliente.calle, cliente.localidad, cliente.departamento, cliente.pais || "Uruguay"].filter(Boolean).join(", ");
  const email = cliente.email;

  const faltanDatos = !rut || !cliente.calle || !email;

  return (
    <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Preview — Texto del modal T&C</p>
      {faltanDatos && (
        <div className="mb-3 flex items-start gap-2 bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-3 py-2">
          <span className="text-yellow-400 text-xs mt-0.5">⚠️</span>
          <p className="text-xs text-yellow-400">
            Faltan datos para completar el texto legal:{" "}
            {[!rut && "RUT", !cliente.calle && "Dirección", !email && "Email"].filter(Boolean).join(", ")}.
          </p>
        </div>
      )}
      <p className="text-xs text-gray-300 leading-relaxed">
        Los datos personales recabados serán tratados por{" "}
        <span className="text-white font-medium">{responsable}</span>
        {rut && <>, RUT <span className="text-white font-medium">{rut}</span></>}
        {domicilio && <>, con domicilio en <span className="text-white font-medium">{domicilio}</span></>}
        , con la finalidad de gestionar su participación en el evento y, si lo autoriza, el envío de comunicaciones comerciales y promociones relacionadas.
      </p>
      <p className="text-xs text-gray-300 leading-relaxed mt-2">
        Podés ejercer tus derechos de acceso, rectificación, eliminación y oposición{" "}
        {email
          ? <>escribiendo a <span className="text-white font-medium">{email}</span></>
          : <span className="text-yellow-400">— email de contacto no configurado —</span>
        }
        , en cumplimiento de la Ley 18.331 de Protección de Datos Personales de la República Oriental del Uruguay.
      </p>
      {cliente.legal_notas && (
        <p className="text-xs text-gray-400 leading-relaxed mt-2 border-t border-gray-700 pt-2 italic">
          {cliente.legal_notas}
        </p>
      )}
    </div>
  );
}

export default function ClienteDetallePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/"); return; }
      setUserName(user.user_metadata?.full_name ?? user.email ?? "");
    });
    supabase.from("clientes").select("*").eq("id", slug).single()
      .then(({ data }) => { if (data) setCliente(data); setLoading(false); });
  }, [router, slug]);

  async function guardarCambios(patch: Partial<Cliente>) {
    if (!cliente) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("clientes")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", slug);
    if (!error) {
      setCliente(p => p ? { ...p, ...patch } : p);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    }
    setSaving(false);
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Cargando cliente...</p>
    </div>
  );

  if (!cliente) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 mb-4">Cliente no encontrado</p>
        <button onClick={() => router.push("/dashboard/clientes")} className="text-blue-400 text-sm">← Volver</button>
      </div>
    </div>
  );

  const servicios = serviciosPorCliente[slug] || [];
  const soNombreCompleto = [cliente.so_nombre, cliente.so_apellido].filter(Boolean).join(" ") || "—";
  const adminNombreCompleto = [cliente.admin_nombre, cliente.admin_apellido].filter(Boolean).join(" ");
  const ubicacionEmpresa = [cliente.localidad, cliente.departamento, cliente.pais].filter(Boolean).join(", ");
  const tieneAdmin = !!(cliente.admin_nombre || cliente.admin_apellido || cliente.admin_telefono);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/clientes")} className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Volver a Clientes
          </button>
          <span className="text-gray-700">|</span>
          <span className="text-lg font-semibold">⚡ LabOS</span>
        </div>
        <div className="flex items-center gap-4">
          {guardado && <span className="text-xs text-green-400">✅ Guardado</span>}
          {saving && <span className="text-xs text-gray-400">Guardando...</span>}
          {userName && <span className="text-sm text-gray-400">👤 {userName}</span>}
          <button onClick={async () => { const s = createClient(); await s.auth.signOut(); router.push("/"); }}
            className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="px-6 py-8 max-w-5xl mx-auto space-y-6">

        {/* Hero */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h1 className="text-xl font-bold text-white">👥 {cliente.nombre}</h1>
            {cliente.razon_social && <p className="text-sm text-gray-500 mt-0.5">{cliente.razon_social}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cliente.estado === "activo" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                {cliente.estado === "activo" ? "Activo" : "Inactivo"}
              </span>
              {ubicacionEmpresa && <span className="text-xs text-gray-500">· 📍 {ubicacionEmpresa}</span>}
              {soNombreCompleto !== "—" && <span className="text-xs text-gray-500">· Owner: {soNombreCompleto}</span>}
              {adminNombreCompleto && <span className="text-xs text-amber-400">· Admin: {adminNombreCompleto}</span>}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">📞 Teléfono</p>
                <p className="text-sm text-white">{cliente.telefono || "—"}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">💬 WhatsApp 1</p>
                <p className="text-sm text-green-400">{cliente.whatsapp1 || "—"}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">💬 WhatsApp 2</p>
                <p className="text-sm text-green-400">{cliente.whatsapp2 || "—"}</p>
              </div>
            </div>
          </div>

          <div className="col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Acciones</p>
            <button className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors text-left">
              <span>📄</span><span>Descargar ficha</span>
            </button>
            <button onClick={() => guardarCambios({ estado: cliente.estado === "activo" ? "inactivo" : "activo" })}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm transition-colors text-left ${cliente.estado === "activo" ? "border-red-800 bg-red-900/20 text-red-400 hover:bg-red-900/30" : "border-green-800 bg-green-900/20 text-green-400 hover:bg-green-900/30"}`}>
              <span>{cliente.estado === "activo" ? "⛔" : "✅"}</span>
              <span>{cliente.estado === "activo" ? "Desactivar cliente" : "Activar cliente"}</span>
            </button>
          </div>
        </div>

        {/* Datos de la empresa */}
        <Section title="🏢 Datos de la empresa">
          <div className="grid grid-cols-2 gap-4">
            <EditableField label="Nombre comercial" value={cliente.nombre} onChange={v => guardarCambios({ nombre: v })} />
            <EditableField label="Razón social" value={cliente.razon_social || ""} onChange={v => guardarCambios({ razon_social: v })} />
            <EditableField label="RUT" value={cliente.rut || ""} onChange={v => guardarCambios({ rut: v })} />
            <EditableField label="Email" value={cliente.email || ""} onChange={v => guardarCambios({ email: v })} type="email" />
          </div>

          <SubSection title="📍 Ubicación de la empresa">
            <div className="grid grid-cols-3 gap-4">
              <EditableField label="País" value={cliente.pais || ""} onChange={v => guardarCambios({ pais: v })} placeholder="Ej: Uruguay" />
              <EditableField label="Departamento" value={cliente.departamento || ""} onChange={v => guardarCambios({ departamento: v })} placeholder="Ej: Montevideo" />
              <EditableField label="Localidad" value={cliente.localidad || ""} onChange={v => guardarCambios({ localidad: v })} placeholder="Ej: Ciudad Vieja" />
              <div className="col-span-3">
                <EditableField label="Calle / Dirección" value={cliente.calle || ""} onChange={v => guardarCambios({ calle: v })} placeholder="Ej: Av. 18 de Julio 1234" />
              </div>
            </div>
          </SubSection>

          <SubSection title="📞 Teléfonos y WhatsApp">
            <div className="grid grid-cols-3 gap-4">
              <EditableField label="Teléfono fijo" value={cliente.telefono || ""} onChange={v => guardarCambios({ telefono: v })} type="tel" placeholder="+598 2XXX XXXX" />
              <EditableField label="WhatsApp 1" value={cliente.whatsapp1 || ""} onChange={v => guardarCambios({ whatsapp1: v })} type="tel" placeholder="+598 9XX XXX XXX" />
              <EditableField label="WhatsApp 2" value={cliente.whatsapp2 || ""} onChange={v => guardarCambios({ whatsapp2: v })} type="tel" placeholder="+598 9XX XXX XXX" />
            </div>
          </SubSection>
          <p className="text-xs text-gray-600 mt-4 italic">Los cambios se guardan automáticamente al salir de cada campo</p>
        </Section>

        {/* Service Owner */}
        <Section title="👤 Service Owner" description="Titular del servicio — quien contrata y es responsable legal">
          <div className="grid grid-cols-2 gap-4">
            <EditableField label="Nombre" value={cliente.so_nombre || ""} onChange={v => guardarCambios({ so_nombre: v })} placeholder="Ej: Juan" />
            <EditableField label="Apellido" value={cliente.so_apellido || ""} onChange={v => guardarCambios({ so_apellido: v })} placeholder="Ej: García" />
            <EditableField label="Teléfono" value={cliente.so_telefono || ""} onChange={v => guardarCambios({ so_telefono: v })} type="tel" />
            <EditableField label="Cédula de Identidad" value={cliente.so_ci || ""} onChange={v => guardarCambios({ so_ci: v })} />
            <EditableField label="Fecha de nacimiento" value={cliente.so_fecha_nac || ""} onChange={v => guardarCambios({ so_fecha_nac: v })} type="date" />
          </div>

          <SubSection title="📍 Ubicación" description="Completar si difiere de la ubicación de la empresa">
            <div className="grid grid-cols-3 gap-4">
              <EditableField label="Departamento" value={cliente.so_departamento || ""} onChange={v => guardarCambios({ so_departamento: v })} placeholder="Ej: Maldonado" />
              <EditableField label="Localidad" value={cliente.so_localidad || ""} onChange={v => guardarCambios({ so_localidad: v })} placeholder="Ej: Punta del Este" />
              <EditableField label="Dirección" value={cliente.so_direccion || ""} onChange={v => guardarCambios({ so_direccion: v })} />
            </div>
          </SubSection>
        </Section>

        {/* Administrador / Contacto Operativo */}
        <Section title="🔑 Administrador / Contacto Operativo"
          description="Persona que gestiona el servicio en nombre del Service Owner. Ej: Marcelo Buscio para JT de León.">
          <div className="grid grid-cols-2 gap-4">
            <EditableField label="Nombre" value={cliente.admin_nombre || ""} onChange={v => guardarCambios({ admin_nombre: v })} placeholder="Ej: Marcelo" />
            <EditableField label="Apellido" value={cliente.admin_apellido || ""} onChange={v => guardarCambios({ admin_apellido: v })} placeholder="Ej: Buscio" />
            <EditableField label="Teléfono" value={cliente.admin_telefono || ""} onChange={v => guardarCambios({ admin_telefono: v })} type="tel" />
            <EditableField label="Email" value={cliente.admin_email || ""} onChange={v => guardarCambios({ admin_email: v })} type="email" />
            <EditableField label="Cédula de Identidad" value={cliente.admin_ci || ""} onChange={v => guardarCambios({ admin_ci: v })} />
          </div>

          <SubSection title="📍 Ubicación" description="Completar si difiere de la ubicación de la empresa">
            <div className="grid grid-cols-3 gap-4">
              <EditableField label="Departamento" value={cliente.admin_departamento || ""} onChange={v => guardarCambios({ admin_departamento: v })} />
              <EditableField label="Localidad" value={cliente.admin_localidad || ""} onChange={v => guardarCambios({ admin_localidad: v })} />
              <EditableField label="Dirección" value={cliente.admin_direccion || ""} onChange={v => guardarCambios({ admin_direccion: v })} />
            </div>
          </SubSection>

          {!tieneAdmin && (
            <p className="text-xs text-gray-600 mt-3 italic">Sin administrador asignado. Completá los campos si el cliente tiene una persona delegada.</p>
          )}
        </Section>

        {/* Legales */}
        <Section title="⚖️ Legales" description="Información utilizada como responsable del tratamiento de datos en formularios de marketing (Ley 18.331 Uruguay).">
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-lg px-4 py-3 mb-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              El texto de Términos y Condiciones se genera automáticamente usando los datos de{" "}
              <span className="text-gray-300">Razón social, RUT, Email y Ubicación</span> cargados en la sección{" "}
              <span className="text-gray-300">Datos de la empresa</span>. Completá esos campos para que el preview sea correcto.
            </p>
          </div>

          <EditableField
            label="Notas legales adicionales (opcional)"
            value={cliente.legal_notas || ""}
            onChange={v => guardarCambios({ legal_notas: v })}
            placeholder="Ej: Los datos serán compartidos con el organizador del evento según acuerdo vigente."
            multiline
          />

          <TyCPreview cliente={cliente} />
        </Section>

        {/* Servicios contratados */}
        <Section title="🔗 Servicios contratados">
          {servicios.length === 0 ? (
            <p className="text-sm text-gray-500">Sin servicios contratados aún.</p>
          ) : (
            <div className="space-y-3">
              {servicios.map((s, i) => {
                const estadoCls = s.estado === "Vencido" ? "bg-red-900/40 text-red-400"
                  : s.estado === "Por vencer" ? "bg-yellow-900/40 text-yellow-400"
                  : "bg-green-900/40 text-green-400";
                return (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{s.icon}</span>
                      <div>
                        <p className="font-medium text-white">{s.label}</p>
                        {s.vence && <p className="text-xs text-gray-500 mt-0.5">Vence: {s.vence}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.estado && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoCls}`}>{s.estado}</span>}
                      {s.pct !== undefined && <CircleProgressSmall pct={s.pct} />}
                      {s.slug && (
                        <button onClick={() => router.push(`/dashboard/web-hosting/cliente/${s.slug}`)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 transition-colors">
                          Ver ficha →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

      </main>
    </div>
  );
}