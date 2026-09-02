import { useEffect, useMemo, useRef, useState } from "react";
import ExportDropdown from "../../Components/common/ExportDropdown";
import { downloadTableSvg, downloadTableXlsx } from "../../utils/exportTable";
import { getApiErrorMessage } from "../../utils/apiRequest";
import {
  deleteSchedule,
  loadScheduleForPortal,
  saveSchedule,
} from "../../services/schedules";
import {
  DEFAULT_MONTHS,
  DEFAULT_SUBJECTS,
  SCHEDULE_ACCEPT,
  DeleteMonthPanel,
  EmptyState,
  FilterSelect,
  ScheduleTable,
  StatusBanner,
  firstMonth,
  mergeScheduleRows,
  monthsFromRows,
  parseScheduleFile,
  readLocalSchedule,
  repairScheduleRows,
  scheduleMetaLabel,
} from "../../Components/Schedule";

export default function Schedule({
  isOpen,
  onClose,
  readOnly = false,
  portalName = "",
  isCustomCentre = false,
}) {
  const [subject, setSubject] = useState("Mathematics");
  const [month, setMonth] = useState(DEFAULT_MONTHS[0]);
  const [search, setSearch] = useState("");
  const [scheduleMeta, setScheduleMeta] = useState(null);
  const [allRows, setAllRows] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteMonth, setDeleteMonth] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const backdropRef = useRef(null);
  const fileInputRef = useRef(null);
  const bannerTimerRef = useRef(null);

  const flashStatusBanner = () => {
    setBannerVisible(true);
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => setBannerVisible(false), 2000);
  };

  useEffect(
    () => () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    },
    []
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const load = async () => {
      setError("");
      setIsDirty(false);
      setBannerVisible(false);
      setDeleteOpen(false);

      // Skip loading for custom centres
      if (isCustomCentre) {
        setAllRows([]);
        setScheduleMeta(null);
        setMonth(DEFAULT_MONTHS[0]);
        setLoading(false);
        return;
      }

      // Show device cache immediately (helps when Render is cold).
      const local = readLocalSchedule(portalName);
      if (local?.rows?.length) {
        const repairedLocal = repairScheduleRows(local.rows);
        setAllRows(repairedLocal);
        setScheduleMeta({
          ...scheduleMetaLabel(repairedLocal, local.lastFile || local.name),
          updatedAt: local.updatedAt || null,
        });
        if (repairedLocal[0]?.subject) setSubject(repairedLocal[0].subject);
        setMonth(firstMonth(monthsFromRows(repairedLocal)));
      }

      setLoading(true);
      try {
        const { schedule: stored, synced, error: syncError } =
          await loadScheduleForPortal(portalName, {
            canMigrate: !readOnly,
          });
        if (cancelled) return;

        if (!stored?.rows?.length) {
          if (!local?.rows?.length) {
            setAllRows([]);
            setScheduleMeta(null);
            setMonth(DEFAULT_MONTHS[0]);
          }
          setIsDirty(false);
          return;
        }

        const repaired = repairScheduleRows(stored.rows);
        const monthLabels = monthsFromRows(repaired);
        setAllRows(repaired);
        setScheduleMeta({
          ...scheduleMetaLabel(repaired, stored.lastFile || stored.name),
          updatedAt: stored.updatedAt || null,
        });
        setIsDirty(!synced);
        setBannerVisible(true);
        if (!synced && syncError) {
          setError(
            `${syncError}. Tap Save to sync so your phone can see this schedule.`
          );
        }

        // Persist repaired rows to server if they changed (admin/mitra only).
        if (
          synced &&
          !readOnly &&
          JSON.stringify(repaired) !== JSON.stringify(stored.rows)
        ) {
          try {
            await saveSchedule(portalName, {
              ...stored,
              ...scheduleMetaLabel(repaired, stored.lastFile || stored.name),
              rows: repaired,
            });
          } catch (err) {
            console.error(err);
            setIsDirty(true);
          }
        }

        // Local-only copy: force sync now so mobile can load it.
        if (!synced && !readOnly) {
          try {
            setSaving(true);
            const meta = scheduleMetaLabel(
              repaired,
              stored.lastFile || stored.name
            );
            const saved = await saveSchedule(portalName, {
              ...meta,
              rows: repaired,
            });
            setScheduleMeta({
              ...meta,
              updatedAt: saved?.updatedAt || new Date().toISOString(),
            });
            setIsDirty(false);
            setError("");
          } catch (err) {
            console.error(err);
            setIsDirty(true);
            setError(
              getApiErrorMessage(
                err,
                "Schedule is only on this device. Tap Save to sync to the cloud."
              )
            );
          } finally {
            setSaving(false);
          }
        }

        if (repaired[0]?.subject) setSubject(repaired[0].subject);
        setMonth(firstMonth(monthLabels));
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          if (!local?.rows?.length) {
            setAllRows([]);
            setScheduleMeta(null);
          } else {
            setIsDirty(true);
            setBannerVisible(true);
          }
          setError(getApiErrorMessage(err, "Unable to load schedule"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, portalName, readOnly, isCustomCentre]);

  const subjects = useMemo(() => {
    const fromData = [...new Set(allRows.map((r) => r.subject).filter(Boolean))];
    return fromData.length ? fromData : DEFAULT_SUBJECTS;
  }, [allRows]);

  const months = useMemo(() => {
    const fromData = monthsFromRows(allRows);
    return fromData.length ? fromData : DEFAULT_MONTHS;
  }, [allRows]);

  useEffect(() => {
    if (!subjects.includes(subject) && subjects[0]) setSubject(subjects[0]);
  }, [subjects, subject]);

  useEffect(() => {
    if (!months.includes(month)) setMonth(firstMonth(months));
  }, [months, month]);

  if (!isOpen) return null;

  const hasUpload = allRows.length > 0;
  const rows = allRows.filter(
    (r) =>
      r.subject === subject &&
      r.month === month &&
      r.topic.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0] || null;
    e.target.value = "";
    if (!file) return;

    const name = file.name.toLowerCase();
    const allowed =
      name.endsWith(".xls") ||
      name.endsWith(".xlsx") ||
      name.endsWith(".csv") ||
      String(file.type || "").includes("sheet") ||
      String(file.type || "").includes("excel") ||
      String(file.type || "").includes("csv");

    if (!allowed) {
      setError("Please upload an Excel (.xlsx / .xls) or CSV file.");
      return;
    }

    try {
      setError("");
      setSaving(true);
      const parsedRows = await parseScheduleFile(file, {
        fallbackSubject: subject,
        fallbackMonth: month,
      });
      if (!parsedRows.length) {
        setError(
          "No schedule rows found. Include columns like Subject, Month, Topic, Days, Start, End, Faculty, Completion, Status."
        );
        return;
      }

      const merged = mergeScheduleRows(allRows, parsedRows);
      const uploadedMonths = monthsFromRows(parsedRows);
      const meta = scheduleMetaLabel(merged, file.name);

      setAllRows(merged);
      setScheduleMeta(meta);
      setSubject(parsedRows[0].subject);
      setMonth(firstMonth(uploadedMonths));
      setSearch("");

      // Auto-save to Firestore so phone/laptop stay in sync (same as timetable).
      const saved = await saveSchedule(portalName, { ...meta, rows: merged });
      setScheduleMeta({
        ...meta,
        updatedAt: saved?.updatedAt || new Date().toISOString(),
      });
      setIsDirty(false);
      flashStatusBanner();
    } catch (err) {
      console.error(err);
      setIsDirty(true);
      setError(
        getApiErrorMessage(
          err,
          "Schedule was read but could not sync to the server. Tap Save to retry."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!allRows.length) {
      setError("Nothing to save. Upload a schedule first.");
      return;
    }
    setSaving(true);
    try {
      const meta = scheduleMetaLabel(allRows, scheduleMeta?.lastFile);
      const saved = await saveSchedule(portalName, { ...meta, rows: allRows });
      setScheduleMeta({
        ...meta,
        updatedAt: saved?.updatedAt || new Date().toISOString(),
      });
      setIsDirty(false);
      setError("");
      flashStatusBanner();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Unable to save schedule"));
    } finally {
      setSaving(false);
    }
  };

  const openDeleteMonth = () => {
    const available = monthsFromRows(allRows);
    if (!available.length) {
      setError("No month schedule available to delete.");
      return;
    }
    setDeleteMonth(available.includes(month) ? month : available[0]);
    setDeleteOpen(true);
  };

  const handleDeleteMonth = async () => {
    if (!deleteMonth) return;
    const remaining = allRows.filter((row) => row.month !== deleteMonth);
    const monthLabels = monthsFromRows(remaining);

    setSaving(true);
    try {
      if (!remaining.length) {
        await deleteSchedule(portalName);
        setAllRows([]);
        setScheduleMeta(null);
        setIsDirty(false);
        setMonth(DEFAULT_MONTHS[0]);
        setSubject("Mathematics");
      } else {
        const meta = scheduleMetaLabel(remaining, scheduleMeta?.lastFile);
        const saved = await saveSchedule(portalName, {
          ...meta,
          rows: remaining,
        });
        setAllRows(remaining);
        setScheduleMeta({
          ...meta,
          updatedAt: saved?.updatedAt || new Date().toISOString(),
        });
        setIsDirty(false);
        setMonth(firstMonth(monthLabels));
        if (!remaining.some((row) => row.subject === subject)) {
          setSubject(remaining[0].subject);
        }
        flashStatusBanner();
      }

      setDeleteOpen(false);
      setSearch("");
      setError("");
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Unable to update schedule"));
    } finally {
      setSaving(false);
    }
  };

  const runScheduleExport = (format) => {
    try {
      setExporting(true);
      const payload = {
        headers: ["Topic", "Days", "Start", "End", "Faculty", "Completion (%)", "Status"],
        rows: rows.map((r) => [
          r.topic,
          r.days,
          r.start,
          r.end,
          r.faculty,
          r.completion,
          r.status,
        ]),
        filename: `schedule-${subject}-${month}`.toLowerCase().replace(/\s+/g, "-"),
        title: `Teaching Schedule · ${subject} · ${month}`,
        sheetName: "Schedule",
      };
      if (format === "xlsx") downloadTableXlsx(payload);
      else downloadTableSvg(payload);
    } catch (err) {
      console.error(`Export schedule ${format.toUpperCase()} error:`, err);
      alert(`Unable to export schedule ${format.toUpperCase()} right now`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      onClick={(e) => e.target === backdropRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10, 18, 35, 0.62)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative flex flex-col bg-white shadow-2xl overflow-hidden"
        style={{ width: "90%", maxWidth: "1200px", height: "90vh", borderRadius: "24px" }}
        role="dialog"
        aria-modal="true"
        aria-label="Teaching Schedule"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Centre Teaching Schedule</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              {portalName
                ? `${portalName} · Monthly Subject Planning & Coverage`
                : "Monthly Subject Planning & Coverage"}
            </p>
          </div>
          <div
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-100"
            style={{ background: "#EFF6FF" }}
          >
            <span className="text-sm font-bold text-blue-600">{month}</span>
          </div>
        </div>

        <div
          className="flex flex-col flex-1 overflow-y-auto px-8 py-5 gap-5"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}
        >
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading && !hasUpload ? (
            <p className="py-16 text-center text-sm text-slate-500">Loading schedule…</p>
          ) : !hasUpload ? (
            <EmptyState
              readOnly={readOnly}
              onUploadClick={() => fileInputRef.current?.click()}
            />
          ) : (
            <>
              {hasUpload ? (
                <StatusBanner
                  meta={scheduleMeta}
                  topicCount={allRows.length}
                  months={monthsFromRows(allRows)}
                  isDirty={isDirty}
                />
              ) : null}

              {deleteOpen ? (
                <DeleteMonthPanel
                  months={monthsFromRows(allRows)}
                  value={deleteMonth}
                  onChange={setDeleteMonth}
                  onConfirm={handleDeleteMonth}
                  onCancel={() => setDeleteOpen(false)}
                />
              ) : null}

              <div className="flex flex-wrap gap-3 items-end">
                <FilterSelect
                  label="Subject"
                  value={subject}
                  onChange={setSubject}
                  options={subjects}
                />
                <FilterSelect
                  label="Month"
                  value={month}
                  onChange={setMonth}
                  options={months}
                />
                <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search Topic..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>

              <ScheduleTable rows={rows} />
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
          {!readOnly ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={SCHEDULE_ACCEPT}
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl border border-blue-200 text-sm font-semibold text-blue-600 hover:bg-blue-50"
              >
                {hasUpload ? "Add Month" : "Upload"}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasUpload || saving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Syncing…" : isDirty ? "Sync to phone" : "Save"}
              </button>
              <button
                type="button"
                onClick={openDeleteMonth}
                disabled={!hasUpload || saving}
                className="px-5 py-2.5 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          {!readOnly ? (
            <ExportDropdown
              exporting={exporting}
              onExportXlsx={() => runScheduleExport("xlsx")}
              onExportSvg={() => runScheduleExport("svg")}
              label="Export Schedule"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
