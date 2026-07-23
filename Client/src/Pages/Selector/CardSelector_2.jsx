import { useState } from "react";
import { MapPin, ArrowRight, ShieldAlert, Construction } from "lucide-react";
import {
  canAccessPortal,
  canEnterAdminDashboard,
  PORTAL_OPTIONS,
} from "../../utils/portalMapping";

export default function CardSelector_2({ openDashboard, userCentre, userRole }) {
  const [accessMessage, setAccessMessage] = useState("");
  const [comingSoon, setComingSoon] = useState(false);

  const handleOpenPortal = (portalTitle) => {
    if (!canAccessPortal(userCentre, portalTitle, userRole)) {
      setComingSoon(false);
      setAccessMessage("ACCESS DENIED");
      return;
    }

    // Admin dashboard pages are ready; other roles come later
    if (!canEnterAdminDashboard(userRole)) {
      setAccessMessage("");
      setComingSoon(true);
      return;
    }

    setAccessMessage("");
    setComingSoon(false);
    openDashboard(portalTitle);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-white flex flex-col">
      <div className="px-10 py-8">
        <h1 className="text-4xl text-black font-bold">Select Your State Portal</h1>
        <p className="mt-2 text-black">
          Choose the HCL SATHEE portal you want to manage.
        </p>
      </div>

      {accessMessage && (
        <div className="mx-10 mb-2 flex items-center gap-3 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-red-700">
          <ShieldAlert size={22} className="shrink-0" />
          <p className="text-sm font-bold tracking-wide">{accessMessage}</p>
        </div>
      )}

      {comingSoon && (
        <div className="mx-10 mb-2 flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-amber-800">
          <Construction size={22} className="shrink-0" />
          <div>
            <p className="text-sm font-bold tracking-wide">COMING SOON</p>
            <p className="text-xs mt-0.5 text-amber-700">
              This is admin dashboard functionality. Other roles will be available in future updates.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-6 pb-10 text-black">
        <div className="grid w-full max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          {PORTAL_OPTIONS.map((state) => {
            const allowed = canAccessPortal(userCentre, state.title, userRole);

            return (
              <button
                key={state.title}
                type="button"
                onClick={() => handleOpenPortal(state.title)}
                className={`group rounded-3xl border p-8 text-left shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                  allowed
                    ? "border-slate-700 bg-[#F1F5F9] hover:border-blue-500 hover:shadow-blue-500/20"
                    : "border-slate-300 bg-slate-100 opacity-80 hover:border-red-400 hover:shadow-red-500/10"
                }`}
              >
                <div
                  className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${
                    allowed
                      ? "bg-blue-600/20 text-blue-400"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {allowed ? <MapPin size={30} /> : <ShieldAlert size={30} />}
                </div>

                <h2 className="text-2xl font-bold leading-snug text-black">
                  {state.title}
                </h2>

                <p className="mt-3 text-black text-bold">{state.subtitle}</p>

                <div
                  className={`mt-8 flex items-center gap-2 font-medium ${
                    allowed ? "text-blue-400" : "text-red-500"
                  }`}
                >
                  {allowed ? "Open Portal" : "Restricted"}
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pb-6">
        <p className="text-center text-sm text-slate-500">HCL SATHEE Platform</p>
      </div>
    </div>
  );
}
