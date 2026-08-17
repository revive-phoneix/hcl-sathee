import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../../Components/MainLayout";
import { fetchCurrentUser, fetchUsers } from "../../services/users";
import { getAuthPayload } from "../../utils/authToken";
import { getApiErrorMessage } from "../../utils/apiRequest";
import { formatAvailableDays } from "../../utils/availableDays";
import { getInitials } from "../../utils/studentMetrics";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

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
  const [vishistMentors, setVishistMentors] = useState([]);
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

  useEffect(() => {
    if (!isMitra) {
      setVishistMentors([]);
      return;
    }

    let cancelled = false;

    const loadVishists = async () => {
      try {
        const users = await fetchUsers();
        if (cancelled) return;

        const currentId = profile?.id ?? userId;
        const currentCentre = profile?.centre || userCentre;

        const mentors = (users || []).filter((user) => {
          if (String(user.role || "").toUpperCase() !== "SATHEE MITRA") return false;
          if (user.isVishist !== true) return false;
          if (currentCentre && user.centre && String(user.centre) !== String(currentCentre)) {
            return false;
          }
          if (currentId != null && user.id != null && String(user.id) === String(currentId)) {
            return false;
          }
          return true;
        });

        setVishistMentors(mentors);
      } catch (err) {
        console.error("Load same-centre Vishist mentors error:", err);
        if (!cancelled) setVishistMentors([]);
      }
    };

    loadVishists();
    return () => {
      cancelled = true;
    };
  }, [isMitra, profile?.id, userId, profile?.centre, userCentre]);

  const rows = useMemo(
    () => [
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
    ],
    [centre, email, isMitra, name, profile?.availableDays, profile?.created_at, profile?.isVishist, profile?.phone, role]
  );

  return (
    <MainLayout
      portalName={portalName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
      roleLabel={roleLabel}
    >
      <div className="mx-auto max-w-5xl px-2 py-2">
        {error ? (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[#dfeae7] bg-[#f4f7f6] shadow-sm">
          <div className="flex items-center gap-4 bg-[#e7f7ee] px-6 py-5 text-[#1d5f48]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#cfeedd] text-lg font-semibold text-[#1d5f48]">
              {getInitials(name, "U")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-medium leading-none text-[#1d5f48]">{name}</p>
              <p className="mt-2 text-[13px] text-[#476c5e]">
                {role} &middot; {centre}
              </p>
            </div>
          </div>

          <div className="border-b border-[#e3e8e6] px-5 py-4">
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.03em] text-slate-500">
              Account details
            </p>

            {loading ? (
              <p className="py-6 text-center text-sm text-slate-500">Loading profile…</p>
            ) : (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                {rows.map((row) => (
                  <div key={row.label}>
                    <dt className="text-[12px] text-slate-500">{row.label}</dt>
                    <dd className="mt-1 text-[14px] font-medium text-slate-900 break-words">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {isMitra ? (
            <div className="px-5 py-4">
              <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.03em] text-slate-500">
                Sathee Vishist mentors
              </p>
              <p className="mb-4 text-[12px] text-slate-500">
                Visiting mentors don't have portal access &mdash; managed here on their behalf.
              </p>

              {vishistMentors.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No Sathee Vishist mentors assigned to this centre yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {vishistMentors.map((mentor) => {
                    const availableSet = new Set(Array.isArray(mentor.availableDays) ? mentor.availableDays : []);

                    return (
                      <div key={mentor.id} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-[13px] font-medium text-slate-900">{mentor.name || "Sathee Vishist"}</p>
                          <p className="text-[12px] text-slate-500 break-all">{mentor.email || "No email provided"}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {WEEKDAYS.map((day) => {
                            const active = availableSet.has(day);
                            return (
                              <span
                                key={`${mentor.id}-${day}`}
                                className={[
                                  "rounded-md border px-2 py-1 text-[11px] leading-none",
                                  active
                                    ? "border-[#d5efe0] bg-[#ddf5e7] text-[#1c7a53]"
                                    : "border-slate-200 bg-white text-slate-500",
                                ].join(" ")}
                              >
                                {day.slice(0, 3)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </MainLayout>
  );
}
