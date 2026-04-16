"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Servicio {
  id: string;
  cliente_id: string;
  plan_id: string;
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  hosting_proveedor: string | null;
  hosting_responsable: string | null;
  dominio_proveedor: string | null;
  dominio_responsable: string | null;
  dominio_principal: string | null;
  estado: string;
  nota: string | null;
  planes: { nombre: string };
  dominios_servicio: { id: string; dominio: string; tipo: string }[];
}

interface Cliente {
  id: string;
  nombre: string;
  razon_social?: string;
  email?: string;
  telefono?: string;
  whatsapp1?: string;
}

type NotifState = { emailOn: boolean; waOn: boolean; status: "scheduled" | "sent" };

const defaultNotifs: Record<string, NotifState> = {
  "90": { emailOn: true, waOn: false, status: "scheduled" },
  "60": { emailOn: true, waOn: true, status: "scheduled" },
  "30": { emailOn: true, waOn: true, status: "scheduled" },
  "15": { emailOn: true, waOn: true, status: "scheduled" },
  "0":  { emailOn: true, waOn: true, status: "scheduled" },
};

const notifRows = [
  { key: "90", label: "Aviso anticipado", dias: "90 días" },
  { key: "60", label: "Recordatorio", dias: "60 días" },
  { key: "30", label: "Recordatorio urgente", dias: "30 días" },
  { key: "15", label: "Último aviso", dias: "15 días" },
  { key: "0",  label: "Notificación de corte", dias: "Vencimiento" },
];

const paneles: Record<string, string> = {
  "Siteground": "https://my.siteground.com",
  "NetUy": "https://panel.netuy.com",
  "Hosting Montevideo": "https://panel.hostingmontevideo.com",
  "Dominios Antel": "https://nic.antel.com.uy",
};

const today = new Date();

// ─── Utilidades ───────────────────────────────────────────────────────────────

function calcProgress(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const pct = Math.round(((today.getTime() - new Date(start).getTime()) / (new Date(end).getTime() - new Date(start).getTime())) * 100);
  return Math.max(pct, 0);
}

