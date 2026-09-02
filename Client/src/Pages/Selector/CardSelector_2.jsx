import { useState } from "react";
import { MapPin, ArrowRight, ShieldAlert, Plus, X } from "lucide-react";
import AddCentreModal from "../../Components/Selector/AddCentreModal";
import {
  addCustomCentre,
  getCustomCentres,
  removeCustomCentre,
} from "../../utils/customCentres";
import {
  canAccessPortal,
  canEnterAdminDashboard,
  canEnterPartnerDashboard,
  canEnterSatheeMitraDashboard,
  PORTAL_OPTIONS,
} from "../../utils/portalMapping";

export default function CardSelector_2({ openDashboard, userCentre, userRole }) {
  const isAdmin = String(userRole || "").trim().toUpperCase() === "ADMIN";
  const [accessMessage, setAccessMessage] = useState("");
  const [customCentres, setCustomCentres] = useState(() => getCustomCentres());
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenPortal = (portalTitle) => {
    if (!canAccessPortal(userCentre, portalTitle, userRole)) {
      setAccessMessage("ACCESS DENIED");
      return;
    }

    if (
      canEnterAdminDashboard(userRole) ||
      canEnterPartnerDashboard(userRole) ||
      canEnterSatheeMitraDashboard(userRole)
    ) {
      setAccessMessage("");
      openDashboard(portalTitle);
      return;
    }

    setAccessMessage("ACCESS DENIED");
  };

  const handleOpenCustomCentre = (centreName) => {
    // Add a special prefix to indicate this is a custom centre with no data
    openDashboard(`__CUSTOM__${centreName}`);
  };

  const handleAdd = ({ title, subtitle }) => {
    setCustomCentres(addCustomCentre({ title, subtitle }));
  };

  const handleRemove = (id) => {
    setCustomCentres(removeCustomCentre(id));
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

      <div className="flex-1 flex items-center justify-center px-6 pb-10 text-black">
        <div className="grid w-full max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          {PORTAL_OPTIONS.map((state) => {
            const allowed = canAccessPortal(userCentre, state.title, userRole);

            return (
              <button
                key={state.title}
                type="button"
                onClick={() => handleOpenPortal(state.title)}
                className={`group relative rounded-3xl border p-8 text-left shadow-xl transition-all duration-300 hover:-translate-y-2 ${
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

          {customCentres.map((centre) => (
            <button
              key={centre.id}
              type="button"
              onClick={() => handleOpenCustomCentre(centre.title)}
              className="group relative rounded-3xl border border-slate-700 bg-[#F1F5F9] p-8 text-left shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-blue-500 hover:shadow-blue-500/20"
            >
              {isAdmin ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(centre.id);
                  }}
                  className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="Remove centre"
                >
                  <X size={16} />
                </button>
              ) : null}

              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400">
                <MapPin size={30} />
              </div>

              <h2 className="text-2xl font-bold leading-snug text-black">
                {centre.title}
              </h2>

              <p className="mt-3 text-black text-bold">{centre.subtitle}</p>

              <div className="mt-8 flex items-center gap-2 font-medium text-blue-400">
                Open Centre
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </div>
            </button>
          ))}

          {isAdmin ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="group rounded-3xl border-2 border-dashed border-slate-400 bg-slate-50 p-8 text-left shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-blue-500 hover:shadow-blue-500/20"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400">
                <Plus size={30} />
              </div>

              <h2 className="text-2xl font-bold leading-snug text-black">
                ADD NEW CENTRE
              </h2>

              <p className="mt-3 text-black text-bold">
                Create OR add a new custom centre
              </p>

              <div className="mt-8 flex items-center gap-2 font-medium text-blue-400">
                Add New Centre
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </div>
            </button>
          ) : null}
        </div>
      </div>

      <div className="pb-6">
        <p className="text-center text-sm text-slate-500">HCL SATHEE Platform</p>
      </div>

      {isAdmin ? (
        <AddCentreModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onAdd={handleAdd}
        />
      ) : null}
    </div>
  );
}
