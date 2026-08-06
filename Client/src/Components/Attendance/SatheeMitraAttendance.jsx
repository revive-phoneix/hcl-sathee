import { useEffect, useMemo, useState } from "react";
import { Clock, ImageOff, Check, Lock } from "lucide-react";
import {
  fetchMitraAttendance,
  fetchMitraAttendanceRange,
  approveMitraAttendance,
} from "../../services/mitraAttendance";
import TableStatusRow from "../common/TableStatusRow";

const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const toInputDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseInputDate = (dateStr) => {
  const d = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

const getWeekRange = (dateStr) => {
  const d = parseInputDate(dateStr);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toInputDate(monday), to: toInputDate(sunday) };
};

const getMonthRange = (dateStr) => {
  const d = parseInputDate(dateStr);
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: toInputDate(from), to: toInputDate(to) };
};

const getYearRange = (dateStr) => {
  const d = parseInputDate(dateStr);
  const from = new Date(d.getFullYear(), 0, 1);
  const to = new Date(d.getFullYear(), 11, 31);
  return { from: toInputDate(from), to: toInputDate(to) };
};

const percentStatusMeta = (percent) => {
  if (percent == null || Number.isNaN(percent)) {
    return { statusKey: "none", statusLabel: "—" };
  }
  if (percent >= 90) return { statusKey: "excellent", statusLabel: "Excellent" };
  if (percent >= 85) return { statusKey: "good", statusLabel: "Good" };
  if (percent >= 80) return { statusKey: "average", statusLabel: "Average" };
  return { statusKey: "low", statusLabel: "Low" };
};

function TimeCell({ label, time }) {
  return (
    <div className="flex flex-col gap-1 py-1">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 text-center">
        {formatTime(time)}
      </div>
    </div>
  );
}

const EMPTY_RECORD = {
  arrivalPhotoUrl: null,
  arrivalTime: null,
  departurePhotoUrl: null,
  departureTime: null,
  centreId: null,
  dailyAttendancePercentage: null,
  statusKey: "none",
  statusLabel: "—",
  approved: false,
};

