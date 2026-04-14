"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface Plan {
  id: string;
  nombre: string;
  modulo: string;
  duracion_dias: number;
  tipo: string;
  sitios?: number;
  dominios?: number;
  emails?: number;
  storage?: string;
  wordpress?: boolean;
  descripcion?: string;
  precio_usd?: number;
  activo: boolean;
}

// ─── Modal de confirmación eliminar ──────────────────────────────────────────

function ConfirmModal({ plan, onConfirm, onCancel }: {
  plan: Plan; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-white mb-2">⚠️ Eliminar plan</h2>
        <p className="text-sm text-gray-400 mb-5">
          ¿Estás seguro que querés eliminar el plan{" "}
          <span className="text-white font-medium">{plan.nombre}</span>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium text-white transition-colors">
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tarjeta de plan ──────────────────────────────────────────────────────────

function PlanCard({ plan, editando, tcUSD, tcLoading, onEditar, onCancelar, onGuardar, onEliminar }: {
  plan: Plan;
  editando: boolean;
  tcUSD: number | null;
  tcLoading: boolean;
  onEditar: () => void;
  onCancelar: () => void;
  onGuardar: (patch: Partial<Plan>) => void;
  onEliminar: () => void;
}) {
  const [local, setLocal] = useState<Plan>({ ...plan });
  useEffect(() => { setLocal({ ...plan }); }, [plan]);

  function set(k: keyof Plan, v: any) { setLocal(p => ({ ...p, [k]: v })); }

  function formatUYU(usd: number) {
    if (!tcUSD) return "—";
    return new Intl.NumberFormat("es-UY", {
      style: "currency", currency: "UYU",
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(usd * tcUSD);
  }

  const fieldCls = "bg-gray-800 border border-blue-500/60 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors";

  return (
    <div className={`bg-gray-900 rounded-xl p-6 border transition-all duration-200 ${editando ? "border-blue-500/50 shadow-lg shadow-blue-500/5" : "border-gray-800"}`}>

      {/* HEADER */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0 mr-3">
          {editando
            ? <input value={local.nombre} onChange={e => set("nombre", e.target.value)}
                className={`${fieldCls} text-lg font-semibold w-full`} />
            : <h2 className="text-lg font-semibold text-white">{plan.nombre}</h2>
          }
          <p className="text-gray-400 text-sm mt-1">{plan.duracion_dias} días</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-300">{plan.tipo}</span>
          {!editando ? (
            <button onClick={onEditar}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white transition-colors">
              ✏️ Editar
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button onClick={onCancelar}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-600 text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={() => onGuardar(local)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                ✅ Guardar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AVISO MODO EDICIÓN */}
      {editando && (
        <div className="mb-3 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
          <p className="text-xs text-blue-300">✏️ Modo edición — modificá los campos y guardá</p>
          <button onClick={onCancelar} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ✕ Cancelar
          </button>
        </div>
      )}

      {/* PRECIO */}
      <div className={`mb-4 p-3 rounded-lg ${editando ? "bg-gray-800 border border-blue-500/30" : "bg-gray-800"}`}>
        {plan.precio_usd != null ? (
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">USD</span>
              {editando
                ? <input type="number" value={local.precio_usd ?? ""}
                    onChange={e => set("precio_usd", parseFloat(e.target.value))}
                    className={`${fieldCls} text-2xl font-bold w-28`} />
                : <span className="text-2xl font-bold text-white">{plan.precio_usd.toLocaleString()}</span>
              }
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-green-400">
                {tcLoading ? "..." : formatUYU(editando ? (local.precio_usd ?? 0) : plan.precio_usd)}
              </p>
              <p className="text-xs text-gray-500">al día de hoy</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-amber-400 font-medium">Sin precio</span>
            <span className="text-xs text-gray-500">— Se regala con Desarrollo Web</span>
          </div>
        )}
      </div>

      {/* DESCRIPCIÓN */}
      {editando
        ? <textarea value={local.descripcion ?? ""} rows={2}
            onChange={e => set("descripcion", e.target.value)}
            placeholder="Descripción del plan..."
            className={`${fieldCls} w-full resize-none mb-4`} />
        : plan.descripcion && <p className="text-sm text-gray-400 mb-4">{plan.descripcion}</p>
      }

      {/* FEATURES */}
      <div className={`space-y-2 border-t pt-4 transition-colors ${editando ? "border-blue-500/20" : "border-gray-800"}`}>
        {([
          { label: "Sitios", key: "sitios" },
          { label: "Dominios", key: "dominios" },
          { label: "Emails", key: "emails" },
        ] as { label: string; key: keyof Plan }[]).map(({ label, key }) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">{label}</span>
            {editando
              ? <input type="number" value={local[key] as number ?? ""}
                  onChange={e => set(key, parseInt(e.target.value))}
                  className={`${fieldCls} w-24 text-right`} />
              : <span className="text-sm text-gray-200">{plan[key] as number ?? "—"}</span>
            }
          </div>
        ))}

        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">Storage</span>
          {editando
            ? <input value={local.storage ?? ""} onChange={e => set("storage", e.target.value)}
                className={`${fieldCls} w-32 text-right`} />
            : <span className="text-sm text-gray-200">{plan.storage ?? "—"}</span>
          }
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">WordPress</span>
          <button
            onClick={() => editando && set("wordpress", !local.wordpress)}
            className={`text-sm font-medium transition-colors ${
              (editando ? local.wordpress : plan.wordpress) ? "text-green-400" : "text-gray-500"
            } ${editando ? "hover:opacity-80 cursor-pointer" : "cursor-default"}`}>
            {(editando ? local.wordpress : plan.wordpress) ? "✅ Incluido" : "No incluido"}
          </button>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className={`flex justify-between items-center mt-4 pt-3 border-t transition-colors ${editando ? "border-blue-500/20" : "border-gray-800"}`}>
        <button onClick={onEliminar}
          className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-800/30 transition-colors">
          🗑 Eliminar plan
        </button>
        {editando && (
          <div className="flex gap-2">
            <button onClick={onCancelar}
              className="px-4 py-1.5 text-xs border border-gray-600 text-gray-400 hover:text-white rounded-lg transition-colors">
              Cancelar
            </button>
            <button onClick={() => onGuardar(local)}
              className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              ✅ Guardar cambios
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function PlanesPage() {
  const router = useRouter();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [tcUSD, setTcUSD] = useState<number | null>(null);
  const [tcLoading, setTcLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Plan | null>(null);

  useEffect(() => {
    cargarPlanes();
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then(r => r.json())
      .then(data => { setTcUSD(data.rates?.UYU ?? 40.33); setTcLoading(false); })
      .catch(() => { setTcUSD(40.33); setTcLoading(false); });
  }, []);

  async function cargarPlanes() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("planes")
      .select("*").eq("modulo", "web-hosting").eq("activo", true).order("duracion_dias");
    if (data) setPlanes(data);
    setLoading(false);
  }

  async function guardar(id: string, patch: Partial<Plan>) {
    const supabase = createClient();
    const { error } = await supabase.from("planes").update(patch).eq("id", id);
    if (!error) {
      setPlanes(p => p.map(plan => plan.id === id ? { ...plan, ...patch } : plan));
      setEditandoId(null);
      setGuardado(id);
      setTimeout(() => setGuardado(null), 2500);
    }
  }

  async function eliminar(plan: Plan) {
    const supabase = createClient();
    await supabase.from("planes").update({ activo: false }).eq("id", plan.id);
    setPlanes(p => p.filter(pl => pl.id !== plan.id));
    setConfirmDelete(null);
  }

  function cancelarEdicion() {
    setEditandoId(null);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {confirmDelete && (
        <ConfirmModal
          plan={confirmDelete}
          onConfirm={() => eliminar(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/web-hosting")}
            className="text-gray-400 hover:text-white text-sm transition-colors">← Volver</button>
          <span className="text-gray-600">|</span>
          <span className="text-lg font-semibold">⚡ LabOS</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className={`w-1.5 h-1.5 rounded-full ${tcLoading ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
          {tcLoading ? "Obteniendo TC..." : `USD 1 = $ ${tcUSD?.toFixed(2)} UYU`}
        </div>
      </header>

      <main className="px-6 py-8 max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🌐 Planes — Web / Hosting</h1>
            <p className="text-gray-400 text-sm mt-1">
              Hacé clic en <span className="text-gray-300 font-medium">✏️ Editar</span> para modificar un plan
            </p>
          </div>
          <button onClick={() => router.push("/dashboard/web-hosting/planes/nuevo")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
            + Nuevo plan
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 text-sm">Cargando planes...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {planes.map(plan => (
              <div key={plan.id} className="relative">
                {guardado === plan.id && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow-lg">
                    ✅ Guardado correctamente
                  </div>
                )}
                <PlanCard
                  plan={plan}
                  editando={editandoId === plan.id}
                  tcUSD={tcUSD}
                  tcLoading={tcLoading}
                  onEditar={() => setEditandoId(plan.id)}
                  onCancelar={cancelarEdicion}
                  onGuardar={(patch) => guardar(plan.id, patch)}
                  onEliminar={() => setConfirmDelete(plan)}
                />
              </div>
            ))}
          </div>
        )}

        {!tcLoading && tcUSD && (
          <p className="text-center text-xs text-gray-600 mt-8">
            TC en tiempo real · USD 1 = $ {tcUSD.toFixed(2)} UYU · Precio base siempre en USD
          </p>
        )}
      </main>
    </div>
  );
}