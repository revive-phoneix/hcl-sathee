import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { EQUIPMENT_CATALOG } from "../../Data/EquipmentCatalog";

export default function EquipmentNameSelect({ value, onChange, className, placeholder }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered =
    query.trim().length === 0
      ? EQUIPMENT_CATALOG
      : EQUIPMENT_CATALOG.filter((item) =>
          item.name.toLowerCase().includes(query.trim().toLowerCase())
        );

  const handleInputChange = (e) => {
    const next = e.target.value;
    setQuery(next);
    onChange({ name: next, description: "", quantity: 0 });
    setOpen(true);
  };

  const handleSelect = (item) => {
    setQuery(item.name);
    onChange(item);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          className={`${className} pl-9 pr-9`}
          placeholder={placeholder}
        />
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>

      {open ? (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filtered.length ? (
            filtered.slice(0, 50).map((item) => (
              <button
                type="button"
                key={`${item.name}-${item.description}`}
                onClick={() => handleSelect(item)}
                className="block w-full px-3.5 py-2 text-left hover:bg-blue-50"
              >
                <div className="text-sm text-slate-700">{item.name}</div>
                {item.description ? (
                  <div className="truncate text-xs text-slate-400">{item.description}</div>
                ) : null}
              </button>
            ))
          ) : (
            <div className="px-3.5 py-2 text-sm text-slate-400">
              No match — "{query}" will be added as a custom name
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}