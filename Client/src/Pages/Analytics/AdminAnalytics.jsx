import { useState } from "react";
import StudentsTab from "../../Components/Analytics/StudentsTab";
import { matchesPortalCentre } from "../../utils/portalMapping";
import TeachersTab from "../../Components/Analytics/TeachersTab";
import MentorDetailsModal from "../../Components/Analytics/MentorDetailsModal";
import { MainLayout } from "../../Components/MainLayout";

const MENTORS = [
  {
    id: "M001",
    name: "Dr. Priya Sharma",
    qualification: "Ph.D. Physics",
    subject: "Physics",
    email: "priya.sharma@sathee.edu",
    address: "New Delhi",
    phone: "+91 98110 44321",
    attendance: 98,
    centre: "HCL Rajasthan",
    experience: "12 years",
    specialization: "Mechanics, Electrodynamics, Modern Physics",
    joinDate: "Jan 2023",
  },
  {
    id: "M002",
    name: "Prof. Ankit Gupta",
    qualification: "M.Sc. Mathematics",
    subject: "Mathematics",
    email: "ankit.gupta@sathee.edu",
    address: "Noida",
    phone: "+91 97420 33211",
    attendance: 95,
    centre: "HCL Madhya Pradesh",
    experience: "9 years",
    specialization: "Algebra, Calculus, Coordinate Geometry",
    joinDate: "Mar 2024",
  },
  {
    id: "M003",
    name: "Ms. Sunita Rao",
    qualification: "M.A. English",
    subject: "English",
    email: "sunita.rao@sathee.edu",
    address: "Bengaluru",
    phone: "+91 80992 11034",
    attendance: 87,
    centre: "HCL Jharkhand",
    experience: "7 years",
    specialization: "Grammar, Comprehension, Essay Writing",
    joinDate: "Aug 2023",
  },
];

export default function AdminAnalytics({ portalName, navItems, activeNav, onNavChange }) {
  const [activeTab, setActiveTab] = useState("students");
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [mentorModalOpen, setMentorModalOpen] = useState(false);

  const filteredMentors = MENTORS.filter((mentor) =>
    matchesPortalCentre(mentor.centre, portalName)
  );

  return (
    <MainLayout
      portalName={portalName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={onNavChange}
    >
      <main
        className="min-h-screen overflow-y-auto p-8 bg-gray-50"
        style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Analytics & Progress</h1>
          <p className="text-sm text-gray-500">Monitor student performance and teacher activity</p>
        </div>

        <div className="mb-8">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveTab("students")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === "students"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setActiveTab("teachers")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === "teachers"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Mentors
            </button>
          </div>
        </div>

        {activeTab === "students" ? (
          <StudentsTab portalName={portalName} />
        ) : (
          <TeachersTab
            mentors={filteredMentors}
            onViewMentor={(mentor) => {
              setSelectedMentor(mentor);
              setMentorModalOpen(true);
            }}
          />
        )}

        <MentorDetailsModal
          mentor={selectedMentor}
          open={mentorModalOpen}
          onClose={() => setMentorModalOpen(false)}
        />
      </main>
    </MainLayout>
  );
}
