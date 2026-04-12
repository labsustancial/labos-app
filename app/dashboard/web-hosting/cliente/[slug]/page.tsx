"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";

interface StackData {
  proveedor: string;
  responsable: string;
  precio?: string;
  pago?: string;
  gestion?: string;
  vencimiento?: string;
  alta?: string; // 👈 AGREGAR ESTA LÍNEA
  notas?: string;
}

interface Cliente {
  id: string; name: string; plan: string;
  inicio: string | null; vence: string | null;
  hosting: StackData; dominio: StackData;
  contacto?: string; email?: string; telefono?: string; web?: string; nota?: string;
}

const clientesData: Cliente[] = [
  { id: "centro-motos-uruguay", name: "Centro Motos Uruguay", plan: "Anual Starter", inicio: "2025-03-10", vence: "2026-03-10", hosting: { proveedor: "Siteground", responsable: "Sustancial" }, dominio: { proveedor: "Gestión del Cliente", responsable: "Cliente", notas: "Cliente gestiona su DNS" }, nota: "⚠️ Renovar a Bi-Anual" },
  { id: "franca-comics", name: "Franca Comics", plan: "Anual Starter", inicio: "2025-05-18", vence: "2026-05-18", hosting: { proveedor: "Siteground", responsable: "Sustancial" }, dominio: { proveedor: "Hosting Montevideo", responsable: "Sustancial" }, nota: "⚠️ Renovar a Bi-Anual" },
  { id: "finrel", name: "Finrel", plan: "Hosting Bi-Anual", inicio: "2024-06-27", vence: "2026-06-27", hosting: { proveedor: "Siteground", responsable: "Sustancial" }, dominio: { proveedor: "Hosting Montevideo", responsable: "Sustancial" } },
  { id: "vistalsur", name: "Vistalsur", plan: "Hosting Bi-Anual", inicio: "2024-07-06", vence: "2026-07-06", hosting: { proveedor: "Siteground", responsable: "Sustancial" }, dominio: { proveedor: "Siteground", responsable: "Sustancial" } },
  { id: "espacio-chamanga", name: "Espacio Chamangá", plan: "Hosting Bi-Anual", inicio: "2025-05-02", vence: "2027-05-02", hosting: { proveedor: "Siteground", responsable: "Sustancial" }, dominio: { proveedor: "Hosting Montevideo", responsable: "Sustancial" } },
  { id: "jt-de-leon", name: "JT de León", plan: "Hosting Bi-Anual", inicio: "2025-11-05", vence: "2027-11-05", hosting: { proveedor: "Siteground", responsable: "Sustancial" }, dominio: { proveedor: "Gestión del Cliente", responsable: "Cliente" } },
  { id: "pastas-florida", name: "Pastas Florida", plan: "Hosting Bi-Anual", inicio: "2025-08-06", vence: "2027-08-06", hosting: { proveedor: "Siteground", responsable: "Sustancial" }, dominio: { proveedor: "Hosting Montevideo", responsable: "Sustancial" } },
];

const today = new Date();

function calcProgress(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const s = new Date(start + "T12:00:00").getTime();
  const e = new Date(end + "T12:00:00").getTime();
  return Math.max(Math.round(((today.getTime() - s) / (e - s)) * 100), 0);
}

