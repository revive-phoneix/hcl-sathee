import { useEffect, useState } from "react";
import { MessageSquareText, SendHorizonal } from "lucide-react";
import { MainLayout } from "../../Components/MainLayout";
import { fetchAdminUsers } from "../../services/users";
import api from "../../services/apiClient";
import { getApiErrorMessage } from "../../utils/apiRequest";

export default function QueryAndSupport({
  portalName,
  userName,
  userEmail,
  navItems,
  activeNav,
  onNavChange,
  onLogout,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    let active = true;
    const loadAdmins = async () => {
      try {
        const users = await fetchAdminUsers();
        if (!active) return;
        setAdmins(users.slice(0, 3));
      } catch (loadError) {
        console.error("Failed to load admin contacts:", loadError);
      }
    };
    loadAdmins();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await api.post("/api/support-queries", {
        title,
        description,
      });

      setMessage("Your query has been sent to the admins successfully.");
      setTitle("");
      setDescription("");
    } catch (submitError) {
      console.error("Support query submit error:", submitError);
      setError(getApiErrorMessage(submitError, "Unable to submit your query right now."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout
      portalName={portalName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
      roleLabel="Partner Portal"
    >
      <div className="bg-white min-h-[calc(100vh-62px)] rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 border-b border-sky-100 px-6 py-7 sm:px-9">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
              <MessageSquareText className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Query and Support</h1>
              <p className="text-sm text-slate-500 mt-1">
                Share your issue or request with the admin team and we will follow up.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-9">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="query-title">
                  Query Title
                </label>
                <input
                  id="query-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Portal access issue"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="query-description">
                  Description
                </label>
                <textarea
                  id="query-description"
                  rows="8"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe your issue, request, or concern in detail..."
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <SendHorizonal size={18} />
                {submitting ? "Submitting..." : "Submit Query"}
              </button>
            </form>

            <div className="rounded-3xl border border-sky-100 bg-sky-50 p-6">
              <h2 className="text-lg font-semibold text-slate-800">Need help fast?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Share what you need help with and the admin team will receive a notification. Please include the relevant portal, centre, or student details if applicable.
              </p>
              <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                <p className="font-semibold text-slate-800">Contact details</p>
                <p className="mt-2">Name: {userName || "Partner User"}</p>
                <p className="mt-1">Email: {userEmail || "Not available"}</p>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                <p className="font-semibold text-slate-800">Admin contacts</p>
                {admins.length === 0 ? (
                  <p className="mt-3 text-slate-500">Loading admin contacts…</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {admins.map((admin) => (
                      <div key={admin.id} className="rounded-2xl border border-slate-200 p-3 bg-slate-50">
                        <p className="font-semibold text-slate-900">{admin.name || "Admin"}</p>
                        <p className="mt-1 text-slate-600 break-all">{admin.email || "No email provided"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {message ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </MainLayout>
  );
}
