import { useEffect, useState } from "react";
import { MapPin, ArrowRight, ShieldAlert, Plus, Pencil, Trash2 } from "lucide-react";
import AddCentreModal from "../../Components/Selector/AddCentreModal";
import {
  fetchCentres,
  createCentre,
  renameCentre,
  deleteCentre,
} from "../../services/centres";
import {
  canAccessPortal,
  canEnterAdminDashboard,
  canEnterPartnerDashboard,
  canEnterSatheeMitraDashboard,
  getCanonicalCentreKey,
  PORTAL_OPTIONS,
} from "../../utils/portalMapping";
import { getCentreId } from "../../utils/centreDirectory";

// The 3 originals are already rendered from PORTAL_OPTIONS with their own
// titles/subtitles — filter them out of the dynamic list so they show once.
const DEFAULT_CENTRE_KEYS = new Set(
  PORTAL_OPTIONS.map((option) => getCanonicalCentreKey(option.title))
);

export default function CardSelector_2({ openDashboard, userCentre, userRole }) {
  const isAdmin = String(userRole || "").trim().toUpperCase() === "ADMIN";
  const [accessMessage, setAccessMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [extraCentres, setExtraCentres] = useState([]);
  const [addError, setAddError] = useState("");
  const [saving, setSaving] = useState(false);
  // When set, the modal is in "rename" mode for this centre instead of "add".
  const [editingCentre, setEditingCentre] = useState(null);
  // Errors from rename/delete that aren't tied to the modal (e.g. CENTRE_IN_USE).
  const [actionError, setActionError] = useState("");

  const loadCentres = async () => {
    try {
      const centres = await fetchCentres();
      setExtraCentres(
        centres.filter(
          (centre) =>
            !DEFAULT_CENTRE_KEYS.has(getCanonicalCentreKey(centre.name))
        )
      );
    } catch (error) {
      console.error("Fetch Centres Error:", error);
    }
  };

  useEffect(() => {
    loadCentres();
  }, []);

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

  const openAddModal = () => {
    setEditingCentre(null);
    setAddError("");
    setActionError("");
    setModalOpen(true);
  };

  const openRenameModal = (centre) => {
    setEditingCentre(centre);
    setAddError("");
    setActionError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCentre(null);
    setAddError("");
  };

  const handleSubmitCentre = async (name) => {
    setAddError("");
    setSaving(true);
    try {
      if (editingCentre) {
        await renameCentre(editingCentre.id, name);
      } else {
        await createCentre(name);
      }
      await loadCentres();
      closeModal();
    } catch (error) {
      setAddError(
        error?.response?.data?.message ||
          (editingCentre
            ? "Unable to rename centre. Please try again."
            : "Unable to add centre. Please try again.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCentre = async (centre) => {
    if (
      !window.confirm(
        `Delete "${centre.name}"? This can't be undone.`
      )
    ) {
      return;
    }
    setActionError("");
    try {
      await deleteCentre(centre.id);
      await loadCentres();
    } catch (error) {
      setActionError(
        error?.response?.data?.message || "Unable to delete centre. Please try again."
      );
    }
  };

  const centreCards = [
    ...PORTAL_OPTIONS,
    ...extraCentres.map((centre) => ({
      title: centre.name,
      subtitle: "Learning Portal",
      custom: { id: centre.id, name: centre.name },
    })),
  ];

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

      {actionError && (
        <div className="mx-10 mb-2 flex items-center gap-3 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-red-700">
          <ShieldAlert size={22} className="shrink-0" />
          <p className="text-sm font-bold tracking-wide">{actionError}</p>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-6 pb-10 text-black">
        <div className="grid w-full max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          {centreCards.map((state) => {
            const allowed = canAccessPortal(userCentre, state.title, userRole);
            const custom = state.custom;

            return (
              <div key={state.title} className="relative">
              {isAdmin && custom ? (
                <div className="absolute right-4 top-4 z-10 flex gap-1.5">
                  <button
                    type="button"
                    title="Rename centre"
                    onClick={() => openRenameModal(custom)}
                    className="rounded-full bg-white/90 p-1.5 text-slate-500 shadow-sm hover:bg-white hover:text-blue-600"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    title="Delete centre"
                    onClick={() => handleDeleteCentre(custom)}
                    className="rounded-full bg-white/90 p-1.5 text-slate-500 shadow-sm hover:bg-white hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => handleOpenPortal(state.title)}
                className={`group relative w-full rounded-3xl border p-8 text-left shadow-xl transition-all duration-300 hover:-translate-y-2 ${
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
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Kendra ID: {getCentreId(state.title) ?? "—"}
                </p>

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
              </div>
            );
          })}

          {isAdmin ? (
            <button
              type="button"
              onClick={openAddModal}
              className="group rounded-3xl border-2 border-dashed border-slate-400 bg-slate-50 p-8 text-left shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-blue-500 hover:shadow-blue-500/20"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400">
                <Plus size={30} />
              </div>

              <h2 className="text-2xl font-bold leading-snug text-black">
                ADD NEW CENTRE
              </h2>

              <p className="mt-3 text-black text-bold">
                Add a new centre
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
          onClose={closeModal}
          onAdd={handleSubmitCentre}
          submitting={saving}
          error={addError}
          initialName={editingCentre?.name || ""}
          title={editingCentre ? "Rename Centre" : "Add a Centre"}
          submitLabel={editingCentre ? "Save" : "Add"}
        />
      ) : null}
    </div>
  );
}
