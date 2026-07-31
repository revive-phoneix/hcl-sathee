import { useEffect, useState } from "react";
import { MainLayout } from "../../Components/MainLayout";
import { fetchCurrentUser } from "../../services/users";
import { getAuthPayload } from "../../utils/authToken";
import { getApiErrorMessage } from "../../utils/apiRequest";
import { formatAvailableDays } from "../../utils/availableDays";
import { getInitials } from "../../utils/studentMetrics";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function MyProfile({
  portalName,
  navItems,
  activeNav,
  onNavChange,
  onLogout,
  roleLabel = "Portal",
  userName = "",
  userEmail = "",
  userId = null,
  userCentre = null,
  userRole = "",
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) setProfile(user);
      } catch (err) {
        console.error("My profile load error:", err);
        const token = getAuthPayload() || {};
        if (!cancelled) {
          setProfile({
            id: userId ?? token.id ?? null,
            name: userName || token.name || "",
            email: userEmail || token.email || "",
            role: userRole || token.role || "",
            centre: userCentre || token.centre || null,
            phone: "",
            availableDays: [],
            isVishist: null,
          });
          setError(
            getApiErrorMessage(err, "Showing limited profile from your login session.")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, userName, userEmail, userCentre, userRole]);

  const name = profile?.name || userName || "—";
  const email = profile?.email || userEmail || "—";
  const role = profile?.role || userRole || "—";
  const centre = profile?.centre || userCentre || "—";
  const isMitra = String(role).toUpperCase().includes("MITRA");

  const rows = [
    { label: "Full Name", value: name },
    { label: "Email", value: email },
    { label: "Phone", value: profile?.phone || "—" },
    { label: "Role", value: role },
    { label: "Centre", value: centre },
    ...(isMitra
      ? [
          {
            label: "Available Days",
            value: formatAvailableDays(profile?.availableDays) || "—",
          },
          {
            label: "Vishist",
            value:
              profile?.isVishist == null
                ? "—"
                : profile.isVishist
                  ? "Yes"
                  : "No",
          },
        ]
      : []),
    { label: "Member Since", value: formatDate(profile?.created_at) },
  ];

  return (
    <MainLayout
      portalName={portalName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
      roleLabel={roleLabel}
    >
      <div className="max-w-3xl mx-auto px-2 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Your account details for this portal.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-6 text-white flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold">
              {getInitials(name, "U")}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold truncate">{name}</h2>
              <p className="text-sm text-blue-100 truncate">{role}</p>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-sm text-slate-500 py-8 text-center">Loading profile…</p>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                {rows.map((row) => (
                  <div key={row.label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {row.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900 break-words">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
