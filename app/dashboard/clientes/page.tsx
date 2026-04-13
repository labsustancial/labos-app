"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  so_nombre?: string;
  so_apellido?: string;
  so_telefono?: string;
  so_ci?: string;
  so_fecha_nac?: string;
  so_departamento?: string;
  so_localidad?: string;
  so_direccion?: string;
  admin_nombre?: string;
  admin_apellido?: string;
  admin_telefono?: string;
  admin_email?: string;
  admin_ci?: string;
  admin_departamento?: string;
  admin_localidad?: string;
  admin_direccion?: string;
}

const serviciosPorCliente: Record<string, { label: string; icon: string }[]> = {
  "centro-motos-uruguay": [{ label: "Web / Hosting", icon: "🌐" }],
  "franca-comics":        [{ label: "Web / Hosting", icon: "🌐" }],
  "finrel":               [{ label: "Web / Hosting", icon: "🌐" }],
  "vistalsur":            [{ label: "Web / Hosting", icon: "🌐" }],
  "espacio-chamanga":     [{ label: "Web / Hosting", icon: "🌐" }],
  "jt-de-leon":           [{ label: "Web / Hosting", icon: "🌐" }],
  "pastas-florida":       [{ label: "Web / Hosting", icon: "🌐" }, { label: "SMM", icon: "📱" }],
};

const FILTERS = ["Todos", "Activo", "Inactivo"];

function NuevoClienteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "", razon_social: "", rut: "",
    pais: "Uruguay", departamento: "", localidad: "", calle: "",
    email: "", telefono: "", telefono2: "", whatsapp1: "", whatsapp2: "",
    so_nombre: "", so_apellido: "", so_telefono: "", so_ci: "", so_fecha_nac: "",
    so_departamento: "", so_localidad: "", so_direccion: "",
    admin_nombre: "", admin_apellido: "", admin_telefono: "", admin_email: "", admin_ci: "",
    admin_departamento: "", admin_localidad: "", admin_direccion: "",
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const inp = "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500";

  function generarId(nombre: string) {
    return nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
  }

  async function handleGuardar() {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio"); return; }
    setLoading(true); setError("");
    try {
      const supabase = createClient();
      const { error: err } = await supabase.from("clientes").insert({
        id: generarId(form.nombre),
        nombre: form.nombre.trim(),
        razon_social: form.razon_social || null, rut: form.rut || null,
        pais: form.pais || "Uruguay", departamento: form.departamento || null,
        localidad: form.localidad || null, calle: form.calle || null,
        email: form.email || null, telefono: form.telefono || null,
        telefono2: form.telefono2 || null, whatsapp1: form.whatsapp1 || null,
        whatsapp2: form.whatsapp2 || null, estado: "activo",
        so_nombre: form.so_nombre || null, so_apellido: form.so_apellido || null,
        so_telefono: form.so_telefono || null, so_ci: form.so_ci || null,
        so_fecha_nac: form.so_fecha_nac || null, so_departamento: form.so_departamento || null,
        so_localidad: form.so_localidad || null, so_direccion: form.so_direccion || null,
        admin_nombre: form.admin_nombre || null, admin_apellido: form.admin_apellido || null,
        admin_telefono: form.admin_telefono || null, admin_email: form.admin_email || null,
        admin_ci: form.admin_ci || null, admin_departamento: form.admin_departamento || null,
        admin_localidad: form.admin_localidad || null, admin_direccion: form.admin_direccion || null,
      });
      if (err) throw err;
      onCreated(); onClose();
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">+ Nuevo cliente</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>
        <div className="px-6 py-5 space-y-6">
          {error && <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-4 py-3 text-sm text-red-300">⚠️ {error}</div>}

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">🏢 Datos de la empresa</h3>
            <div className="grid grid-cols-2 gap-4">
              {[["Nombre comercial *","nombre"],["Razón social","razon_social"],["RUT","rut"],["Email","email"]].map(([l,k]) => (
                <div key={k} className="flex flex-col gap-1"><label className="text-xs text-gray-500">{l}</label>
                  <input value={(form as any)[k]} onChange={e => set(k, e.target.value)} className={inp} /></div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">📍 Ubicación</h3>
            <div className="grid grid-cols-3 gap-4">
              {[["País","pais"],["Departamento","departamento"],["Localidad","localidad"]].map(([l,k]) => (
                <div key={k} className="flex flex-col gap-1"><label className="text-xs text-gray-500">{l}</label>
                  <input value={(form as any)[k]} onChange={e => set(k, e.target.value)} className={inp} /></div>
              ))}
              <div className="col-span-3 flex flex-col gap-1"><label className="text-xs text-gray-500">Calle / Dirección</label>
                <input value={form.calle} onChange={e => set("calle", e.target.value)} className={inp} /></div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">📞 Teléfonos</h3>
            <div className="grid grid-cols-2 gap-4">
              {[["Teléfono fijo 1","telefono"],["Teléfono fijo 2","telefono2"],["WhatsApp 1","whatsapp1"],["WhatsApp 2","whatsapp2"]].map(([l,k]) => (
                <div key={k} className="flex flex-col gap-1"><label className="text-xs text-gray-500">{l}</label>
                  <input type="tel" value={(form as any)[k]} onChange={e => set(k, e.target.value)} className={inp} /></div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">👤 Service Owner</h3>
            <p className="text-xs text-gray-600 mb-4">Titular del servicio — quien contrata</p>
            <div className="grid grid-cols-2 gap-4">
              {[["Nombre","so_nombre"],["Apellido","so_apellido"],["Teléfono","so_telefono"],["CI","so_ci"]].map(([l,k]) => (
                <div key={k} className="flex flex-col gap-1"><label className="text-xs text-gray-500">{l}</label>
                  <input value={(form as any)[k]} onChange={e => set(k, e.target.value)} className={inp} /></div>
              ))}
              <div className="flex flex-col gap-1"><label className="text-xs text-gray-500">Fecha de nacimiento</label>
                <input type="date" value={form.so_fecha_nac} onChange={e => set("so_fecha_nac", e.target.value)} className={inp} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3">
              {[["Departamento","so_departamento"],["Localidad","so_localidad"],["Dirección","so_direccion"]].map(([l,k]) => (
                <div key={k} className="flex flex-col gap-1"><label className="text-xs text-gray-500">{l}</label>
                  <input value={(form as any)[k]} onChange={e => set(k, e.target.value)} className={inp} /></div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">🔑 Administrador / Contacto Operativo</h3>
            <p className="text-xs text-gray-600 mb-4">Opcional — persona que gestiona en nombre del Service Owner</p>
            <div className="grid grid-cols-2 gap-4">
              {[["Nombre","admin_nombre"],["Apellido","admin_apellido"],["Teléfono","admin_telefono"],["Email","admin_email"],["CI","admin_ci"]].map(([l,k]) => (
                <div key={k} className="flex flex-col gap-1"><label className="text-xs text-gray-500">{l}</label>
                  <input value={(form as any)[k]} onChange={e => set(k, e.target.value)} className={inp} /></div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3">
              {[["Departamento","admin_departamento"],["Localidad","admin_localidad"],["Dirección","admin_direccion"]].map(([l,k]) => (
                <div key={k} className="flex flex-col gap-1"><label className="text-xs text-gray-500">{l}</label>
                  <input value={(form as any)[k]} onChange={e => set(k, e.target.value)} className={inp} /></div>
              ))}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-6 py-4 flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50">Cancelar</button>
          <button onClick={handleGuardar} disabled={loading} className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors disabled:opacity-50">
            {loading ? "Guardando..." : "✅ Guardar cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [showNuevo, setShowNuevo] = useState(false);

  async function cargarClientes() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("clientes").select("*").order("nombre");
    if (data) setClientes(data);
    setLoading(false);
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/"); return; }
      setUserName(user.user_metadata?.full_name ?? user.email ?? "");
    });
    cargarClientes();
  }, [router]);

  const filtered = clientes.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "Todos" || c.estado === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {showNuevo && <NuevoClienteModal onClose={() => setShowNuevo(false)} onCreated={cargarClientes} />}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-white text-sm transition-colors">← Volver al dashboard</button>
          <span className="text-gray-700">|</span>
          <span className="text-lg font-semibold">⚡ LabOS</span>
        </div>
        <div className="flex items-center gap-4">
          {userName && <span className="text-sm text-gray-400">👤 {userName}</span>}
          <button onClick={async () => { const s = createClient(); await s.auth.signOut(); router.push("/"); }}
            className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors">Cerrar sesión</button>
        </div>
      </header>
      <main className="px-6 py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">👥 Clientes</h1>
          <p className="text-gray-400 mt-1 text-sm">Base de datos central de clientes vinculados a servicios</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Clientes", value: clientes.length, color: "text-white" },
            { label: "Activos", value: clientes.filter(c => c.estado === "activo").length, color: "text-green-400" },
            { label: "Inactivos", value: clientes.filter(c => c.estado === "inactivo").length, color: "text-red-400" },
          ].map(m => (
            <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">{m.label}</p>
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === f ? "bg-blue-600 text-white" : "bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"}`}>{f}</button>
            ))}
          </div>
          <button onClick={() => setShowNuevo(true)} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors whitespace-nowrap">+ Nuevo cliente</button>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {loading ? <div className="text-center py-12 text-gray-500 text-sm">Cargando clientes...</div> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Cliente</th>
                  <th className="text-left px-5 py-3">Ubicación</th>
                  <th className="text-left px-5 py-3">Teléfonos</th>
                  <th className="text-left px-5 py-3">Servicios</th>
                  <th className="text-center px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const servicios = serviciosPorCliente[c.id] || [];
                  const ubicacion = [c.localidad, c.departamento].filter(Boolean).join(", ");
                  return (
                    <tr key={c.id} onClick={() => router.push(`/dashboard/clientes/${c.id}`)}
                      className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors cursor-pointer group">
                      <td className="px-5 py-4">
                        <p className="font-medium text-white group-hover:text-blue-400 transition-colors">{c.nombre}</p>
                        {c.razon_social && <p className="text-xs text-gray-500 mt-0.5">{c.razon_social}</p>}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">{ubicacion || <span className="text-gray-600">—</span>}</td>
                      <td className="px-5 py-4 text-xs space-y-0.5">
                        {c.telefono && <p className="text-gray-400">📞 {c.telefono}</p>}
                        {c.telefono2 && <p className="text-gray-400">📞 {c.telefono2}</p>}
                        {c.whatsapp1 && <p className="text-green-400">💬 {c.whatsapp1}</p>}
                        {c.whatsapp2 && <p className="text-green-400">💬 {c.whatsapp2}</p>}
                        {!c.telefono && !c.telefono2 && !c.whatsapp1 && !c.whatsapp2 && <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {servicios.length > 0 ? servicios.map((s, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-xs bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full text-gray-300">{s.icon} {s.label}</span>
                          )) : <span className="text-gray-600 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.estado === "activo" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                          {c.estado === "activo" ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && <div className="text-center py-12 text-gray-500 text-sm">No se encontraron clientes</div>}
        </div>
      </main>
    </div>
  );
}