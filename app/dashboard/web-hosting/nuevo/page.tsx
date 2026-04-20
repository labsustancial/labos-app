"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

const steps = [
  { id: 1, title: "Cliente" },
  { id: 2, title: "Plan" },
  { id: 3, title: "Confirmación" },
];

const mockPlanes = [
  "Anual Starter",
  "Hosting Bi-Anual",
];

export default function NuevoServicioPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [step, setStep] = useState(1);
  const [cliente, setCliente] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);

  const [clientes, setClientes] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 6;

  useEffect(() => {
    const fetchClientes = async () => {
      const { data } = await supabase.from("clientes").select("*");
      if (data) setClientes(data);
    };

    fetchClientes();
  }, []);

  const filteredClientes = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedClientes = filteredClientes.slice(
    page * pageSize,
    (page + 1) * pageSize
  );

  const totalPages = Math.ceil(filteredClientes.length / pageSize);

  const canNext =
    (step === 1 && cliente) ||
    (step === 2 && plan) ||
    step === 3;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* HEADER */}
      <header className="relative border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard/web-hosting")}
          className="text-gray-400 hover:text-white text-sm"
        >
          ← Volver
        </button>

        <span className="text-gray-600">|</span>
        <span className="text-lg font-semibold">⚡ LabOS</span>

        <button
          onClick={() => router.push("/dashboard/web-hosting")}
          className="absolute right-6 top-4 text-gray-400 hover:text-white text-lg"
        >
          ✕
        </button>
      </header>

      <main className="px-6 py-8 max-w-3xl mx-auto">

        {/* TITULO */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">+ Nuevo servicio</h1>
          <p className="text-gray-400 text-sm mt-1">
            Asistente para crear un servicio
          </p>
        </div>

        {/* STEPS */}
        <div className="flex items-center gap-4 mb-8">
          {steps.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium
                ${step === s.id ? "bg-blue-600" : "bg-gray-800 text-gray-400"}`}
              >
                {s.id}
              </div>
              <span
                className={`text-sm ${
                  step === s.id ? "text-white" : "text-gray-500"
                }`}
              >
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* CONTENIDO */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Seleccionar cliente
              </h3>

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Buscar cliente..."
                className="w-full mb-4 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm"
              />

              <div className="space-y-2">
                {paginatedClientes.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setCliente(c.nombre)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors
                      ${
                        cliente === c.nombre
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-700 bg-gray-800 hover:border-blue-500"
                      }`}
                  >
                    {c.nombre}
                  </div>
                ))}
              </div>

              {/* PAGINADOR */}
              <div className="flex justify-between items-center mt-4 text-sm">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="text-gray-400 disabled:opacity-30"
                >
                  ← Anterior
                </button>

                <span className="text-gray-500">
                  Página {page + 1} de {totalPages || 1}
                </span>

                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-gray-400 disabled:opacity-30"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Seleccionar plan
              </h3>

              <div className="space-y-3">
                {mockPlanes.map((p) => (
                  <div
                    key={p}
                    onClick={() => setPlan(p)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors
                      ${
                        plan === p
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-700 bg-gray-800 hover:border-blue-500"
                      }`}
                  >
                    <p className="font-medium">{p}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Características del plan...
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Confirmación
              </h3>

              <div className="text-sm space-y-2">
                <p>
                  <span className="text-gray-400">Cliente:</span>{" "}
                  {cliente}
                </p>
                <p>
                  <span className="text-gray-400">Plan:</span>{" "}
                  {plan}
                </p>
                <p>
                  <span className="text-gray-400">Inicio:</span> —
                </p>
                <p>
                  <span className="text-gray-400">Vencimiento:</span> —
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ACCIONES */}
        <div className="flex justify-between">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white"
          >
            ← Anterior
          </button>

          {step < 3 ? (
            <button
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
              className={`px-4 py-2 rounded-lg text-sm ${
                canNext
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
              }`}
            >
              Siguiente →
            </button>
          ) : (
            <button className="px-4 py-2 bg-green-600 rounded-lg text-sm">
              Crear servicio
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