export default function SatheeMitraAttendance({
  mitras = [],
  loading = false,
  search = "",
  selectedDate,
  activeTab = "daily",
  canApprove = false,
}) {
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState("");
  const [approvingId, setApprovingId] = useState(null);

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return mitras.filter((m) => {
      if (!q) return true;
      return (
        (m.name || "").toLowerCase().includes(q) ||
        (m.centre || "").toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q)
      );
    });
  }, [mitras, search]);

  useEffect(() => {
    let isMounted = true;

    const loadRecords = async () => {
      const dateToUse = selectedDate || toInputDate();
      if (!dateToUse) return;
      setLoadingRecords(true);
      setError("");

      try {
        let recordsData = [];
        if (activeTab === "daily") {
          recordsData = await fetchMitraAttendance(dateToUse);
        } else if (activeTab === "weekly") {
          const range = getWeekRange(dateToUse);
          if (range.from && range.to) {
            recordsData = await fetchMitraAttendanceRange(range.from, range.to);
          }
        } else if (activeTab === "monthly") {
          const range = getMonthRange(dateToUse);
          if (range.from && range.to) {
            recordsData = await fetchMitraAttendanceRange(range.from, range.to);
          }
        }

        if (!isMounted) return;
        setRecords(recordsData);
      } catch (err) {
        console.error("Load mitra attendance error:", err);
        if (!isMounted) return;
        setError(
          err.response?.data?.message || "Unable to load Sathee Mitra attendance"
        );
        setRecords([]);
      } finally {
        if (isMounted) setLoadingRecords(false);
      }
    };

    loadRecords();
    return () => {
      isMounted = false;
    };
  }, [selectedDate, activeTab]);

  const recordsByUser = useMemo(() => {
    const map = {};
    for (const record of records) {
      const id = String(record.userId);
      if (!map[id]) map[id] = [];
      map[id].push(record);
    }
    return map;
  }, [records]);

  const getSummary = (userId) => {
    const entries = recordsByUser[String(userId)] || [];
    if (activeTab === "daily") {
      return entries[0] || EMPTY_RECORD;
    }

    const validPercents = entries
      .map((entry) => Number(entry.dailyAttendancePercentage))
      .filter((val) => Number.isFinite(val));
    const average =
      validPercents.length > 0
        ? validPercents.reduce((sum, value) => sum + value, 0) /
        validPercents.length
        : entries.length > 0
          ? Math.round((entries.filter((entry) => entry.arrivalTime || entry.departureTime).length / entries.length) * 100)
          : null;

    const { statusKey, statusLabel } = percentStatusMeta(average);
    const arrivalTimes = entries
      .map((entry) => entry.arrivalTime)
      .filter(Boolean)
      .sort();
    const departureTimes = entries
      .map((entry) => entry.departureTime)
      .filter(Boolean)
      .sort();

    return {
      ...EMPTY_RECORD,
      dailyAttendancePercentage: average,
      statusKey,
      statusLabel,
      arrivalTime: arrivalTimes.length ? arrivalTimes[0] : null,
      departureTime: departureTimes.length
        ? departureTimes[departureTimes.length - 1]
        : null,
    };
  };

  const handleApprove = async (userId, date) => {
    setApprovingId(userId);
    try {
      const updated = await approveMitraAttendance(userId, date);
      setRecords((prev) =>
        prev.map((r) =>
          String(r.userId) === String(userId) && r.date === date ? updated : r
        )
      );
    } catch (err) {
      console.error("Approve attendance error:", err);
      setError(err.response?.data?.message || err.message || "Unable to approve attendance");
    } finally {
      setApprovingId(null);
    }
  };

  const busy = loading || loadingRecords;
  const colSpan = canApprove ? 7 : 6;

  return (
    <div>
      {error ? (
        <div className="mx-5 mt-4 mb-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="bg-[#CCD2DD]">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">
                S.No
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Centre
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Arrival
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Departure
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              {canApprove ? (
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {busy ? (
              <TableStatusRow colSpan={colSpan} className="px-6 py-12 text-center text-sm text-gray-400">
                Loading Sathee Mitra attendance…
              </TableStatusRow>
            ) : rows.length === 0 ? (
              <TableStatusRow colSpan={colSpan} className="px-6 py-12 text-center text-sm text-gray-400">
                No Sathee Mitra found for this centre.
              </TableStatusRow>
            ) : (
              rows.map((mitra, index) => {
                const record = getSummary(mitra.id);
                const isEven = index % 2 === 0;
                const dateForRow = selectedDate || toInputDate();

                return (
                  <tr
                    key={mitra.id}
                    className={`transition-colors ${isEven ? "bg-white" : "bg-[#f8f9fb]"} hover:bg-blue-50/40`}
                  >
                    <td className="px-5 py-4 text-xs text-gray-400 tabular-nums align-middle">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <div className="font-medium text-sm text-gray-900">{mitra.name}</div>
                      {mitra.email ? (
                        <div className="text-xs text-slate-500 mt-0.5">{mitra.email}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 align-middle">
                      {mitra.centre || "—"}
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <TimeCell label="Arrival" time={record.arrivalTime} />
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <TimeCell label="Departure" time={record.departureTime} />
                    </td>
                    <td className="px-5 py-4 text-center align-middle">
                      {activeTab === "daily" ? (
                        record.approved ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <Check size={12} /> Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-500">
                            —
                          </span>
                        )
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${record.statusKey === "excellent"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : record.statusKey === "good"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : record.statusKey === "average"
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : record.statusKey === "low"
                                  ? "border-rose-200 bg-rose-50 text-rose-700"
                                  : "border-slate-200 bg-slate-50 text-slate-500"
                          }`}
                        >
                          {record.statusLabel || "—"}
                        </span>
                      )}
                    </td>
                    {canApprove ? (
                      <td className="px-5 py-4 text-center align-middle">
                        {activeTab !== "daily" ? (
                          <span className="text-xs text-slate-400">Daily only</span>
                        ) : !record.arrivalTime ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : record.approved ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <Check size={12} /> Approved
                          </span>
                        ) : Date.now() - new Date(record.arrivalTime).getTime() >
                          24 * 60 * 60 * 1000 ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-400">
                            <Lock size={12} /> Expired
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={approvingId === mitra.id}
                            onClick={() => handleApprove(mitra.id, dateForRow)}
                            className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {approvingId === mitra.id ? "Marking…" : "Mark Attendance"}
                          </button>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}