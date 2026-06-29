import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  /** Called on every keystroke (typically debounced-saved by the parent). */
  onChange: (address: string) => void;
  /** Called when the user picks a suggestion (good time to save immediately). */
  onSelect?: (address: string) => void;
  placeholder?: string;
}

interface Suggestion {
  /** Stable id from the geocoder. */
  key: string;
  /** Full formatted address. */
  label: string;
}

/**
 * Address field with autofill suggestions. As you type it queries OpenStreetMap's
 * free Nominatim geocoder (no API key) and offers matching addresses to fill in.
 * If the lookup is unavailable it simply behaves like a normal text input.
 */
export default function AddressInput({
  value,
  onChange,
  onSelect,
  placeholder,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // When the user picks a suggestion we set this so the resulting value change
  // doesn't immediately trigger another lookup.
  const justPicked = useRef(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // Debounced geocoding lookup.
  useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    const query = value.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          "https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&q=" +
          encodeURIComponent(query);
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Geocoder error ${res.status}`);
        const data = (await res.json()) as Array<{
          place_id: number;
          display_name: string;
        }>;
        setSuggestions(
          data.map((d) => ({ key: String(d.place_id), label: d.display_name }))
        );
        setOpen(true);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          // Network/geocoder hiccup — fall back to plain text entry silently.
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [value]);

  // Close the dropdown when clicking outside the component.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(label: string) {
    justPicked.current = true;
    setOpen(false);
    setSuggestions([]);
    onChange(label);
    onSelect?.(label);
  }

  return (
    <div className="address-input" ref={boxRef}>
      <input
        type="text"
        inputMode="text"
        autoComplete="off"
        value={value}
        placeholder={placeholder ?? "Start typing an address…"}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {loading && <span className="address-loading" aria-hidden="true">…</span>}
      {open && suggestions.length > 0 && (
        <ul className="address-suggestions" role="listbox">
          {suggestions.map((s) => (
            <li key={s.key} role="option" aria-selected="false">
              <button type="button" onClick={() => pick(s.label)}>
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
