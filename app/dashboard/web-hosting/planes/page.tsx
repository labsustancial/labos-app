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

export default function PlanesPage() {
  const router = useRouter();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [tcUSD, setTcUSD] = useState<number | null>(null);
  const [tcLoading, setTcLoading] = useState(true);

  // Cargar planes desde Supabase
  useEffect(() => {
    const supabase = createClient();
    supabase.from("planes")
      .select("*")
      .eq("modulo", "web-hosting")
      .eq("activo", true)
      .order("duracion_dias")
      .then(({ data }) => {
        if (data) setPlanes(data);
        setLoading(false);
      });
  }, []);

  // Tipo de cambio USD → UYU en tiempo real
  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then(r => r.json())
      .then(data => {
        setTcUSD(data.rates?.UYU ?? null);
        setTcLoading(false);
      })
      .catch(() => {
        // Fallback con valor reciente si falla la API
        setTcUSD(40.33);
        setTcLoading(false);
      });
  }, []);

  function formatUYU(usd: number) {
    if (!tcUSD) return "—";
    const uyu = usd * tcUSD;
    return new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency: "UYU",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(uyu);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* HEADER */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/web-hosting")}
            className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Volver
          </button>
          <span className="text-gray-600">|</span>
          <span className="text-lg font-semibold">⚡ LabOS</span>
        </div>

        {/* Tipo de cambio en vivo */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className={`w-1.5 h-1.5 rounded-full ${tcLoading ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
          {tcLoading ? "Obteniendo TC..." : `USD 1 = $ ${tcUSD?.toFixed(2)} UYU`}
        </div>
      </header>

      <main className="px-6 py-8 max-w-5xl mx-auto">
        {/* TITLE */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🌐 Planes — Web / Hosting</h1>
            <p className="text-gray-400 text-sm mt-1">
              Planes de hosting disponibles para venta
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/web-hosting/planes/nuevo")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
            + Nuevo plan
          </button>
        </div>

        {/* GRID */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-sm">Cargando planes...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {planes.map((plan) => (
              <div key={plan.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">

                {/* HEADER CARD */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="text-lg font-semibold">{plan.nombre}</h2>
                    <p className="text-gray-400 text-sm">{plan.duracion_dias} días</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-300">
                    {plan.tipo}
                  </span>
                </div>

                {/* PRECIO */}
                <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                  {plan.precio_usd ? (
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-bold text-white">
                          USD {plan.precio_usd.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">moneda base</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-400">
                          {tcLoading ? "..." : formatUYU(plan.precio_usd)}
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
                {plan.descripcion && (
                  <p className="text-sm text-gray-400 mb-4">{plan.descripcion}</p>
                )}

                {/* FEATURES */}
                <div className="space-y-2 text-sm border-t border-gray-800 pt-4">
                  {plan.sitios != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sitios</span>
                      <span>{plan.sitios}</span>
                    </div>
                  )}
                  {plan.dominios != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dominios</span>
                      <span>{plan.dominios}</span>
                    </div>
                  )}
                  {plan.emails != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Emails</span>
                      <span>{plan.emails}</span>
                    </div>
                  )}
                  {plan.storage && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Storage</span>
                      <span>{plan.storage}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">WordPress</span>
                    <span>{plan.wordpress ? "✅ Incluido" : "No"}</span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex justify-end mt-5 gap-2">
                  <button className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-colors">
                    ✏️ Editar
                  </button>
                  <button className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-800/30 transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TC info */}
        {!tcLoading && tcUSD && (
          <p className="text-center text-xs text-gray-600 mt-8">
            Tipo de cambio obtenido en tiempo real · USD 1 = $ {tcUSD.toFixed(2)} UYU ·
            La conversión es referencial, el precio base siempre es en USD
          </p>
        )}
      </main>
    </div>
  );
}