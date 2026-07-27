import { useEffect, useMemo, useState } from "react";
import { Clock, ImageOff } from "lucide-react";
import { fetchMitraAttendance } from "../../services/mitraAttendance";
import TableStatusRow from "../common/TableStatusRow";

const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

function PhotoTimeCell({ label, photoUrl, time }) {
  return (
    <div className="flex flex-col items-center gap-2 py-1">
      <div className="relative w-24 h-24 rounded-xl border border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-400">
            <ImageOff size={22} />
            <span className="text-[10px] font-medium uppercase tracking-wide">No photo</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-slate-600">
        <Clock size={12} className="text-slate-400" />
        <span className="font-medium tabular-nums">{formatTime(time)}</span>
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
};

/** View-only Sathee Mitra attendance. Photos are uploaded from the Mitra portal. */
export default function SatheeMitraAttendance({
  mitras = [],
  loading = false,
  search = "",
  selectedDate,
}) {
  const [recordsByUser, setRecordsByUser] = useState({});
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState("");

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
      if (!selectedDate) return;
      setLoadingRecords(true);
      setError("");
      try {
        const records = await fetchMitraAttendance(selectedDate);
        if (!isMounted) return;
        const map = {};
        for (const record of records) {
          map[String(record.userId)] = record;
        }
        setRecordsByUser(map);
      } catch (err) {
        console.error("Load mitra attendance error:", err);
        if (!isMounted) return;
        setError(
          err.response?.data?.message || "Unable to load Sathee Mitra attendance"
        );
        setRecordsByUser({});
      } finally {
        if (isMounted) setLoadingRecords(false);
      }
    };

    loadRecords();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const getRecord = (userId) => recordsByUser[String(userId)] || EMPTY_RECORD;

  const busy = loading || loadingRecords;

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
                #
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Centre
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Centre ID
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Arrival
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Departure
              </th>
            </tr>
          </thead>
          <tbody>
            {busy ? (
              <TableStatusRow colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                Loading Sathee Mitra attendance…
              </TableStatusRow>
            ) : rows.length === 0 ? (
              <TableStatusRow colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                No Sathee Mitra found for this centre.
              </TableStatusRow>
            ) : (
              rows.map((mitra, index) => {
                const record = getRecord(mitra.id);
                const isEven = index % 2 === 0;

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
                    <td className="px-5 py-4 text-sm text-gray-400 align-middle">
                      {record.centreId || "—"}
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <PhotoTimeCell
                        label="Arrival"
                        photoUrl={record.arrivalPhotoUrl}
                        time={record.arrivalTime}
                      />
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <PhotoTimeCell
                        label="Departure"
                        photoUrl={record.departurePhotoUrl}
                        time={record.departureTime}
                      />
                    </td>
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
