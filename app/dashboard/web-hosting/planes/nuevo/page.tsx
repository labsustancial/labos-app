"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function NuevoPlanPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [duracion, setDuracion] = useState("");
  const [tipo, setTipo] = useState("Base");
  const [descripcion, setDescripcion] = useState("");
  const [precioUsd, setPrecioUsd] = useState("");
  const [sitios, setSitios] = useState(1);
  const [dominios, setDominios] = useState(1);
  const [emails, setEmails] = useState(1);
  const [storage, setStorage] = useState("Ilimitado");
  const [wordpress, setWordpress] = useState(true);

  function generarId(nombre: string) {
    return nombre.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim().replace(/\s+/g, "-");
  }

  async function handleGuardar() {
    if (!nombre.trim()) { setError("El nombre del plan es obligatorio"); return; }
    if (!duracion.trim()) { setError("La duración es obligatoria"); return; }

    const duracionDias = parseInt(duracion);
    if (isNaN(duracionDias) || duracionDias <= 0) { setError("Ingresá la duración en días (número)"); return; }

    setSaving(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: err } = await supabase.from("planes").insert({
        id: generarId(nombre),
        nombre: nombre.trim(),
        modulo: "web-hosting",
        duracion_dias: duracionDias,
        tipo,
        descripcion: descripcion || null,
        precio_usd: precioUsd ? parseFloat(precioUsd) : null,
        sitios,
        dominios,
        emails,
        storage,
        wordpress,
        moneda_base: "USD",
        activo: true,
      });
      if (err) throw err;
      router.push("/dashboard/web-hosting/planes");
    } catch (e: any) {
      setError(e.message || "Error al guardar el plan");
    } finally {
      setSaving(false);
    }
  }

  const inp = "bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors w-full";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push("/dashboard/web-hosting/planes")}
          className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Volver
        </button>
        <span className="text-gray-600">|</span>
        <span className="text-lg font-semibold">⚡ LabOS</span>
      </header>

      <main className="px-6 py-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">+ Nuevo plan</h1>
          <p className="text-gray-400 text-sm mt-1">Web / Hosting</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-700/40 rounded-lg px-4 py-3 text-sm text-red-300">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-6">

          {/* INFO BÁSICA */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Información básica</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Nombre del plan *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Hosting Tri-Anual" className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5">Duración (días) *</label>
                  <input type="number" value={duracion} onChange={e => setDuracion(e.target.value)}
                    placeholder="Ej: 365" className={inp} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5">Tipo</label>
                  <select value={tipo} onChange={e => setTipo(e.target.value)}
                    className={`${inp} cursor-pointer`}>
                    <option value="Base">Base</option>
                    <option value="Renovación">Renovación</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Descripción</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                  rows={2} placeholder="Describí el plan brevemente..."
                  className={`${inp} resize-none`} />
              </div>
            </div>
          </div>

          {/* PRECIO */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">💰 Precio</h2>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Precio en USD (dejá vacío si el plan es gratuito)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">USD</span>
                <input type="number" value={precioUsd} onChange={e => setPrecioUsd(e.target.value)}
                  placeholder="Ej: 550"
                  className={`${inp} pl-14`} />
              </div>
            </div>
          </div>

          {/* RECURSOS */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">📦 Recursos incluidos</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Sitios</label>
                <input type="number" value={sitios} onChange={e => setSitios(Number(e.target.value))} className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Dominios</label>
                <input type="number" value={dominios} onChange={e => setDominios(Number(e.target.value))} className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Emails</label>
                <input type="number" value={emails} onChange={e => setEmails(Number(e.target.value))} className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Storage</label>
                <input value={storage} onChange={e => setStorage(e.target.value)} className={inp} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button onClick={() => setWordpress(!wordpress)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${wordpress ? "bg-blue-600" : "bg-gray-700"}`}>
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${wordpress ? "translate-x-4" : "translate-x-1"}`} />
              </button>
              <span className="text-sm text-gray-300">WordPress incluido</span>
            </div>
          </div>

          {/* ACCIONES */}
          <div className="flex gap-3">
            <button onClick={() => router.push("/dashboard/web-hosting/planes")} disabled={saving}
              className="flex-1 py-3 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={saving}
              className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors disabled:opacity-50">
              {saving ? "Guardando..." : "✅ Crear plan"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}