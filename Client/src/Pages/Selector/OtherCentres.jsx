import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  MapPin,
  GraduationCap,
  Users,
  Award,
  Handshake,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { MainLayout } from "../../Components/MainLayout";
import { fetchCentresOverview } from "../../services/centres";
import { getCanonicalCentreKey, PORTAL_OPTIONS } from "../../utils/portalMapping";

/** Centre name -> the portal name the rest of the app expects (default centres
 *  keep their "HCL SATHEE <STATE>" portal title; custom centres use their name). */
const portalNameForCentre = (centreName) => {
  const key = getCanonicalCentreKey(centreName);
  const option = PORTAL_OPTIONS.find((o) => getCanonicalCentreKey(o.title) === key);
  return option ? option.title : centreName;
};

const STAT_META = [
  { key: "students", label: "Students", Icon: GraduationCap, tint: "text-blue-600 bg-blue-50" },
  { key: "satheeMitra", label: "Sathee Mitra", Icon: Users, tint: "text-emerald-600 bg-emerald-50" },
  { key: "satheeVishist", label: "Sathee Vishist", Icon: Award, tint: "text-amber-600 bg-amber-50" },
  { key: "hclPartner", label: "HCL Partner", Icon: Handshake, tint: "text-violet-600 bg-violet-50" },
];

export default function OtherCentres({
  portalName,
  navItems,
  activeNav,
  onNavChange,
  onLogout,
  onOpenCentre,
  currentPortal = "",
}) {
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null); // centre awaiting confirmation

  const currentKey = useMemo(
    () => getCanonicalCentreKey(currentPortal),
    [currentPortal]
  );

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      setCentres(await fetchCentresOverview());
    } catch (err) {
      console.error("Centres overview error:", err);
      setError(
        err?.response?.data?.message || "Could not load the centres. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchCentresOverview();
        if (!cancelled) setCentres(data);
      } catch (err) {
        console.error("Centres overview error:", err);
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Could not load the centres. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const confirmRedirect = () => {
    if (!pending) return;
    onOpenCentre(portalNameForCentre(pending.name));
  };

  return (
    <MainLayout
      portalName={portalName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
    >
      <div className="text-slate-900">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Other Centres</h1>
            <p className="mt-1 text-sm text-slate-500">
              Open another centre&rsquo;s portal. Headcounts update live.
            </p>
          </div>
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-slate-500">
            <Loader2 size={20} className="animate-spin" /> Loading centres&hellip;
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        ) : centres.length === 0 ? (
          <p className="py-24 text-center text-slate-500">No centres found.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {centres.map((centre) => {
              const isCurrent =
                currentKey && getCanonicalCentreKey(centre.name) === currentKey;
              return (
                <button
                  key={centre.id}
                  type="button"
                  onClick={() => setPending(centre)}
                  className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
                      <MapPin size={24} />
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {isCurrent ? (
                        <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                          You&rsquo;re here
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          centre.isDefault
                            ? "bg-slate-100 text-slate-600"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {centre.isDefault ? "Default" : "Custom"}
                      </span>
                    </div>
                  </div>

                  <h2 className="mt-4 text-xl font-bold leading-snug">{centre.name}</h2>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {STAT_META.map(({ key, label, Icon, tint }) => (
                      <div
                        key={key}
                        className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
                      >
                        <div
                          className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${tint}`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="text-lg font-bold leading-none">
                          {centre.counts?.[key] ?? 0}
                        </div>
                        <div className="mt-1 text-[11px] font-medium text-slate-500">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-blue-600">
                    Open this portal
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {pending ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
              <MapPin size={26} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Redirect to {pending.name}?
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              You&rsquo;ll leave the current portal and open this centre&rsquo;s dashboard.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRedirect}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Yes, continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
}
