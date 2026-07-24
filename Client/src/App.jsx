import { useState } from "react";
import {
  BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation,
} from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, TrendingUp, Users, IdCard, Megaphone,
} from "lucide-react";

import Authentication from "./Pages/Auth/Authentication";
import CreatePassword from "./Components/Auth/CreatePassword";
import CardSelector_1 from "./Pages/Selector/CardSelector_1";
import CardSelector_2 from "./Pages/Selector/CardSelector_2";
import Dashboard from "./Pages/Dashboard/AdminDashboard";
import HCLPartnerDashboard from "./Pages/Dashboard/HCLPartnerDashboard";
import AdminAttendance from "./Pages/Attendance/AdminAttendance";
import HCLPartnerAttendance from "./Pages/Attendance/HCLPartnerAttendance";
import AdminUser from "./Pages/User/AdminUser";
import Student from "./Pages/Student/Student";
import PartnerStudents from "./Pages/Student/View";
import AdminAnnouncements from "./Pages/Announcements/AdminAnnouncements";
import HCLPartnerAnnouncements from "./Pages/Announcements/HCLPartnerAnnouncements";
import AdminAnalytics from "./Pages/Analytics/AdminAnalytics";
import HCLPartnerAnalytics from "./Pages/Analytics/HCLPartnerAnalytics";
import {
  canAccessPortal,
  canEnterAdminDashboard,
  canEnterPartnerDashboard,
} from "./utils/portalMapping";
import { clearAuthToken } from "./utils/authToken";

const ADMIN_PATH_TO_NAV = {
  "/dashboard": 0,
  "/attendance": 1,
  "/analytics": 2,
  "/users": 3,
  "/students": 4,
  "/announcements": 5,
};

const ADMIN_NAV_PATHS = [
  "/dashboard",
  "/attendance",
  "/analytics",
  "/users",
  "/students",
  "/announcements",
];

const PARTNER_PATH_TO_NAV = {
  "/partner/dashboard": 0,
  "/partner/attendance": 1,
  "/partner/analytics": 2,
  "/partner/students": 3,
  "/partner/announcements": 4,
};

const PARTNER_NAV_PATHS = [
  "/partner/dashboard",
  "/partner/attendance",
  "/partner/analytics",
  "/partner/students",
  "/partner/announcements",
];

