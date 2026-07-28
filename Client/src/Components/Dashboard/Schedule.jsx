import { useEffect, useRef, useState } from "react";
import { ClipboardList, Upload, X, FileText } from "lucide-react";

const ACCEPT =
  ".pdf,.xls,.xlsx,.csv,.svg,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/svg+xml";

const storageKey = (portalName = "") =>
  `hcl_sathee_schedule_${String(portalName || "default")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")}`;

const readStored = (portalName) => {
  try {
    const raw = localStorage.getItem(storageKey(portalName));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.dataUrl || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeStored = (portalName, payload) => {
  try {
    if (!payload) localStorage.removeItem(storageKey(portalName));
    else localStorage.setItem(storageKey(portalName), JSON.stringify(payload));
  } catch (err) {
    console.error("Unable to save schedule file", err);
  }
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const isPdf = (file) =>
  String(file?.type || "").includes("pdf") ||
  String(file?.name || "").toLowerCase().endsWith(".pdf");

const isSvg = (file) =>
  String(file?.type || "").includes("svg") ||
  String(file?.name || "").toLowerCase().endsWith(".svg");

const isSpreadsheet = (file) => {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  return (
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".csv") ||
    type.includes("sheet") ||
    type.includes("excel") ||
    type.includes("csv")
  );
};

function EmptySchedule({ readOnly, onUploadClick }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center">
        <ClipboardList size={28} className="text-pink-500" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-800">No Schedule Available</p>
        <p className="text-sm text-gray-500 mt-1 max-w-sm leading-relaxed">
          {readOnly
            ? "No teaching schedule has been uploaded for this centre yet."
            : "Upload a PDF, Excel, or SVG file to display the centre teaching schedule here."}
        </p>
      </div>
      {!readOnly ? (
        <button
          type="button"
          onClick={onUploadClick}
          className="mt-1 px-6 py-2.5 rounded-xl bg-pink-600 text-white text-sm font-semibold hover:bg-pink-700 transition-all inline-flex items-center gap-2"
        >
          <Upload size={16} />
          Upload Schedule
        </button>
      ) : null}
    </div>
  );
}

function SchedulePreview({ file }) {
  if (!file?.dataUrl) return null;

  if (isPdf(file)) {
    return (
      <div className="overflow-hidden rounded-2xl border border-pink-200 bg-slate-50">
        <iframe
          title={file.name || "Schedule PDF"}
          src={file.dataUrl}
          className="h-[55vh] w-full"
        />
      </div>
    );
  }

  if (isSvg(file) || String(file.type || "").startsWith("image/")) {
    return (
      <div className="overflow-hidden rounded-2xl border border-pink-200 bg-white p-3">
        <img
          src={file.dataUrl}
          alt={file.name || "Schedule"}
          className="max-h-[55vh] w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-pink-200 bg-pink-50 px-5 py-8 text-center">
      <FileText className="mx-auto text-pink-600" size={36} />
      <p className="mt-3 font-semibold text-pink-900">{file.name}</p>
      <p className="mt-1 text-sm text-pink-700">
        Spreadsheet preview is not available in-browser. Open or download the file to view it.
      </p>
      <a
        href={file.dataUrl}
        download={file.name || "schedule.xlsx"}
        className="mt-4 inline-flex rounded-xl bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
      >
        Download / Open
      </a>
    </div>
  );
}

export default function Schedule({
  isOpen,
  onClose,
  readOnly = false,
  portalName = "",
}) {
  const backdropRef = useRef(null);
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setFile(readStored(portalName));
  }, [isOpen, portalName]);

  if (!isOpen) return null;

  const handleBackdropClick = (event) => {
    if (event.target === backdropRef.current) onClose();
  };

  const handleFileChange = async (event) => {
    const next = event.target.files?.[0] || null;
    event.target.value = "";
    if (!next) return;

    const allowed =
      isPdf(next) || isSvg(next) || isSpreadsheet(next) || next.type.startsWith("image/");
    if (!allowed) {
      setError("Please upload a PDF, Excel, CSV, or SVG file.");
      return;
    }

    try {
      setError("");
      const dataUrl = await fileToDataUrl(next);
      const payload = {
        name: next.name,
        type: next.type || "",
        size: next.size,
        dataUrl,
        updatedAt: new Date().toISOString(),
      };
      writeStored(portalName, payload);
      setFile(payload);
    } catch (err) {
      console.error(err);
      setError("Unable to read that file. Try a smaller file.");
    }
  };

  const handleRemove = () => {
    writeStored(portalName, null);
    setFile(null);
    setError("");
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-[#3B82F6]/30">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 flex items-center justify-center">
              <ClipboardList size={24} className="text-pink-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-black">Teaching Schedule</h2>
              <p className="text-sm text-gray-600">
                {portalName ? `${portalName} · Monthly Planning` : "Monthly Planning"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-auto flex-1">
          {error ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {file ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-pink-800 truncate">{file.name}</p>
                  <p className="text-xs text-pink-600 mt-0.5">
                    {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "Uploaded schedule"}
                  </p>
                </div>
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="shrink-0 text-pink-600 hover:text-pink-800 text-xs font-semibold"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <SchedulePreview file={file} />
            </div>
          ) : (
            <EmptySchedule
              readOnly={readOnly}
              onUploadClick={() => fileInputRef.current?.click()}
            />
          )}
        </div>

        <div className="p-6 border-t flex flex-wrap items-center justify-end gap-3">
          {!readOnly ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 border border-pink-300 text-pink-700 rounded-2xl hover:bg-pink-50 transition-colors font-medium inline-flex items-center gap-2"
              >
                <Upload size={18} />
                {file ? "Replace Upload" : "Upload"}
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 bg-[#0F172A] text-white rounded-2xl hover:bg-black transition-colors font-medium"
          >
            Close Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
