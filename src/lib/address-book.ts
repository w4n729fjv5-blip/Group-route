// A lightweight address book backed by localStorage.
//
// Every time a stop is saved with an address, we record it here. The Address
// field on the stop editor then offers those saved addresses as autocomplete
// suggestions (an HTML <datalist>), and picking a saved address auto-fills the
// customer name too. This is the "address that auto-fills" feature — no Google
// API key or geocoding needed; it learns from the addresses you actually use.

import { useSyncExternalStore } from "react";

export interface AddressEntry {
  /** Customer / location name last associated with this address. */
  name: string;
  /** The street address text. */
  address: string;
}

const STORAGE_KEY = "linen.addressbook.v1";
const MAX_ENTRIES = 300;

let cache: AddressEntry[] | null = null;
const listeners = new Set<() => void>();

function isValid(entry: unknown): entry is AddressEntry {
  return (
    typeof entry === "object" &&
    entry !== null &&
    typeof (entry as AddressEntry).address === "string" &&
    (entry as AddressEntry).address.trim().length > 0
  );
}

function load(): AddressEntry[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cache = parsed.filter(isValid).map((e) => ({
          name: typeof e.name === "string" ? e.name : "",
          address: e.address,
        }));
        return cache;
      }
    }
  } catch {
    // ignore corrupt storage
  }
  cache = [];
  return cache;
}

function commit(entries: AddressEntry[]) {
  cache = entries;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage failures
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** All saved addresses, most recently used first. */
export function getAddresses(): AddressEntry[] {
  return load();
}

/**
 * Remember an address (and the name used with it). Re-saving the same address
 * updates its name and moves it to the front. Empty addresses are ignored.
 */
export function recordAddress(name: string, address: string): void {
  const addr = address.trim();
  if (!addr) return;
  const existing = load();
  const rest = existing.filter(
    (e) => e.address.trim().toLowerCase() !== addr.toLowerCase()
  );
  const entry: AddressEntry = { name: name.trim(), address: addr };
  commit([entry, ...rest].slice(0, MAX_ENTRIES));
}

/** Find a saved entry whose address matches exactly (case-insensitive). */
export function findByAddress(address: string): AddressEntry | undefined {
  const addr = address.trim().toLowerCase();
  if (!addr) return undefined;
  return load().find((e) => e.address.trim().toLowerCase() === addr);
}

/** React hook returning the live address book. */
export function useAddressBook(): AddressEntry[] {
  return useSyncExternalStore(subscribe, getAddresses, getAddresses);
}