function daysLabel(end: string | null) {
  if (!end) return null;
  const diff = Math.round((new Date(end + "T12:00:00").getTime() - today.getTime()) / 86400000);
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

function RenovarModal({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  const todayStr = today.toISOString().split("T")[0];
  const defaultInicio = cliente.vence && new Date(cliente.vence) > today ? cliente.vence : todayStr;
  const [plan, setPlan] = useState<"anual" | "bianual">("bianual");
  const [inicio, setInicio] = useState(defaultInicio);
  const yaVencio = cliente.vence && new Date(cliente.vence) < today;
  const calcVence = (ini: string, tipo: "anual" | "bianual") => {
    const d = new Date(ini + "T12:00:00"); d.setFullYear(d.getFullYear() + (tipo === "anual" ? 1 : 2));
    return d.toISOString().split("T")[0];
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-white mb-1">🔄 Renovar plan</h2>
        <p className="text-sm text-gray-400 mb-5">{cliente.name}</p>
        {yaVencio && <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-4 py-3 mb-5 text-sm text-red-300">⚠️ El servicio venció el {formatDate(cliente.vence)}. La fecha de inicio es hoy por defecto.</div>}
        <div className="space-y-3 mb-5">
          {(["anual", "bianual"] as const).map((tipo) => (
            <button key={tipo} onClick={() => setPlan(tipo)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${plan === tipo ? "border-blue-500 bg-blue-500/10" : "border-gray-700 bg-gray-800 hover:border-gray-600"}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{tipo === "anual" ? "Anual Starter" : "Hosting Bi-Anual"}</span>
                {tipo === "bianual" && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Recomendado</span>}
              </div>
              <div className="text-xs text-gray-400 mt-1">Inicio: {formatDate(inicio)} → Vence: {formatDate(calcVence(inicio, tipo))}</div>
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

export default function ClientePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [showRenovar, setShowRenovar] = useState(false);
  const [notifs, setNotifs] = useState(defaultNotifs);
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
        <button onClick={() => router.push("/dashboard/web-hosting")} className="text-blue-400 text-sm">← Volver</button>
      </div>
    </div>
  );

  const pct = calcProgress(cliente.inicio, cliente.vence);
  const days = daysLabel(cliente.vence);
  const estado = getEstado(pct);

  const updateHosting = (patch: Partial<StackData>) => setCliente(p => p ? { ...p, hosting: { ...p.hosting, ...patch } } : p);
  const updateDominio = (patch: Partial<StackData>) => setCliente(p => p ? { ...p, dominio: { ...p.dominio, ...patch } } : p);
  const updateNotif = (key: string, patch: Partial<NotifState>) => setNotifs(p => ({ ...p, [key]: { ...p[key], ...patch } }));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {showRenovar && <RenovarModal cliente={cliente} onClose={() => setShowRenovar(false)} />}

      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/web-hosting")} className="text-gray-400 hover:text-white text-sm transition-colors">← Volver a Web/Hosting</button>
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

        {/* Hero 2/3 + 1/3 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white truncate">🌐 {cliente.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-400">{cliente.plan}</span>
                  <span className="text-gray-600">·</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estado.cls}`}>{estado.label}</span>
                  {days && <span className={`text-xs ${days.color}`}>· {days.text}</span>}
                  {cliente.nota && <span className="text-xs text-red-400">· {cliente.nota}</span>}
                </div>
              </div>
              <CircleProgress pct={pct} />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: "Fecha inicio", value: formatDate(cliente.inicio) },
                { label: "Vencimiento", value: formatDate(cliente.vence), sub: days },
                { label: "Plan actual", value: cliente.plan },
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
            <button onClick={() => setShowRenovar(true)} className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg border border-blue-700 bg-blue-600/20 text-sm text-blue-300 hover:bg-blue-600/30 transition-colors text-left">
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

        {/* Stack horizontal */}
        <Section title="🔧 Stack (Proveedores)">
  <div className="grid grid-cols-2 gap-4">
    {[
      { label: "Hosting", data: cliente.hosting, update: updateHosting },
      { label: "Dominio", data: cliente.dominio, update: updateDominio },
    ].map(({ label, data, update }) => {
      const proveedores = [
        { nombre: "Siteground", panel: "https://my.siteground.com" },
        { nombre: "NetUy", panel: "https://panel.netuy.com" },
        { nombre: "Hosting Montevideo", panel: "https://panel.hostingmontevideo.com" },
        { nombre: "Dominios Antel", panel: "https://nic.antel.com.uy" },
        { nombre: "Gestión del Cliente", panel: "" },
      ];

      const panelUrl =
        proveedores.find((p) => p.nombre === data.proveedor)?.panel || "";

      return (
        <div key={label} className="rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gray-800 px-4 py-2">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              {label}
            </span>
          </div>

          <div className="px-4 py-4 space-y-4">


{/* NIVEL 1 */}
<div className="grid grid-cols-2 gap-4">

  {/* PROVEEDOR */}
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-gray-500">Proveedor</span>
    <span className="text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded px-2 py-1">
      {data.proveedor || "—"}
    </span>
  </div>

  {/* PANEL */}
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-gray-500">Panel</span>
    {panelUrl ? (
      <a
        href={panelUrl}
        target="_blank"
        className="text-sm text-blue-400 border border-blue-700/40 rounded px-2 py-1 text-center"
      >
        🔗 Ir al panel
      </a>
    ) : (
      <span className="text-xs text-gray-600 italic">Sin panel</span>
    )}
  </div>

  {/* FECHA DE ALTA PROVEEDOR */}
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-gray-500">Alta proveedor</span>
    <span className="text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded px-2 py-1">
      {data.alta || "—"}
    </span>
  </div>

  {/* VENCIMIENTO PROVEEDOR */}
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-gray-500">Vencimiento proveedor</span>
    <span className="text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded px-2 py-1">
      {data.vencimiento || "—"}
    </span>
  </div>

</div>

{/* NIVEL 2 */}
<div className="grid grid-cols-2 gap-4">

  {/* ÚLTIMO PRECIO (BLOQUEADO) */}
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-gray-500">Último precio</span>
    <span className="text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded px-2 py-1">
      {data.precio || "—"}
    </span>
  </div>

  {/* FORMA DE PAGO (BLOQUEADO) */}
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-gray-500">Forma de pago</span>
    <span className="text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded px-2 py-1 flex items-center gap-2">
      <span>💳</span>
      <span>{data.pago || "Tarjeta de débito"}</span>
    </span>
  </div>

</div>

            {/* NIVEL 3 */}
            <div className="flex flex-col gap-0.5">
  <span className="text-xs text-gray-500">Quién gestionó</span>
  <span className="text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded px-2 py-1">
    {data.gestion || "Martin Aspitia"}
  </span>
</div>

            {data.notas && (
              <div>
                <p className="text-xs text-gray-500">📝 {data.notas}</p>
              </div>
            )}

          </div>
        </div>
      );
    })}
  </div>
</Section>

        {/* Info cliente — bloqueada */}
        <Section title="👤 Información del cliente">
          <p className="text-xs text-gray-600 mb-4 italic">🔒 Estos datos se gestionan desde el módulo de Clientes</p>
          <div className="grid grid-cols-2 gap-4">
            <EditableField label="Contacto" value={cliente.contacto || ""} onChange={() => {}} locked />
            <EditableField label="Email" value={cliente.email || ""} onChange={() => {}} locked />
            <EditableField label="Teléfono" value={cliente.telefono || ""} onChange={() => {}} locked />
            <EditableField label="Sitio web" value={cliente.web || ""} onChange={() => {}} locked />
          </div>
        </Section>

        {/* Comunicaciones automáticas con toggles */}
        <Section title="📬 Comunicaciones automáticas">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <EditableField label="Email del cliente" value="" onChange={() => {}} />
            <EditableField label="WhatsApp del cliente" value="" onChange={() => {}} />
          </div>
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
                        ? <span title="Enviado" className="text-green-400">✅</span>
                        : <span title="Programado" className="text-gray-400">🕐</span>}
                    </div>
                    <div className="flex justify-center">
                      <button className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">Editar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button className="mt-3 px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-300 hover:text-white transition-colors">
            ⚙️ Configurar plantillas globales
          </button>
        </Section>

        {/* Documentos */}
        <Section title="📁 Documentos">
          <div className="space-y-3">
            {[{ label: "Carpeta Drive", tipo: "link" }, { label: "Contrato", tipo: "archivo" }, { label: "Última factura", tipo: "archivo" }].map(({ label, tipo }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <span className="text-sm text-gray-400">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Sin {tipo === "link" ? "link" : "archivo"}</span>
                  <button className="text-xs px-3 py-1 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
                    {tipo === "link" ? "🔗 Agregar link" : "⬆️ Subir"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Tickets */}
        <Section title="🎫 Tickets internos">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Sin tickets registrados aún.</p>
            <button className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:text-white hover:border-gray-500 transition-colors">+ Abrir ticket</button>
          </div>
        </Section>

        {/* Historial */}
        <Section title="📋 Historial del servicio">
          <div className="space-y-3">
            {[
              { fecha: today.toLocaleDateString("es-UY"), texto: "Revisión de estado", tipo: "automático" },
              ...(cliente.vence && new Date(cliente.vence) < today ? [{ fecha: formatDate(cliente.vence), texto: "Servicio vencido", tipo: "automático" }] : []),
              ...(cliente.inicio ? [{ fecha: formatDate(cliente.inicio), texto: "Alta del servicio", tipo: "automático" }] : []),
            ].map((h, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="text-gray-600 w-28 flex-shrink-0">{h.fecha}</span>
                <span className="text-gray-300">{h.texto}</span>
                <span className="text-gray-600 ml-auto text-xs">({h.tipo})</span>
              </div>
            ))}
          </div>
          <button className="mt-4 text-xs px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:text-white hover:border-gray-500 transition-colors">+ Agregar nota manual</button>
        </Section>

      </main>
    </div>
  );
}