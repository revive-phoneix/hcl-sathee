import { useEffect, useMemo, useState } from "react";
import StudentsTab from "../../Components/Analytics/StudentsTab";
import TeachersTab from "../../Components/Analytics/TeachersTab";
import MentorDetailsModal from "../../Components/Analytics/MentorDetailsModal";
import UtilitiesSection from "../../Components/Analytics/UtilitiesSection";
import PortalAnalyticsGraphs from "../../Components/Analytics/PortalAnalyticsGraphs";
import { MainLayout } from "../../Components/MainLayout";
import { fetchUsers, updateUser } from "../../services/users";
import { fetchMitraAttendance } from "../../services/mitraAttendance";
import { matchesPortalCentre } from "../../utils/portalMapping";
import { WEEKDAYS } from "../../utils/availableDays";

const toInputDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const lastNDates = (n = 7) => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < n; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(toInputDate(date));
  }
  return dates;
};

const formatJoinDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const mapUserToMentor = (user, attendanceRate) => ({
  id: user.id,
  name: user.name || "—",
  qualification: "Sathee Mitra",
  subject: "Sathee Mitra",
  email: user.email || "—",
  address: "—",
  phone: user.phone || "—",
  attendance: attendanceRate,
  centre: user.centre || "—",
  experience: "—",
  specialization: "Sathee Mitra",
  joinDate: formatJoinDate(user.created_at),
  availableDays: Array.isArray(user.availableDays) ? user.availableDays : [],
  isVishist: Boolean(user.isVishist),
  role: user.role,
});

const patchMentor = (list, id, patch) =>
  list.map((mentor) => (String(mentor.id) === String(id) ? { ...mentor, ...patch } : mentor));

const replaceMentor = (list, replacement) =>
  list.map((mentor) =>
    String(mentor.id) === String(replacement.id) ? replacement : mentor
  );

const ANALYTICS_TABS = [
  { key: "students", label: "Students" },
  { key: "graphs", label: "Graphs" },
  { key: "teachers", label: "Mentors" },
];

export default function AdminAnalytics({
  portalName,
  navItems,
  activeNav,
  onNavChange,
  onLogout,
  readOnly = false,
  roleLabel = "Admin Portal",
  showMentors = true,
  allowAddEquipment = true,
}) {
  const [activeTab, setActiveTab] = useState("students");
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [mentors, setMentors] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [mentorsError, setMentorsError] = useState("");
  const [savingMentorId, setSavingMentorId] = useState(null);

  useEffect(() => {
    if (!showMentors) return undefined;

    let isMounted = true;

    const loadMentors = async () => {
      setLoadingMentors(true);
      setMentorsError("");

      try {
        const [users, attendanceByDate] = await Promise.all([
          fetchUsers(),
          Promise.all(
            lastNDates(7).map(async (date) => {
              try {
                const records = await fetchMitraAttendance(date);
                return Array.isArray(records) ? records : [];
              } catch {
                return [];
              }
            })
          ),
        ]);

        if (!isMounted) return;

        const presentDaysByUser = new Map();
        for (const dayRecords of attendanceByDate) {
          for (const record of dayRecords) {
            if (!(record.arrivalTime || record.arrivalPhotoUrl)) continue;
            const key = String(record.userId);
            presentDaysByUser.set(key, (presentDaysByUser.get(key) || 0) + 1);
          }
        }

        setMentors(
          (Array.isArray(users) ? users : [])
            .filter(
              (user) =>
                String(user.role || "").toUpperCase() === "SATHEE MITRA" &&
                matchesPortalCentre(user.centre, portalName)
            )
            .map((user) =>
              mapUserToMentor(
                user,
                Math.round(((presentDaysByUser.get(String(user.id)) || 0) / 7) * 100)
              )
            )
        );
      } catch (error) {
        console.error("Analytics mentors error:", error);
        if (!isMounted) return;
        setMentorsError("Unable to load mentors");
        setMentors([]);
      } finally {
        if (isMounted) setLoadingMentors(false);
      }
    };

    loadMentors();
    return () => {
      isMounted = false;
    };
  }, [portalName, showMentors]);

  const regularMentors = useMemo(() => mentors.filter((mentor) => !mentor.isVishist), [mentors]);
  const vishistMentors = useMemo(() => mentors.filter((mentor) => mentor.isVishist), [mentors]);

  const handleToggleAvailableDay = async (mentor, day) => {
    if (readOnly) return;

    const current = Array.isArray(mentor.availableDays) ? mentor.availableDays : [];
    const next = current.includes(day)
      ? current.filter((currentDay) => currentDay !== day)
      : WEEKDAYS.filter((weekday) => current.includes(weekday) || weekday === day);

    setMentors((prev) => patchMentor(prev, mentor.id, { availableDays: next }));
    if (selectedMentor && String(selectedMentor.id) === String(mentor.id)) {
      setSelectedMentor((prev) => ({ ...prev, availableDays: next }));
    }

    setSavingMentorId(mentor.id);
    setMentorsError("");

    try {
      const updated = await updateUser(mentor.id, { availableDays: next });
      setMentors((prev) =>
        patchMentor(prev, mentor.id, {
          availableDays: Array.isArray(updated.availableDays) ? updated.availableDays : next,
        })
      );
    } catch (error) {
      console.error("Toggle available day error:", error);
      setMentors((prev) => patchMentor(prev, mentor.id, { availableDays: current }));
      setMentorsError(error.response?.data?.message || "Unable to update available days");
    } finally {
      setSavingMentorId(null);
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
      <main className="min-h-screen overflow-y-auto p-8 bg-gray-50" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Analytics &amp; Progress</h1>
          <p className="text-sm text-gray-500">Monitor student performance and centre activity</p>
        </div>

        <div className="mb-8">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            {ANALYTICS_TABS.filter(({ key }) => key !== "teachers" || showMentors).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === key ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "students" ? (
          <StudentsTab portalName={portalName} />
        ) : activeTab === "graphs" ? (
          <PortalAnalyticsGraphs portalName={portalName} />
        ) : (
          <TeachersTab
            mentors={regularMentors}
            vishists={vishistMentors}
            loading={loadingMentors}
            error={mentorsError}
            readOnly={readOnly}
            savingMentorId={savingMentorId}
            onToggleAvailableDay={handleToggleAvailableDay}
            onViewMentor={(mentor) => {
              setSelectedMentor(mentor);
              setMentorModalOpen(true);
            }}
          />
        )}

        <UtilitiesSection portalName={portalName} readOnly={readOnly || !allowAddEquipment} />

        {showMentors ? (
          <MentorDetailsModal
            mentor={selectedMentor}
            open={mentorModalOpen}
            readOnly={readOnly}
            onClose={() => setMentorModalOpen(false)}
            onUpdated={(updatedMentor) => {
              setSelectedMentor(updatedMentor);
              setMentors((prev) => replaceMentor(prev, updatedMentor));
            }}
          />
        ) : null}
      </main>
    </MainLayout>
  );
}
