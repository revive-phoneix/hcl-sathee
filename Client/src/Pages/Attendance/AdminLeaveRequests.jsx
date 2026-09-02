import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Search, User } from "lucide-react";
import { MainLayout } from "../../Components/MainLayout";
import { fetchLeaveRequests, updateLeaveRequestStatus } from "../../services/leaveRequests";
import { getApiErrorMessage } from "../../utils/apiRequest";
import TableSortControls from "../../Components/common/TableSortControls";
import { matchesPortalCentre } from "../../utils/portalMapping";
import { sortTableRows } from "../../utils/tableSort";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusClasses = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function AdminLeaveRequests({
  portalName,
  navItems,
  activeNav,
  onNavChange,
  onLogout,
  roleLabel = "Admin Portal",
  isCustomCentre = false,
}) {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [busyId, setBusyId] = useState(null);

  const loadLeaveRequests = useCallback(async () => {
    if (isCustomCentre) {
      setLeaveRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const requests = await fetchLeaveRequests();
      setLeaveRequests(requests);
    } catch (loadError) {
      console.error("Fetch leave requests error:", loadError);
      setError(getApiErrorMessage(loadError, "Unable to load leave requests"));
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  }, [isCustomCentre]);

  useEffect(() => {
    loadLeaveRequests();
  }, [loadLeaveRequests]);

  const centreLeaveRequests = useMemo(
    () =>
      leaveRequests.filter((leave) => matchesPortalCentre(leave.centre, portalName)),
    [leaveRequests, portalName]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return centreLeaveRequests;

    return centreLeaveRequests.filter((leave) => {
      const fields = [
        leave.name,
        leave.email,
        leave.centre,
        leave.reason,
        leave.status,
        leave.fromDate,
        leave.toDate,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [centreLeaveRequests, search]);

  const sortedLeaveRequests = useMemo(
    () => sortTableRows(filtered, { sortBy, direction: sortDirection }),
    [filtered, sortBy, sortDirection]
  );

  const handleReview = async (id, status) => {
    setBusyId(id);
    setError("");

    try {
      const updated = await updateLeaveRequestStatus(id, status);
      setLeaveRequests((prev) =>
        prev.map((leave) => (leave.id === id ? updated : leave))
      );
    } catch (reviewError) {
      console.error("Update leave request status error:", reviewError);
      setError(getApiErrorMessage(reviewError, "Unable to update leave request"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <MainLayout
      portalName={portalName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
      roleLabel={roleLabel}
    >
      <div className="bg-white min-h-[calc(100vh-62px)]">
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 border-b border-sky-100 px-9 py-7">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
                <CalendarDays size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Leave Requests
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Review leave requests submitted by Sathee Mitra for this centre
                </p>
              </div>
            </div>

            <div className="relative w-full max-w-sm">
              <Search
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search requests..."
                className="w-full rounded-2xl border border-sky-100 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none focus:border-sky-400"
              />
            </div>
          </div>
        </div>

        <div className="p-9">
          {error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-4 mb-4 text-sm text-slate-500">
            <div>
              Showing <span className="font-semibold text-sky-600">{filtered.length}</span> of {centreLeaveRequests.length} requests
            </div>
            <TableSortControls
              value={sortDirection}
              onChange={setSortDirection}
              sortBy={sortBy}
              onSortByChange={setSortBy}
            />
          </div>

          {loading ? (
            <div className="text-center py-20 bg-sky-50 border border-dashed border-sky-200 rounded-3xl">
              <p className="text-slate-500">Loading leave requests…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-sky-50 border border-dashed border-sky-200 rounded-3xl">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-slate-800">
                No leave requests found
              </h3>
              <p className="text-slate-500 mt-2">
                Leave requests from Sathee Mitra will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sortedLeaveRequests.map((leave) => {
                const status = String(leave.status || "pending").toLowerCase();
                const statusClass =
                  statusClasses[status] || statusClasses.pending;
                const isPending = status === "pending";
                const isBusy = busyId === leave.id;

                return (
                  <div
                    key={leave.id}
                    className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-sky-50 flex items-center justify-center shrink-0">
                            <User size={20} className="text-sky-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-slate-900 truncate">
                              {leave.name || "Unnamed request"}
                            </h3>
                            <p className="text-sm text-slate-500 truncate">
                              {leave.email || "No email provided"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                          <div>
                            <span className="font-medium text-slate-900">From:</span> {formatDate(leave.fromDate)}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">To:</span> {formatDate(leave.toDate)}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">Centre:</span> {leave.centre || "—"}
                          </div>
                        </div>

                        <p className="mt-4 text-sm text-slate-700 leading-relaxed">
                          {leave.reason || "No reason provided"}
                        </p>
                      </div>

                      <div className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusClass}`}>
                        {status}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleReview(leave.id, "approved")}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? "Saving…" : "Approve"}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleReview(leave.id, "rejected")}
                            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? "Saving…" : "Reject"}
                          </button>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">
                          This request has already been reviewed.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}