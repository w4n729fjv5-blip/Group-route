import { useMemo, useRef, useState } from "react";
import { useAddresses } from "../lib/store";

interface Props {
  value: string;
  onChange: (address: string) => void;
  /** Optional: when a saved address is chosen, also report its label/name. */
  onPickName?: (name: string) => void;
}

/**
 * An address field that autofills from the saved address book. As the user
 * types, matching saved addresses (by label or address text) appear in a
 * dropdown; tapping one fills the field. Manage the address book on the
 * Addresses screen.
 */
export default function AddressInput({ value, onChange, onPickName }: Props) {
  const addresses = useAddresses();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    const pool = addresses;
    if (!q) return pool.slice(0, 6);
    return pool
      .filter(
        (a) =>
          a.label.toLowerCase().includes(q) ||
          a.address.toLowerCase().includes(q)
      )
      // Don't suggest the address the user has already fully typed.
      .filter((a) => a.address.trim().toLowerCase() !== q)
      .slice(0, 6);
  }, [addresses, value]);

  const showList = open && matches.length > 0;

  function pick(index: number) {
    const a = matches[index];
    if (!a) return;
    onChange(a.address);
    if (onPickName && a.label) onPickName(a.label);
    setOpen(false);
  }

  return (
    <div className="autocomplete">
      <input
        type="text"
        inputMode="text"
        autoComplete="off"
        value={value}
        placeholder="123 Main St, Springfield, IL"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay so a click on a suggestion registers before we close.
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={(e) => {
          if (!showList) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(highlight);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
      />
      {showList && (
        <ul className="suggestions" role="listbox">
          {matches.map((a, i) => (
            <li key={a.id} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                className={`suggestion${i === highlight ? " active" : ""}`}
                // onMouseDown fires before the input's onBlur, so the pick wins.
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  pick(i);
                }}
              >
                <span className="suggestion-label">{a.label || a.address}</span>
                {a.label && (
                  <span className="suggestion-address">{a.address}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
