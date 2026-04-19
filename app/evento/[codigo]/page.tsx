// app/evento/[codigo]/page.tsx
// Archivo servidor — maneja Open Graph + renderiza el componente cliente

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase";
import EventoForm from "./EventoForm";

// ─── Open Graph dinámico ──────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ codigo: string }> }
): Promise<Metadata> {
  const { codigo } = await params;

  const supabase = createClient();
  const { data: evento } = await supabase
    .from("eventos")
    .select("titulo, descripcion, portada_url, clientes(nombre)")
    .eq("codigo", codigo)
    .single();

  if (!evento) {
    return { title: "Evento — Sustancial" };
  }

  const titulo = evento.titulo;
  const cliente = (evento.clientes as any)?.nombre;
  const descripcion = evento.descripcion ||
    `${cliente ? `${cliente} te invita a ` : ""}registrarte en ${titulo}`;
  const imagen = evento.portada_url ||
    "https://labos.sustancial.uy/og-default.jpg";

  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      images: [{ url: imagen, width: 1920, height: 640, alt: titulo }],
      type: "website",
      locale: "es_UY",
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
      images: [imagen],
    },
  };
}

// ─── Página — renderiza el componente cliente ─────────────────────────────────

export default async function EventoPage(
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params;
  return <EventoForm codigo={codigo} />;
}