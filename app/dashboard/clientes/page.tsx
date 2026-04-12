"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Servicio {
  tipo: "web-hosting" | "smm";
  label: string;
  icon: string;
  slug?: string;
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
  // Service Owner
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
    servicios: [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "centro-motos-uruguay" }],
  },
  {
    id: "franca-comics",
    nombre: "Franca Comics",
    pais: "Uruguay",
    estado: "activo",
    servicios: [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "franca-comics" }],
  },
  {
    id: "finrel",
    nombre: "Finrel",
    pais: "Uruguay",
    estado: "activo",
    servicios: [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "finrel" }],
  },
  {
    id: "vistalsur",
    nombre: "Vistalsur",
    pais: "Uruguay",
    estado: "activo",
    servicios: [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "vistalsur" }],
  },
  {
    id: "espacio-chamanga",
    nombre: "Espacio Chamangá",
    pais: "Uruguay",
    estado: "activo",
    servicios: [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "espacio-chamanga" }],
  },
  {
    id: "jt-de-leon",
    nombre: "JT de León",
    pais: "Uruguay",
    estado: "activo",
    servicios: [{ tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "jt-de-leon" }],
  },
  {
    id: "pastas-florida",
    nombre: "Pastas Florida",
    pais: "Uruguay",
    estado: "activo",
    servicios: [
      { tipo: "web-hosting", label: "Web / Hosting", icon: "🌐", slug: "pastas-florida" },
      { tipo: "smm", label: "SMM", icon: "📱" },
    ],
  },
];

const FILTERS = ["Todos", "Activo", "Inactivo"];

// ─── Modal Nuevo Cliente ──────────────────────────────────────────────────────

function NuevoClienteModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    nombre: "", razonSocial: "", rut: "", direccion: "",
    ciudad: "", pais: "Uruguay", email: "", telefono: "",
    soNombre: "", soTelefono: "", soCI: "", soFechaNac: "",
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">+ Nuevo cliente</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl">✕</button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Datos de la empresa */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">🏢 Datos de la empresa</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Nombre comercial *", key: "nombre" },
                { label: "Razón social", key: "razonSocial" },
                { label: "RUT", key: "rut" },
                { label: "País", key: "pais" },
                { label: "Ciudad", key: "ciudad" },
                { label: "Dirección", key: "direccion" },
                { label: "Email", key: "email", type: "email" },
                { label: "Teléfono", key: "telefono", type: "tel" },
              ].map(({ label, key, type = "text" }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">{label}</label>
                  <input type={type} value={(form as any)[key]}
                    onChange={e => set(key, e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Service Owner */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">👤 Service Owner</h3>
            <p className="text-xs text-gray-600 mb-3">Persona que contrata el servicio</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Nombre y Apellido", key: "soNombre" },
                { label: "Teléfono", key: "soTelefono", type: "tel" },
                { label: "Cédula de Identidad", key: "soCI" },
                { label: "Fecha de nacimiento", key: "soFechaNac", type: "date" },
              ].map(({ label, key, type = "text" }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">{label}</label>
                  <input type={type} value={(form as any)[key]}
                    onChange={e => set(key, e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-6 py-4 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors">
            ✅ Guardar cliente
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ClientesPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [showNuevo, setShowNuevo] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/"); return; }
      setUserName(user.user_metadata?.full_name ?? user.email ?? "");
    });
  }, [router]);

  const filtered = clientesData.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "Todos" || c.estado === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  const activos = clientesData.filter(c => c.estado === "activo").length;
  const inactivos = clientesData.filter(c => c.estado === "inactivo").length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {showNuevo && <NuevoClienteModal onClose={() => setShowNuevo(false)} />}

      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")}
            className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Volver al dashboard
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

      <main className="px-6 py-8 max-w-6xl mx-auto">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">👥 Clientes</h1>
          <p className="text-gray-400 mt-1 text-sm">Base de datos central de clientes vinculados a servicios</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Total Clientes</p>
            <p className="text-2xl font-bold text-white">{clientesData.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Activos</p>
            <p className="text-2xl font-bold text-green-400">{activos}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Inactivos</p>
            <p className="text-2xl font-bold text-red-400">{inactivos}</p>
          </div>
        </div>

        {/* Búsqueda + Filtros + Nuevo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Buscar cliente..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === f ? "bg-blue-600 text-white" : "bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowNuevo(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors whitespace-nowrap">
            + Nuevo cliente
          </button>
        </div>

        {/* Tabla */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">Cliente</th>
                <th className="text-left px-5 py-3">Contacto</th>
                <th className="text-left px-5 py-3">País</th>
                <th className="text-left px-5 py-3">Servicios</th>
                <th className="text-center px-5 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}
                  onClick={() => router.push(`/dashboard/clientes/${c.id}`)}
                  className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors cursor-pointer group">
                  <td className="px-5 py-4">
                    <p className="font-medium text-white group-hover:text-blue-400 transition-colors">{c.nombre}</p>
                    {c.razonSocial && <p className="text-xs text-gray-500 mt-0.5">{c.razonSocial}</p>}
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs">
                    {c.email && <p>{c.email}</p>}
                    {c.telefono && <p>{c.telefono}</p>}
                    {!c.email && !c.telefono && <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-5 py-4 text-gray-300">{c.pais || "—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {c.servicios.map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full text-gray-300">
                          {s.icon} {s.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.estado === "activo" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                      {c.estado === "activo" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">No se encontraron clientes</div>
          )}
        </div>
      </main>
    </div>
  );
}