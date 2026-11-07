import { apiUrl } from "./apiBase";
import { getAccessToken } from "../supabase/client";

export type IndiaCity = { name: string; state: string; region: string; languages?: string[] };
export type MovePlanInput = {
  title: string;
  move_type: "within_india" | "returning_to_india" | "relocating_to_india";
  origin_city?: string | null;
  origin_country?: string | null;
  destination_city: string;
  move_date?: string | null;
  household_size: number;
  services: ("packers_movers" | "local_transport" | "storage" | "international_shipping")[];
  notes?: string | null;
};
export type SavedMovePlan = MovePlanInput & { id: string; user_id?: string; created_at?: string; updated_at?: string };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error("Sign in to sync your move details to your account.");
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body.detail === "string") message = body.detail;
    } catch { /* Keep the HTTP fallback message. */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function listIndiaMovePlans(): Promise<SavedMovePlan[]> {
  const result = await request<{ move_plans: SavedMovePlan[] }>("/india/move-plans");
  return result.move_plans;
}

export function createIndiaMovePlan(input: MovePlanInput): Promise<SavedMovePlan> {
  return request<SavedMovePlan>("/india/move-plans", { method: "POST", body: JSON.stringify(input) });
}

export function updateIndiaMovePlan(id: string, input: Partial<MovePlanInput>): Promise<SavedMovePlan> {
  return request<SavedMovePlan>(`/india/move-plans/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function listIndiaCities(): Promise<IndiaCity[]> {
  const response = await fetch(apiUrl("/india/cities"), { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load the city directory.");
  const result = await response.json() as { cities: IndiaCity[] };
  return result.cities;
}
