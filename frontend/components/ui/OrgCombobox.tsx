"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, X, Plus } from "lucide-react";

type Option =
  | { type: "org"; name: string }
  | { type: "create"; name: string };

interface Props {
  /** All known organization names (already loaded by the page). */
  orgs: string[];
  /** Currently selected / typed organization name. */
  value: string;
  onChange: (name: string) => void;
  /** Create a new org by name, then resolve. Should throw on failure. */
  onCreate: (name: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Searchable organization picker with inline "create new" support.
 * - Type to filter existing orgs (client-side, case-insensitive)
 * - No match → offer to create the typed name as a new org
 * - Keyboard: ↑/↓ to navigate, Enter to select, Escape to close
 */
export default function OrgCombobox({ orgs, value, onChange, onCreate, placeholder, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const trimmed = value.trim();
  const exactMatch = useMemo(
    () => orgs.some((o) => o.toLowerCase() === trimmed.toLowerCase()),
    [orgs, trimmed],
  );

  const filtered = useMemo(() => {
    const q = trimmed.toLowerCase();
    return q ? orgs.filter((o) => o.toLowerCase().includes(q)) : orgs;
  }, [orgs, trimmed]);

  const options: Option[] = useMemo(() => {
    const opts: Option[] = filtered.map((name) => ({ type: "org", name }));
    if (trimmed && !exactMatch) opts.push({ type: "create", name: trimmed });
    return opts;
  }, [filtered, trimmed, exactMatch]);

  // Keep highlight in range as the option list changes.
  useEffect(() => {
    setHighlight((h) => Math.min(h, Math.max(0, options.length - 1)));
  }, [options.length]);

  // Scroll the highlighted option into view during keyboard navigation.
  useEffect(() => {
    if (open) optionRefs.current[highlight]?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  async function selectOption(opt: Option) {
    if (opt.type === "org") {
      onChange(opt.name);
      setOpen(false);
      return;
    }
    setCreating(true);
    try {
      await onCreate(opt.name);
      onChange(opt.name);
      setOpen(false);
    } catch {
      /* parent surfaces the error (toast); keep dropdown open so user can retry */
    } finally {
      setCreating(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) { setOpen(true); break; }
        setHighlight((h) => Math.min(h + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
        break;
      case "Enter":
        if (open && options[highlight]) {
          e.preventDefault();
          selectOption(options[highlight]);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  }

  const showDropdown = open && options.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          className="input w-full pr-16"
          placeholder={placeholder}
          value={value}
          disabled={disabled || creating}
          autoComplete="off"
          onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlight(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {exactMatch && !creating && <Check className="w-4 h-4 text-green-600" />}
          {value && !creating && (
            <button
              type="button"
              title="Clear"
              onClick={() => { onChange(""); setOpen(true); inputRef.current?.focus(); }}
              className="p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 max-h-[216px] overflow-y-auto">
          {options.map((opt, i) =>
            opt.type === "org" ? (
              <button
                key={`org-${opt.name}`}
                ref={(el) => { optionRefs.current[i] = el; }}
                type="button"
                onClick={() => selectOption(opt)}
                onMouseEnter={() => setHighlight(i)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 ${i === highlight ? "bg-brand-50" : "hover:bg-gray-50"}`}
              >
                <span className="truncate text-gray-700">{opt.name}</span>
                {opt.name.toLowerCase() === trimmed.toLowerCase() && (
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                )}
              </button>
            ) : (
              <button
                key="__create__"
                ref={(el) => { optionRefs.current[i] = el; }}
                type="button"
                disabled={creating}
                onClick={() => selectOption(opt)}
                onMouseEnter={() => setHighlight(i)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 border-t border-gray-100 ${i === highlight ? "bg-brand-50" : "hover:bg-gray-50"}`}
              >
                <Plus className="w-4 h-4 text-brand-700 flex-shrink-0" />
                <span className="text-brand-700">
                  {creating ? "Creating…" : <>Add <span className="font-medium">&quot;{opt.name}&quot;</span> as new organization</>}
                </span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