const ADMIN_PATHS = new Set(ADMIN_NAV_PATHS);
const PARTNER_PATHS = new Set(PARTNER_NAV_PATHS);

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userCentre, setUserCentre] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [selectedPortal, setSelectedPortal] = useState("");

  const isAdmin = canEnterAdminDashboard(userRole);
  const isPartner = canEnterPartnerDashboard(userRole);

  const adminNavItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: CalendarDays, label: "Attendance Record" },
    { icon: TrendingUp, label: "Progress and Analytics" },
    { icon: Users, label: "Users & Roles" },
    { icon: IdCard, label: "Students" },
    { icon: Megaphone, label: "Announcements" },
  ];

  const partnerNavItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: CalendarDays, label: "Attendance Record" },
    { icon: TrendingUp, label: "Progress and Analytics" },
    { icon: IdCard, label: "Students" },
    { icon: Megaphone, label: "Announcements" },
  ];

  const activeNav = isPartner
    ? PARTNER_PATH_TO_NAV[location.pathname] ?? 0
    : ADMIN_PATH_TO_NAV[location.pathname] ?? 0;

  const handleAdminNavChange = (index) => {
    const path = ADMIN_NAV_PATHS[index];
    if (path) navigate(path);
  };

  const handlePartnerNavChange = (index) => {
    const path = PARTNER_NAV_PATHS[index];
    if (path) navigate(path);
  };

  const handleLogout = () => {
    clearAuthToken();
    setIsLoggedIn(false);
    setUserName("");
    setUserCentre(null);
    setUserRole("");
    setSelectedPortal("");
    navigate("/", { replace: true });
  };

  if (location.pathname === "/create-password") {
    return <CreatePassword />;
  }

  if (!isLoggedIn) {
    return (
      <Authentication
        onLoginSuccess={(user) => {
          const name = typeof user === "string" ? user : user?.name;
          setUserName(name || "Administrator");
          setUserCentre(typeof user === "object" ? user?.centre ?? null : null);
          setUserRole(typeof user === "object" ? user?.role || "" : "");
          setIsLoggedIn(true);
        }}
      />
    );
  }

  // Role-based route guards
  if (ADMIN_PATHS.has(location.pathname) && (!isAdmin || !selectedPortal)) {
    return <Navigate to="/portals" replace />;
  }

  if (PARTNER_PATHS.has(location.pathname)) {
    if (!isPartner || !selectedPortal) {
      return <Navigate to="/portals" replace />;
    }
    if (!canAccessPortal(userCentre, selectedPortal, userRole)) {
      return <Navigate to="/portals" replace />;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<CardSelector_1 openHCLSathee={() => navigate("/portals")} />} />

      <Route
        path="/portals"
        element={
          <CardSelector_2
            userCentre={userCentre}
            userRole={userRole}
            openDashboard={(name) => {
              if (!canAccessPortal(userCentre, name, userRole)) return;

              if (canEnterAdminDashboard(userRole)) {
                setSelectedPortal(name);
                navigate("/dashboard");
                return;
              }

              if (canEnterPartnerDashboard(userRole)) {
                setSelectedPortal(name);
                navigate("/partner/dashboard");
              }
            }}
          />
        }
      />

      {/* Admin routes */}
      <Route
        path="/dashboard"
        element={
          <Dashboard
            portalName={selectedPortal}
            userName={userName}
            navItems={adminNavItems}
            activeNav={activeNav}
            onNavChange={handleAdminNavChange}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/attendance"
        element={
          <AdminAttendance
            portalName={selectedPortal}
            navItems={adminNavItems}
            activeNav={activeNav}
            onNavChange={handleAdminNavChange}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/analytics"
        element={
          <AdminAnalytics
            portalName={selectedPortal}
            navItems={adminNavItems}
            activeNav={activeNav}
            onNavChange={handleAdminNavChange}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/users"
        element={
          <AdminUser
            portalName={selectedPortal}
            navItems={adminNavItems}
            activeNav={activeNav}
            onNavChange={handleAdminNavChange}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/students"
        element={
          <Student
            portalName={selectedPortal}
            navItems={adminNavItems}
            activeNav={activeNav}
            onNavChange={handleAdminNavChange}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/announcements"
        element={
          <AdminAnnouncements
            portalName={selectedPortal}
            userName={userName}
            navItems={adminNavItems}
            activeNav={activeNav}
            onNavChange={handleAdminNavChange}
            onLogout={handleLogout}
          />
        }
      />

      {/* HCL Partner routes (no Users page) */}
      <Route
        path="/partner/dashboard"
        element={
          <HCLPartnerDashboard
            portalName={selectedPortal}
            userName={userName}
            navItems={partnerNavItems}
            activeNav={activeNav}
            onNavChange={handlePartnerNavChange}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/partner/attendance"
        element={
          <HCLPartnerAttendance
            portalName={selectedPortal}
            navItems={partnerNavItems}
            activeNav={activeNav}
            onNavChange={handlePartnerNavChange}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/partner/analytics"
        element={
          <HCLPartnerAnalytics
            portalName={selectedPortal}
            navItems={partnerNavItems}
            activeNav={activeNav}
            onNavChange={handlePartnerNavChange}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/partner/students"
        element={
          <PartnerStudents
            portalName={selectedPortal}
            navItems={partnerNavItems}
            activeNav={activeNav}
            onNavChange={handlePartnerNavChange}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/partner/announcements"
        element={
          <HCLPartnerAnnouncements
            portalName={selectedPortal}
            userName={userName}
            navItems={partnerNavItems}
            activeNav={activeNav}
            onNavChange={handlePartnerNavChange}
            onLogout={handleLogout}
          />
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
