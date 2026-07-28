import { useCallback, useEffect, useMemo, useState } from "react";
import AnnouncementCard from "../../Components/Announcements/AnnouncementCard";
import NewAnnouncementModal from "../../Components/Announcements/NewAnnouncementModal";
import AnnouncementFilters from "../../Components/Announcements/AnnouncementFilters";
import { ConfirmDeleteModal, ViewModal } from "../../Components/Announcements/AnnouncementModals";
import { MainLayout } from "../../Components/MainLayout";
import {
  createAnnouncement,
  fetchAnnouncements,
  removeAnnouncement,
  updateAnnouncement,
} from "../../services/announcements";
import { getApiErrorMessage } from "../../utils/apiRequest";
import {
  getCentreValueFromPortal,
  matchesPortalCentre,
} from "../../utils/portalMapping";

const categoryOptions = [
  "All Courses",
  "JEE",
  "NEET",
  "SSC",
  "CLAT",
  "IPBS",
  "ICAR",
  "CUET",
  "RRB",
];

export default function AdminAnnouncements({
  portalName,
  userName,
  navItems,
  activeNav,
  onNavChange,
  onLogout,
  readOnly = false,
  roleLabel = "Admin Portal",
}) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Courses");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [viewId, setViewId] = useState(null);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchAnnouncements();
      setAnnouncements(data);
    } catch (loadError) {
      console.error("Fetch announcements error:", loadError);
      setError(getApiErrorMessage(loadError, "Unable to load announcements"));
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const centreAnnouncements = useMemo(
    () =>
      announcements.filter((a) => matchesPortalCentre(a.centre, portalName)),
    [announcements, portalName]
  );

  const findAnnouncement = (id) => centreAnnouncements.find((item) => item.id === id);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return centreAnnouncements.filter((announcement) => {
      if (filterCategory !== "All Courses" && announcement.category !== filterCategory) {
        return false;
      }
      if (!q) return true;
      return (
        announcement.title.toLowerCase().includes(q) ||
        announcement.description.toLowerCase().includes(q) ||
        announcement.category.toLowerCase().includes(q) ||
        (announcement.postedOn || "").toLowerCase().includes(q)
      );
    });
  }, [centreAnnouncements, search, filterCategory]);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    setError("");

    try {
      const centres = data.centres?.length
        ? data.centres
        : [getCentreValueFromPortal(portalName)].filter(Boolean);

      if (!centres.length) {
        setError("Select at least one centre for the announcement");
        return;
      }

      const basePayload = {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        postedBy: userName || "Admin",
        attachment: data.attachment || null,
      };

      if (editId !== null) {
        const [primaryCentre, ...extraCentres] = centres;
        const updated = await updateAnnouncement(editId, {
          ...basePayload,
          centre: primaryCentre,
        });
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === editId ? updated : a))
        );

        if (extraCentres.length) {
          const sharedAttachment = {
            attachmentName: updated.attachmentName,
            attachmentUrl: updated.attachmentUrl,
            attachmentType: updated.attachmentType,
            attachmentPath: updated.attachmentPath,
          };
          const createdList = await Promise.all(
            extraCentres.map((centre) =>
              createAnnouncement({
                title: basePayload.title,
                description: basePayload.description,
                category: basePayload.category,
                priority: basePayload.priority,
                postedBy: basePayload.postedBy,
                centre,
                ...sharedAttachment,
              })
            )
          );
          setAnnouncements((prev) => [...createdList, ...prev]);
        }

        setEditId(null);
      } else {
        const [primaryCentre, ...extraCentres] = centres;
        const first = await createAnnouncement({
          ...basePayload,
          centre: primaryCentre,
        });
        const createdList = [first];

        if (extraCentres.length) {
          const sharedAttachment = {
            attachmentName: first.attachmentName,
            attachmentUrl: first.attachmentUrl,
            attachmentType: first.attachmentType,
            attachmentPath: first.attachmentPath,
          };
          const rest = await Promise.all(
            extraCentres.map((centre) =>
              createAnnouncement({
                title: basePayload.title,
                description: basePayload.description,
                category: basePayload.category,
                priority: basePayload.priority,
                postedBy: basePayload.postedBy,
                centre,
                ...sharedAttachment,
              })
            )
          );
          createdList.push(...rest);
        }

        setAnnouncements((prev) => [...createdList, ...prev]);
      }

      setShowModal(false);
    } catch (submitError) {
      console.error("Save announcement error:", submitError);
      setError(getApiErrorMessage(submitError, "Unable to save announcement"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setError("");

    try {
      await removeAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirmId(null);
    } catch (deleteError) {
      console.error("Delete announcement error:", deleteError);
      setError(getApiErrorMessage(deleteError, "Unable to delete announcement"));
      setDeleteConfirmId(null);
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
                <span className="text-3xl">🔔</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Announcements
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {readOnly
                    ? "View announcements for students and faculty"
                    : "Manage announcements for students and faculty"}
                </p>
              </div>
            </div>

            {!readOnly ? (
              <button
                onClick={() => {
                  setEditId(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                <span className="text-lg">+</span> New Announcement
              </button>
            ) : null}
          </div>
        </div>

        <div className="p-9">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <AnnouncementFilters
            search={search}
            setSearch={setSearch}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            categoryOptions={categoryOptions}
          />

          <div className="flex justify-between items-center mb-4 text-sm text-slate-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-sky-600">{filtered.length}</span> of{" "}
              {centreAnnouncements.length} announcements
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 bg-sky-50 border border-dashed border-sky-200 rounded-3xl">
              <p className="text-slate-500">Loading announcements…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-sky-50 border border-dashed border-sky-200 rounded-3xl">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold text-slate-800">
                No announcements found
              </h3>
              <p className="text-slate-500 mt-2">
                {readOnly
                  ? "No announcements available for this centre."
                  : "Add a new announcement to get started"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((ann) => (
                <AnnouncementCard
                  key={ann.id}
                  announcement={ann}
                  readOnly={readOnly}
                  onEdit={(id) => {
                    setEditId(id);
                    setShowModal(true);
                  }}
                  onDelete={setDeleteConfirmId}
                  onView={setViewId}
                />
              ))}
            </div>
          )}
        </div>

        {!readOnly && showModal ? (
          <NewAnnouncementModal
            onClose={() => {
              if (submitting) return;
              setShowModal(false);
              setEditId(null);
            }}
            onSubmit={handleSubmit}
            submitting={submitting}
            defaultCentre={getCentreValueFromPortal(portalName)}
            editData={editId ? findAnnouncement(editId) : null}
          />
        ) : null}

        {!readOnly && deleteConfirmId ? (
          <ConfirmDeleteModal
            title={findAnnouncement(deleteConfirmId)?.title || ""}
            onCancel={() => setDeleteConfirmId(null)}
            onConfirm={() => handleDelete(deleteConfirmId)}
          />
        ) : null}

        {viewId && (
          <ViewModal
            announcement={findAnnouncement(viewId)}
            onClose={() => setViewId(null)}
          />
        )}
      </div>
    </MainLayout>
  );
}