function daysLabel(end: string | null) {
  if (!end) return null;
  const diff = Math.round((new Date(end).getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { text: `Vencido hace ${Math.abs(diff)} días`, color: "text-red-400" };
  if (diff === 0) return { text: "Vence hoy", color: "text-red-400" };
  if (diff <= 30) return { text: `Faltan ${diff} días`, color: "text-yellow-400" };
  return { text: `Faltan ${diff} días`, color: "text-gray-400" };
}

function getEstado(pct: number | null) {
  if (pct === null) return { label: "Sin fecha", cls: "bg-gray-800 text-gray-400" };
  if (pct >= 100) return { label: "Vencido", cls: "bg-red-900/40 text-red-400" };
  if (pct >= 61) return { label: "Por vencer", cls: "bg-yellow-900/40 text-yellow-400" };
  return { label: "Activo", cls: "bg-green-900/40 text-green-400" };
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Componentes ──────────────────────────────────────────────────────────────

function CircleProgress({ pct }: { pct: number | null }) {
  const r = 28; const circ = 2 * Math.PI * r;
  const displayPct = pct === null ? 0 : Math.min(pct, 100);
  const color = pct === null ? "#374151" : pct >= 100 ? "#f87171" : pct >= 61 ? "#fbbf24" : "#34d399";
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#1f2937" strokeWidth="7" />
      {displayPct > 0 && <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${(displayPct / 100) * circ} ${circ}`} strokeLinecap="round" transform="rotate(-90 36 36)" />}
      <text x="36" y="41" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
        {pct === null ? "—" : `${displayPct}%`}
      </text>
    </svg>
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

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? "bg-blue-600" : "bg-gray-700"}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-4" : "translate-x-1"}`} />
    </button>
  );
}

function RenovarModal({ servicio, onClose }: { servicio: Servicio; onClose: () => void }) {
  const todayStr = today.toISOString().split("T")[0];
  const defaultInicio = servicio.fecha_vencimiento && new Date(servicio.fecha_vencimiento) > today
    ? servicio.fecha_vencimiento : todayStr;
  const [plan, setPlan] = useState<"anual" | "bianual">("bianual");
  const [inicio, setInicio] = useState(defaultInicio);
  const yaVencio = servicio.fecha_vencimiento && new Date(servicio.fecha_vencimiento) < today;

  function calcVence(ini: string, tipo: "anual" | "bianual") {
    const d = new Date(ini + "T12:00:00");
    d.setFullYear(d.getFullYear() + (tipo === "anual" ? 1 : 2));
    return d.toISOString().split("T")[0];
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-white mb-1">🔄 Renovar plan</h2>
        <p className="text-sm text-gray-400 mb-5">{servicio.dominio_principal}</p>
        {yaVencio && (
          <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-4 py-3 mb-5 text-sm text-red-300">
            ⚠️ El servicio venció el {formatDate(servicio.fecha_vencimiento)}. La fecha de inicio es hoy por defecto.
          </div>
        )}
        <div className="space-y-3 mb-5">
          {(["anual", "bianual"] as const).map((tipo) => (
            <button key={tipo} onClick={() => setPlan(tipo)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${plan === tipo ? "border-blue-500 bg-blue-500/10" : "border-gray-700 bg-gray-800 hover:border-gray-600"}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{tipo === "anual" ? "Anual Starter" : "Hosting Bi-Anual"}</span>
                {tipo === "bianual" && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Recomendado</span>}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Inicio: {formatDate(inicio)} → Vence: {formatDate(calcVence(inicio, tipo))}
              </div>
            </button>
          ))}
        </div>
        <div className="mb-5">
          <label className="text-xs text-gray-400 block mb-1">Fecha de inicio (editable)</label>
          <input type="date" value={inicio} onChange={e => setInicio(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white transition-colors">Cancelar</button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors">✅ Confirmar renovación</button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ClientePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRenovar, setShowRenovar] = useState(false);
  const [notifs, setNotifs] = useState(defaultNotifs);
  const [nuevoDominio, setNuevoDominio] = useState("");
  const [agregandoDominio, setAgregandoDominio] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/"); return; }
      setUserName(user.user_metadata?.full_name ?? user.email ?? "");
    });

    // Cargar servicio por cliente_id
    supabase.from("servicios").select(`
      id, cliente_id, plan_id, fecha_inicio, fecha_vencimiento,
      hosting_proveedor, hosting_responsable, dominio_proveedor,
      dominio_responsable, dominio_principal, estado, nota,
      planes(nombre),
      dominios_servicio(id, dominio, tipo)
    `)
    .eq("cliente_id", slug)
    .eq("modulo", "web-hosting")
    .eq("estado", "activo")
    .single()
    .then(({ data }) => {
      if (data) setServicio(data as any);
    });

    // Cargar datos del cliente
    supabase.from("clientes").select("id, nombre, razon_social, email, telefono, whatsapp1")
      .eq("id", slug).single()
      .then(({ data }) => {
        if (data) setCliente(data);
        setLoading(false);
      });
  }, [router, slug]);

  async function agregarDominio() {
    if (!nuevoDominio.trim() || !servicio) return;
    setAgregandoDominio(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("dominios_servicio")
      .insert({ servicio_id: servicio.id, dominio: nuevoDominio.trim(), tipo: "redireccion" })
      .select().single();
    if (!error && data) {
      setServicio(p => p ? { ...p, dominios_servicio: [...p.dominios_servicio, data] } : p);
      setNuevoDominio("");
    }
    setAgregandoDominio(false);
  }

  async function eliminarDominio(id: string) {
    const supabase = createClient();
    await supabase.from("dominios_servicio").delete().eq("id", id);
    setServicio(p => p ? { ...p, dominios_servicio: p.dominios_servicio.filter(d => d.id !== id) } : p);
  }

  const updateNotif = (key: string, patch: Partial<NotifState>) =>
    setNotifs(p => ({ ...p, [key]: { ...p[key], ...patch } }));

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Cargando...</p>
    </div>
  );

  if (!servicio) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 mb-4">Servicio no encontrado</p>
        <button onClick={() => router.push("/dashboard/web-hosting")} className="text-blue-400 text-sm">← Volver</button>
      </div>
    </div>
  );

  const pct = calcProgress(servicio.fecha_inicio, servicio.fecha_vencimiento);
  const days = daysLabel(servicio.fecha_vencimiento);
  const estado = getEstado(pct);
  const panelHosting = paneles[servicio.hosting_proveedor ?? ""] ?? "";
  const panelDominio = paneles[servicio.dominio_proveedor ?? ""] ?? "";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {showRenovar && <RenovarModal servicio={servicio} onClose={() => setShowRenovar(false)} />}

      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/web-hosting")}
            className="text-gray-400 hover:text-white text-sm transition-colors">← Volver a Web/Hosting</button>
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
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* DOMINIO PRIMERO */}
                <h1 className="text-xl font-bold text-blue-400">
                  🌐 {servicio.dominio_principal ?? "Sin dominio"}
                </h1>
                {/* NOMBRE / RAZÓN SOCIAL DESPUÉS */}
                <p className="text-sm text-gray-400 mt-0.5">
                  {cliente?.razon_social || cliente?.nombre || "—"}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">{servicio.planes?.nombre}</span>
                  <span className="text-gray-600">·</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estado.cls}`}>{estado.label}</span>
                  {days && <span className={`text-xs ${days.color}`}>· {days.text}</span>}
                  {servicio.nota && <span className="text-xs text-red-400">· {servicio.nota}</span>}
                </div>
              </div>
              <CircleProgress pct={pct} />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: "Fecha inicio", value: formatDate(servicio.fecha_inicio) },
                { label: "Vencimiento", value: formatDate(servicio.fecha_vencimiento), sub: days },
                { label: "Plan actual", value: servicio.planes?.nombre ?? "—" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-white">{value}</p>
                  {sub && <p className={`text-xs mt-0.5 ${sub.color}`}>{sub.text}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Acciones rápidas</p>
            <button onClick={() => setShowRenovar(true)}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg border border-blue-700 bg-blue-600/20 text-sm text-blue-300 hover:bg-blue-600/30 transition-colors text-left">
              <span>🔄</span><span>Renovar plan</span>
            </button>
            <button className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors text-left">
              <span>🎫</span><span>Abrir ticket de soporte</span>
            </button>
            <button className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors text-left">
              <span>📄</span><span>Descargar ficha</span>
            </button>
            <button className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg border border-red-800 bg-red-900/20 text-sm text-red-400 hover:bg-red-900/30 transition-colors text-left">
              <span>⛔</span><span>Desactivar servicio</span>
            </button>
          </div>
        </div>

        {/* Dominios */}
        <Section title="🌐 Dominios del servicio">
          {/* Principal */}
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg mb-3">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Dominio principal</p>
              <p className="font-medium text-blue-400">{servicio.dominio_principal ?? "—"}</p>
            </div>
            <span className="text-xs px-2 py-1 bg-blue-600/20 text-blue-300 rounded-full border border-blue-700/30">Principal</span>
          </div>

          {/* Adicionales */}
          {servicio.dominios_servicio.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs text-gray-500 mb-2">Dominios vinculados (redirecciones)</p>
              {servicio.dominios_servicio.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <span className="text-sm text-gray-300">{d.dominio}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{d.tipo}</span>
                    <button onClick={() => eliminarDominio(d.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded border border-red-800/30 hover:border-red-700/50">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Agregar dominio */}
          <div className="flex items-center gap-2 mt-3">
            <input value={nuevoDominio} onChange={e => setNuevoDominio(e.target.value)}
              placeholder="Ej: pastasflorida.com"
              onKeyDown={e => e.key === "Enter" && agregarDominio()}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            <button onClick={agregarDominio} disabled={agregandoDominio || !nuevoDominio.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm text-white transition-colors disabled:opacity-50">
              {agregandoDominio ? "..." : "+ Agregar"}
            </button>
          </div>
        </Section>

        {/* Stack */}
        <Section title="🔧 Stack (Proveedores)">
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "Hosting",
                proveedor: servicio.hosting_proveedor,
                responsable: servicio.hosting_responsable,
                panel: panelHosting,
              },
              {
                label: "Dominio",
                proveedor: servicio.dominio_proveedor,
                responsable: servicio.dominio_responsable,
                panel: panelDominio,
              },
            ].map(({ label, proveedor, responsable, panel }) => (
              <div key={label} className="rounded-lg border border-gray-700 overflow-hidden">
                <div className="bg-gray-800 px-4 py-2">
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{label}</span>
                </div>
                <div className="px-4 py-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-gray-500">Proveedor</span>
                      <span className="text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded px-2 py-1">
                        {proveedor || "—"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-gray-500">Panel</span>
                      {panel ? (
                        <a href={panel} target="_blank"
                          className="text-sm text-blue-400 border border-blue-700/40 rounded px-2 py-1 text-center">
                          🔗 Ir al panel
                        </a>
                      ) : (
                        <span className="text-xs text-gray-600 italic px-2 py-1">Sin panel</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-500">Responsable</span>
                    <span className="text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded px-2 py-1">
                      {responsable || "Sustancial"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Info del cliente */}
        <Section title="👤 Información del cliente">
          <p className="text-xs text-gray-600 mb-4 italic">🔒 Estos datos se gestionan desde el módulo de Clientes</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Nombre", value: cliente?.nombre },
              { label: "Razón social", value: cliente?.razon_social },
              { label: "Email", value: cliente?.email },
              { label: "Teléfono", value: cliente?.telefono },
              { label: "WhatsApp", value: cliente?.whatsapp1 },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-sm text-gray-600 italic">{value || "—"}</span>
              </div>
            ))}
          </div>
          <button onClick={() => router.push(`/dashboard/clientes/${slug}`)}
            className="mt-4 text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Ver ficha completa del cliente →
          </button>
        </Section>

        {/* Comunicaciones automáticas */}
        <Section title="📬 Comunicaciones automáticas">
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-800 px-4 py-2.5 grid items-center" style={{ gridTemplateColumns: "1fr 80px 80px 60px 80px" }}>
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Aviso</span>
              <span className="text-xs text-gray-500 text-center">📧 Email</span>
              <span className="text-xs text-gray-500 text-center">💬 WA</span>
              <span className="text-xs text-gray-500 text-center">Estado</span>
              <span className="text-xs text-gray-500 text-center">Mensaje</span>
            </div>
            <div className="divide-y divide-gray-800">
              {notifRows.map(({ key, label, dias }) => {
                const n = notifs[key];
                return (
                  <div key={key} className="px-4 py-3 grid items-center gap-2" style={{ gridTemplateColumns: "1fr 80px 80px 60px 80px" }}>
                    <div>
                      <span className="text-sm text-gray-300">{label}</span>
                      <span className="ml-2 text-xs text-gray-600">({dias})</span>
                    </div>
                    <div className="flex justify-center"><Toggle enabled={n.emailOn} onChange={v => updateNotif(key, { emailOn: v })} /></div>
                    <div className="flex justify-center"><Toggle enabled={n.waOn} onChange={v => updateNotif(key, { waOn: v })} /></div>
                    <div className="flex justify-center">
                      {n.status === "sent"
                        ? <span className="text-green-400">✅</span>
                        : <span className="text-gray-400">🕐</span>}
                    </div>
                    <div className="flex justify-center">
                      <button className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">Editar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* Documentos */}
        <Section title="📁 Documentos">
          <div className="space-y-3">
            {[{ label: "Carpeta Drive", tipo: "link" }, { label: "Contrato", tipo: "archivo" }, { label: "Última factura", tipo: "archivo" }].map(({ label, tipo }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <span className="text-sm text-gray-400">{label}</span>
                <button className="text-xs px-3 py-1 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
                  {tipo === "link" ? "🔗 Agregar link" : "⬆️ Subir"}
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* Historial */}
        <Section title="📋 Historial del servicio">
          <div className="space-y-3">
            {[
              { fecha: today.toLocaleDateString("es-UY"), texto: "Revisión de estado", tipo: "automático" },
              ...(servicio.fecha_vencimiento && new Date(servicio.fecha_vencimiento) < today
                ? [{ fecha: formatDate(servicio.fecha_vencimiento), texto: "Servicio vencido", tipo: "automático" }] : []),
              ...(servicio.fecha_inicio
                ? [{ fecha: formatDate(servicio.fecha_inicio), texto: "Alta del servicio", tipo: "automático" }] : []),
            ].map((h, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="text-gray-600 w-28 flex-shrink-0">{h.fecha}</span>
                <span className="text-gray-300">{h.texto}</span>
                <span className="text-gray-600 ml-auto text-xs">({h.tipo})</span>
              </div>
            ))}
          </div>
          <button className="mt-4 text-xs px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:text-white hover:border-gray-500 transition-colors">
            + Agregar nota manual
          </button>
        </Section>

      </main>
    </div>
  );
}