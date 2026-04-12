"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Servicio {
  tipo: "web-hosting" | "smm";
  label: string;
  icon: string;
  slug?: string;
  estado?: string;
  pct?: number;
  vence?: string;
}

interface Cliente {
  id: string;
  nombre: string;
  razonSocial?: string;
  rut?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  email?: string;
  telefono?: string;
  estado: "activo" | "inactivo";
  servicios: Servicio[];
  soNombre?: string;
  soTelefono?: string;
  soCI?: string;
  soFechaNac?: string;
}

// ─── Datos estáticos ──────────────────────────────────────────────────────────

const clientesData: Cliente[] = [
  {
    id: "centro-motos-uruguay",
    nombre: "Centro Motos Uruguay",
    pais: "Uruguay",
    estado: "activo",
    servicios: [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "centro-motos-uruguay", estado: "Vencido", pct: 100, vence: "10/03/2026" }],
  },
  {
    id: "franca-comics",
    nombre: "Franca Comics",
    pais: "Uruguay",
    estado: "activo",
    servicios: [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "franca-comics", estado: "Por vencer", pct: 90, vence: "18/05/2026" }],
  },
  {
    id: "finrel",
    nombre: "Finrel",
    pais: "Uruguay",
    estado: "activo",
    servicios: [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "finrel", estado: "Por vencer", pct: 72, vence: "27/06/2026" }],
  },
  {
    id: "vistalsur",
    nombre: "Vistalsur",
    pais: "Uruguay",
    estado: "activo",
    servicios: [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "vistalsur", estado: "Por vencer", pct: 68, vence: "06/07/2026" }],
  },
  {
    id: "espacio-chamanga",
    nombre: "Espacio Chamangá",
    pais: "Uruguay",
    estado: "activo",
    servicios: [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "espacio-chamanga", estado: "Activo", pct: 13, vence: "02/05/2027" }],
  },
  {
    id: "jt-de-leon",
    nombre: "JT de León",
    pais: "Uruguay",
    estado: "activo",
    servicios: [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "jt-de-leon", estado: "Activo", pct: 22, vence: "05/11/2027" }],
  },
  {
    id: "pastas-florida",
    nombre: "Pastas Florida",
    pais: "Uruguay",
    estado: "activo",
    servicios: [
      { tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "pastas-florida", estado: "Activo", pct: 34, vence: "06/08/2027" },
      { tipo: "smm", label: "SMM", icon: "📱", estado: "Activo" },
    ],
  },
];

// ─── Utilidades ───────────────────────────────────────────────────────────────

function EditableField({ label, value, onChange, locked = false, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; locked?: boolean; type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);

  if (locked) return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-600 italic">{value || "—"}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      {editing ? (
        <input autoFocus type={type} value={local}
          onChange={e => setLocal(e.target.value)}
          onBlur={() => { setEditing(false); onChange(local); }}
          onKeyDown={e => e.key === "Enter" && (setEditing(false), onChange(local))}
          className="text-sm text-white bg-gray-800 border border-blue-500 rounded px-2 py-1 focus:outline-none w-full" />
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">{title}</h3>
      {children}
    </div>
  );
}

function CircleProgressSmall({ pct, estado }: { pct: number; estado: string }) {
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

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ClienteDetallePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const base = clientesData.find(c => c.id === slug);
  const [cliente, setCliente] = useState<Cliente | null>(base ?? null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/"); return; }
      setUserName(user.user_metadata?.full_name ?? user.email ?? "");
    });
  }, [router]);

  if (!cliente) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 mb-4">Cliente no encontrado</p>
        <button onClick={() => router.push("/dashboard/clientes")} className="text-blue-400 text-sm">← Volver</button>
      </div>
    </div>
  );

  const update = (patch: Partial<Cliente>) => setCliente(p => p ? { ...p, ...patch } : p);

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
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">👥 {cliente.nombre}</h1>
                {cliente.razonSocial && <p className="text-sm text-gray-500 mt-0.5">{cliente.razonSocial}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cliente.estado === "activo" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                    {cliente.estado === "activo" ? "Activo" : "Inactivo"}
                  </span>
                  {cliente.pais && <span className="text-xs text-gray-500">· {cliente.pais}</span>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="text-sm text-white">{cliente.email || "—"}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Teléfono</p>
                <p className="text-sm text-white">{cliente.telefono || "—"}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Servicios activos</p>
                <p className="text-sm font-bold text-white">{cliente.servicios.length}</p>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Acciones</p>
            <button className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors text-left">
              <span>📄</span><span>Descargar ficha</span>
            </button>
            <button className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg border border-red-800 bg-red-900/20 text-sm text-red-400 hover:bg-red-900/30 transition-colors text-left">
              <span>⛔</span><span>Desactivar cliente</span>
            </button>
          </div>
        </div>

        {/* Datos de la empresa */}
        <Section title="🏢 Datos de la empresa">
          <div className="grid grid-cols-2 gap-4">
            <EditableField label="Nombre comercial" value={cliente.nombre} onChange={v => update({ nombre: v })} />
            <EditableField label="Razón social" value={cliente.razonSocial || ""} onChange={v => update({ razonSocial: v })} />
            <EditableField label="RUT" value={cliente.rut || ""} onChange={v => update({ rut: v })} />
            <EditableField label="País" value={cliente.pais || ""} onChange={v => update({ pais: v })} />
            <EditableField label="Ciudad" value={cliente.ciudad || ""} onChange={v => update({ ciudad: v })} />
            <EditableField label="Dirección" value={cliente.direccion || ""} onChange={v => update({ direccion: v })} />
            <EditableField label="Email" value={cliente.email || ""} onChange={v => update({ email: v })} type="email" />
            <EditableField label="Teléfono" value={cliente.telefono || ""} onChange={v => update({ telefono: v })} type="tel" />
          </div>
        </Section>

        {/* Service Owner */}
        <Section title="👤 Service Owner — Persona que contrata">
          <div className="grid grid-cols-2 gap-4">
            <EditableField label="Nombre y Apellido" value={cliente.soNombre || ""} onChange={v => update({ soNombre: v })} />
            <EditableField label="Teléfono" value={cliente.soTelefono || ""} onChange={v => update({ soTelefono: v })} />
            <EditableField label="Cédula de Identidad" value={cliente.soCI || ""} onChange={v => update({ soCI: v })} />
            <EditableField label="Fecha de nacimiento" value={cliente.soFechaNac || ""} onChange={v => update({ soFechaNac: v })} type="date" />
          </div>
        </Section>

        {/* Servicios contratados */}
        <Section title="🔗 Servicios contratados">
          <div className="space-y-3">
            {cliente.servicios.map((s, i) => {
              const estadoCls = s.estado === "Vencido"
                ? "bg-red-900/40 text-red-400"
                : s.estado === "Por vencer"
                ? "bg-yellow-900/40 text-yellow-400"
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
                    {s.estado && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoCls}`}>{s.estado}</span>
                    )}
                    {s.pct !== undefined && <CircleProgressSmall pct={s.pct} estado={s.estado || ""} />}
                    {s.slug && (
                      <button
                        onClick={() => s.tipo === "web-hosting"
                          ? window.location.href = `/dashboard/web-hosting/cliente/${s.slug}`
                          : null}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 transition-colors">
                        Ver ficha →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

      </main>
    </div>
  );
}