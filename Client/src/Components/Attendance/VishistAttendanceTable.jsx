import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { fetchVishistAttendance } from "../../services/vishistAttendance";

export default function VishistAttendanceTable({ selectedDate, portalName, isCustomCentre = false }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    if (isCustomCentre) {
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    fetchVishistAttendance(selectedDate, portalName, "approved")
      .then((data) => isMounted && setRecords(data))
      .catch(() => isMounted && setError("Unable to load Vishist attendance"))
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, [selectedDate, portalName, isCustomCentre]);

  return (
    <div className="overflow-x-auto">
      {error ? (
        <p className="mx-5 mt-4 mb-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="bg-[#CCD2DD]">
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Vishist</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Topic Taught</th>
            <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Photo</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400">Loading…</td></tr>
          ) : records.length === 0 ? (
            <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400">No approved Vishist attendance for this day.</td></tr>
          ) : (
            records.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-[#f8f9fb]"}>
                <td className="px-5 py-4 text-sm font-medium text-gray-900">{r.vishistName}</td>
                <td className="px-5 py-4 text-sm text-gray-700">{r.subject}</td>
                <td className="px-5 py-4 text-sm text-gray-700">{r.topicTaught}</td>
                <td className="px-5 py-4 text-center">
                  {r.photoUrl ? (
                    <img src={r.photoUrl} alt={r.vishistName} className="mx-auto h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <ImageOff size={16} className="mx-auto text-slate-300" />
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}