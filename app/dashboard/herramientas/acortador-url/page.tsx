"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface UrlCorta {
  id: number;
  original: string;
  corta: string;
  alias: string;
  clics: number;
  creada: string;
  origenes: Record<string, number>;
}

const urlsMock: UrlCorta[] = [
  {
    id: 1,
    alias: "evento-abril",
    original: "https://www.instagram.com/sustancial.uy/p/DIGksd2382hsa92jd8?utm_source=ig_share&utm_medium=social",
    corta: "sustancial.uy/s/evento-abril",
    clics: 142,
    creada: "10/04/2026",
    origenes: { "Instagram": 89, "WhatsApp": 34, "Directo": 19 },
  },
  {
    id: 2,
    alias: "portafolio",
    original: "https://www.behance.net/sustancial-uy/portfolio-2026-identidad-visual-branding-marketing",
    corta: "sustancial.uy/s/portafolio",
    clics: 67,
    creada: "01/04/2026",
    origenes: { "LinkedIn": 41, "Email": 18, "Directo": 8 },
  },
  {
    id: 3,
    alias: "lalka-demo",
    original: "https://staging.lalka.com.uy/preview/nuevo-sitio-2026?token=xyz123abc456",
    corta: "sustancial.uy/s/lalka-demo",
    clics: 23,
    creada: "14/04/2026",
    origenes: { "WhatsApp": 20, "Email": 3 },
  },
];

function truncar(url: string, max = 55) {
  return url.length > max ? url.slice(0, max) + "..." : url;
}

export default function AcortadorUrlPage() {
  const router = useRouter();
  const [urls, setUrls] = useState<UrlCorta[]>(urlsMock);
  const [urlOriginal, setUrlOriginal] = useState("");
  const [alias, setAlias] = useState("");
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState<number | null>(null);
  const [expandida, setExpandida] = useState<number | null>(null);

  function handleAgregar() {
    if (!urlOriginal.trim()) { setError("Ingresá una URL"); return; }
    if (!urlOriginal.startsWith("http")) { setError("La URL debe comenzar con http:// o https://"); return; }

    const aliasLimpio = alias.trim()
      ? alias.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      : `link-${Date.now().toString().slice(-5)}`;

    const nueva: UrlCorta = {
      id: Date.now(),
      original: urlOriginal.trim(),
      alias: aliasLimpio,
      corta: `sustancial.uy/s/${aliasLimpio}`,
      clics: 0,
      creada: new Date().toLocaleDateString("es-UY"),
      origenes: {},
    };
    setUrls(p => [nueva, ...p]);
    setUrlOriginal(""); setAlias(""); setError("");
  }

  function copiar(id: number, texto: string) {
    navigator.clipboard.writeText(texto).catch(() => {});
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  }

  function simularClic(id: number) {
    const origenes = ["Instagram", "WhatsApp", "Directo", "Email", "LinkedIn", "TikTok"];
    const origen = origenes[Math.floor(Math.random() * origenes.length)];
    setUrls(p => p.map(u => u.id === id
      ? { ...u, clics: u.clics + 1, origenes: { ...u.origenes, [origen]: (u.origenes[origen] || 0) + 1 } }
      : u
    ));
  }

  const totalClics = urls.reduce((acc, u) => acc + u.clics, 0);

  const inp = "bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push("/dashboard/herramientas")}
          className="text-gray-400 hover:text-white text-sm transition-colors">← Volver</button>
        <span className="text-gray-600">|</span>
        <span className="text-lg font-semibold">⚡ LabOS</span>
      </header>

      <main className="px-6 py-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">🔗 Acortador de URL</h1>
          <p className="text-gray-400 text-sm mt-1">Acortá links, contá clics y conocé el origen del tráfico</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Links activos</p>
            <p className="text-2xl font-bold text-white">{urls.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Total de clics</p>
            <p className="text-2xl font-bold text-blue-400">{totalClics}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Promedio por link</p>
            <p className="text-2xl font-bold text-green-400">
              {urls.length > 0 ? Math.round(totalClics / urls.length) : 0}
            </p>
          </div>
        </div>

        {/* Formulario nuevo link */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">+ Acortar nueva URL</h3>
          {error && <p className="text-xs text-red-400 mb-3">⚠️ {error}</p>}
          <div className="flex gap-3">
            <input value={urlOriginal} onChange={e => setUrlOriginal(e.target.value)}
              placeholder="https://link-largo.com/con/muchos/parametros?utm=algo"
              onKeyDown={e => e.key === "Enter" && handleAgregar()}
              className={`flex-1 ${inp}`} />
            <input value={alias} onChange={e => setAlias(e.target.value)}
              placeholder="alias (opcional)"
              onKeyDown={e => e.key === "Enter" && handleAgregar()}
              className={`w-44 ${inp}`} />
            <button onClick={handleAgregar}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors whitespace-nowrap">
              Acortar
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            El link corto quedará como: <span className="text-gray-400">sustancial.uy/s/{alias || "tu-alias"}</span>
          </p>
        </div>

        {/* Lista de URLs */}
        <div className="space-y-3">
          {urls.map(url => (
            <div key={url.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Link corto */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-blue-400">{url.corta}</span>
                    <button onClick={() => copiar(url.id, `https://${url.corta}`)}
                      className="text-xs text-gray-500 hover:text-white transition-colors">
                      {copiado === url.id ? "✅" : "📋"}
                    </button>
                  </div>
                  {/* URL original */}
                  <p className="text-xs text-gray-500">{truncar(url.original)}</p>
                </div>

                {/* Clics */}
                <div className="text-center flex-shrink-0">
                  <p className="text-xl font-bold text-white">{url.clics}</p>
                  <p className="text-xs text-gray-500">clics</p>
                </div>

                {/* Fecha */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">{url.creada}</p>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => simularClic(url.id)}
                    title="Simular clic (demo)"
                    className="text-xs px-2.5 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
                    +1 clic
                  </button>
                  <button onClick={() => setExpandida(expandida === url.id ? null : url.id)}
                    className="text-xs px-2.5 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
                    {expandida === url.id ? "▲" : "▼"} Orígenes
                  </button>
                </div>
              </div>

              {/* Orígenes expandidos */}
              {expandida === url.id && (
                <div className="border-t border-gray-800 px-5 py-4 bg-gray-800/30">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Origen del tráfico</p>
                  {Object.keys(url.origenes).length === 0 ? (
                    <p className="text-xs text-gray-600 italic">Sin clics registrados aún</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(url.origenes)
                        .sort(([, a], [, b]) => b - a)
                        .map(([origen, count]) => {
                          const pct = Math.round((count / url.clics) * 100);
                          return (
                            <div key={origen} className="flex items-center gap-3">
                              <span className="text-sm text-gray-300 w-24 flex-shrink-0">{origen}</span>
                              <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                                <div className="bg-blue-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-400 w-16 text-right">{count} ({pct}%)</span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}