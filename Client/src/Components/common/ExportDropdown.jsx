import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, Image } from "lucide-react";

export default function ExportDropdown({
  exporting = false,
  disabled = false,
  onExportXlsx,
  onExportSvg,
  label = "Export",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const runExport = async (type) => {
    setOpen(false);
    if (type === "xlsx") await onExportXlsx?.();
    if (type === "svg") await onExportSvg?.();
  };

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        disabled={disabled || exporting}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download size={14} />
        {exporting ? "Exporting…" : label}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => runExport("xlsx")}
            className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" />
            Export XLSX
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => runExport("svg")}
            className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <Image size={15} className="text-blue-600" />
            Export SVG
          </button>
        </div>
      ) : null}
    </div>
  );
}
