import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../../Components/MainLayout";
import { fetchSupportQueries, replyToSupportQuery } from "../../services/supportQueries";
import { getApiErrorMessage } from "../../utils/apiRequest";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function AdminQueries({ portalName, navItems, activeNav, onNavChange, onLogout, userName, isCustomCentre = false }) {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyMap, setReplyMap] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  const loadQueries = async () => {
    // Skip loading for custom centres
    if (isCustomCentre) {
      setQueries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchSupportQueries();
      setQueries(data);
    } catch (loadError) {
      console.error("Fetch support queries error:", loadError);
      setError(getApiErrorMessage(loadError, "Unable to load partner queries"));
      setQueries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();
  }, [isCustomCentre]);

  const totalPending = useMemo(
    () => queries.filter((query) => (query.status || "Open") !== "Replied").length,
    [queries]
  );

  const handleReply = async (id) => {
    const message = (replyMap[id] || "").trim();
    if (!message) return;

    setSubmittingId(id);
    setError("");

    try {
      const updated = await replyToSupportQuery(id, message);
      setQueries((prev) =>
        prev.map((item) => (String(item.id) === String(id) ? updated : item))
      );
      setReplyMap((prev) => ({ ...prev, [id]: "" }));
    } catch (replyError) {
      console.error("Reply error:", replyError);
      setError(getApiErrorMessage(replyError, "Unable to send reply"));
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <MainLayout
      portalName={portalName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
      roleLabel="Admin Portal"
    >
      <div className="min-h-[calc(100vh-62px)] rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-7 md:px-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Queries</h1>
              <p className="text-sm text-slate-600">
                Review partner questions and reply directly from here.
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm border border-slate-200">
              {totalPending} pending
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              Loading queries...
            </div>
          ) : queries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No partner queries submitted yet.
            </div>
          ) : (
            <div className="space-y-5">
              {queries.map((query) => (
                <div key={query.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-semibold text-slate-900">{query.title}</h2>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            query.status === "Replied"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {query.status || "Open"}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-slate-600">
                        <span className="font-medium text-slate-800">{query.submittedBy || "Partner User"}</span>
                        <span className="mx-2">•</span>
                        <span>{query.submittedByEmail || "No email"}</span>
                        <span className="mx-2">•</span>
                        <span>{query.submittedByRole || "HCL Partner"}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 md:text-right">
                      <div>{formatDate(query.created_at)}</div>
                      {query.centre ? <div className="mt-1">{query.centre}</div> : null}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                    {query.description || "No description provided."}
                  </div>

                  <div className="mt-5 space-y-3">
                    {query.replies?.length ? (
                      query.replies.map((reply) => (
                        <div key={reply.id} className="rounded-2xl border border-sky-100 bg-sky-50 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-sky-800">{reply.adminName || "Admin"}</p>
                            <span className="text-[11px] text-slate-500">{formatDate(reply.created_at)}</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-700">{reply.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-500">No admin reply yet.</div>
                    )}
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Reply</label>
                    <textarea
                      rows="3"
                      value={replyMap[query.id] || ""}
                      onChange={(event) =>
                        setReplyMap((prev) => ({
                          ...prev,
                          [query.id]: event.target.value,
                        }))
                      }
                      placeholder="Write a reply to the partner..."
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleReply(query.id)}
                        disabled={submittingId === query.id || !((replyMap[query.id] || "").trim())}
                        className="rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submittingId === query.id ? "Sending..." : "Send Reply"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
