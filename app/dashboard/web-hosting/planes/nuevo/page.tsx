"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NuevoPlanPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [type, setType] = useState("");

  const [sites, setSites] = useState(1);
  const [domains, setDomains] = useState(1);
  const [emails, setEmails] = useState(1);
  const [storage, setStorage] = useState("Ilimitado");
  const [wordpress, setWordpress] = useState(true);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* HEADER */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard/web-hosting/planes")}
          className="text-gray-400 hover:text-white text-sm"
        >
          ← Volver
        </button>

        <span className="text-lg font-semibold">⚡ Nuevo plan</span>
      </header>

      <main className="px-6 py-8 max-w-3xl mx-auto">
        {/* FORM */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">

          {/* BASIC INFO */}
          <div>
            <h2 className="text-sm text-gray-400 mb-2">Información básica</h2>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del plan"
              className="w-full mb-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Duración (ej: 365 días)"
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm"
              />

              <input
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Tipo (Base / Renovación)"
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm"
              />
            </div>
          </div>

          {/* RESOURCES */}
          <div>
            <h2 className="text-sm text-gray-400 mb-2">Recursos incluidos</h2>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={sites}
                onChange={(e) => setSites(Number(e.target.value))}
                placeholder="Sitios"
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm"
              />

              <input
                type="number"
                value={domains}
                onChange={(e) => setDomains(Number(e.target.value))}
                placeholder="Dominios"
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm"
              />

              <input
                type="number"
                value={emails}
                onChange={(e) => setEmails(Number(e.target.value))}
                placeholder="Emails"
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm"
              />

              <input
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                placeholder="Storage"
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <label className="flex items-center gap-2 mt-3 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={wordpress}
                onChange={() => setWordpress(!wordpress)}
              />
              WordPress incluido
            </label>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.push("/dashboard/web-hosting/planes")}
              className="px-4 py-2 text-sm text-gray-400"
            >
              Cancelar
            </button>

            <button className="px-4 py-2 bg-blue-600 rounded-lg text-sm">
              Guardar plan
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}