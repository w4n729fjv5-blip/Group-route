// Tiny localStorage-backed persistence layer. The whole app runs locally in the
// browser with no backend — data lives on this device under these keys.

const PREFIX = "linen.";

/** Read and parse a JSON value, returning `fallback` if missing or corrupt. */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Serialize and store a JSON value. */
export function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

/** Generate a unique id (falls back to a random string on older browsers). */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
