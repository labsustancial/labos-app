// ─── Componente ImagenPortada ─────────────────────────────────────────────────
// Reemplaza el campo "URL de imagen de portada" en EventoFormModal
// Soporta: click para abrir explorador, drag & drop, conversión a WebP
// Guarda en Supabase Storage bucket "eventos"
"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";


interface ImagenPortadaProps {
  eventoId?: string;          // Si existe → sube a Supabase Storage
  value: string;              // URL actual
  onChange: (url: string) => void;
}

async function convertirAWebP(file: File, maxW = 1920, maxH = 640): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      // Calcular dimensiones manteniendo aspecto pero limitando a 1920x640
      let w = img.width; let h = img.height;
      const ratioW = maxW / w; const ratioH = maxH / h;
      const ratio = Math.min(ratioW, ratioH, 1); // no agrandar
      w = Math.round(w * ratio); h = Math.round(h * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error("Error al convertir a WebP"));
      }, "image/webp", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Error al leer imagen")); };
    img.src = objectUrl;
  });
}

export function ImagenPortada({ eventoId, value, onChange }: ImagenPortadaProps) {
  const [estado, setEstado] = useState<"idle" | "subiendo" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function procesarArchivo(file: File) {
    // Validar tipo
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Solo se aceptan imágenes (JPG, PNG, WebP)");
      setEstado("error"); return;
    }
    // Validar tamaño (máx 10MB antes de convertir)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("La imagen no puede superar 10MB");
      setEstado("error"); return;
    }

    setEstado("subiendo"); setErrorMsg(""); setProgreso(10);

    try {
      // Convertir a WebP 1920x640
      const webpBlob = await convertirAWebP(file);
      setProgreso(50);

      // Si hay eventoId → subir a Supabase Storage
      if (eventoId) {
        const supabase = createClient();
        const path = `portadas/${eventoId}/portada.webp`;

        const { error: uploadError } = await supabase.storage
          .from("eventos")
          .upload(path, webpBlob, {
            contentType: "image/webp",
            upsert: true, // Siempre reemplaza la misma foto
          });

        if (uploadError) throw uploadError;
        setProgreso(90);

        const { data } = supabase.storage.from("eventos").getPublicUrl(path);
        // Agregar timestamp para evitar cache
        const url = `${data.publicUrl}?t=${Date.now()}`;
        onChange(url);
      } else {
        // Sin eventoId → usar URL object local para preview
        const url = URL.createObjectURL(webpBlob);
        onChange(url);
      }

      setProgreso(100);
      setEstado("idle");
    } catch (e: any) {
      setErrorMsg(e.message || "Error al subir la imagen");
      setEstado("error");
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) procesarArchivo(file);
  }, [eventoId]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleClick = () => inputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivo(file);
    e.target.value = ""; // Reset para poder subir el mismo archivo
  };

  return (
    <div className="space-y-2">
      {/* Info dimensiones */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
        <p className="text-xs text-gray-400 font-medium mb-1">📐 Dimensiones recomendadas</p>
        <p className="text-xs text-gray-500">
          <span className="text-white font-mono">1920 × 640 px</span> — Relación 3:1 · La imagen se convierte automáticamente a <span className="text-green-400">WebP</span> · máx. 10MB de entrada
        </p>
        <p className="text-xs text-gray-600 mt-1">Optimizado para pantallas hasta 24" (1920×1080). Se recorta desde el centro verticalmente.</p>
      </div>

      {/* Input oculto */}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Zona de drop */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
          ${isDragging ? "border-blue-500 bg-blue-500/10" : "border-gray-700 hover:border-gray-500 hover:bg-gray-800/30"}
          ${estado === "error" ? "border-red-500/60" : ""}`}
        style={{ minHeight: value ? 120 : 96 }}>

        {/* Preview de imagen */}
        {value && estado !== "subiendo" && (
          <div className="relative">
            <img src={value} alt="Portada" className="w-full h-32 object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <p className="text-white text-sm font-medium">🔄 Cambiar imagen</p>
            </div>
            {/* Badge WebP */}
            <span className="absolute top-2 right-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium">WebP</span>
          </div>
        )}

        {/* Estado subiendo */}
        {estado === "subiendo" && (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
              <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progreso}%` }} />
            </div>
            <p className="text-sm text-gray-400">Convirtiendo a WebP... {progreso}%</p>
          </div>
        )}

        {/* Estado idle sin imagen */}
        {!value && estado !== "subiendo" && (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <p className="text-3xl mb-2">{isDragging ? "📂" : "🖼️"}</p>
            <p className="text-sm text-gray-300 font-medium">
              {isDragging ? "Soltá la imagen acá" : "Hacé clic o arrastrá una imagen"}
            </p>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG o WebP · Se convierte automáticamente a WebP</p>
          </div>
        )}
      </div>

      {/* Error */}
      {estado === "error" && errorMsg && (
        <p className="text-xs text-red-400">⚠️ {errorMsg}</p>
      )}

      {/* También permitir URL manual */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-xs text-gray-600">o pegá una URL</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>
      <input
        value={value.startsWith("blob:") ? "" : value}
        onChange={e => onChange(e.target.value)}
        placeholder="https://mi-imagen.com/portada.jpg"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
      />
    </div>
  );
}