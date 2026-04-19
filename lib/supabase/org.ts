import { createClient } from "@/lib/supabase";

let cachedOrgId: string | null = null;

export async function getOrgId(): Promise<string> {
  if (cachedOrgId) return cachedOrgId;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("miembros")
    .select("org_id")
    .single();

  if (error || !data?.org_id) throw new Error("No se pudo obtener el org_id");

  cachedOrgId = data.org_id;
  return cachedOrgId;
}

export function clearOrgIdCache() {
  cachedOrgId = null;
}