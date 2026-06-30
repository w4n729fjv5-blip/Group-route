import { requireSupabase } from "../lib/supabase";
import type { SavedAddress } from "../types";

// CRUD helpers for the reusable address book used to auto-fill stop addresses.
// No auth: all reads/writes go through the public anon role.

const ADDRESSES = "saved_addresses";

/** Fetch all saved addresses ordered for display. */
export async function listSavedAddresses(): Promise<SavedAddress[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(ADDRESSES)
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SavedAddress[];
}

/** Create a saved address at the end of the list and return it. */
export async function createSavedAddress(
  fields: Pick<SavedAddress, "label" | "address" | "notes">,
  position: number
): Promise<SavedAddress> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(ADDRESSES)
    .insert({ ...fields, position })
    .select("*")
    .single();
  if (error) throw error;
  return data as SavedAddress;
}

/** Update mutable fields on a saved address. */
export async function updateSavedAddress(
  id: string,
  patch: Partial<Pick<SavedAddress, "label" | "address" | "notes" | "position">>
): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from(ADDRESSES).update(patch).eq("id", id);
  if (error) throw error;
}

/** Delete a saved address from the book. */
export async function deleteSavedAddress(id: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from(ADDRESSES).delete().eq("id", id);
  if (error) throw error;
}
