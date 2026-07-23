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
import AdminAttendance from "./Pages/Attendance/AdminAttendance";
import AdminUser from "./Pages/User/AdminUser";
import Student from "./Pages/Student/Student";
import AdminAnnouncements from "./Pages/Announcements/AdminAnnouncements";
import AdminAnalytics from "./Pages/Analytics/AdminAnalytics";
import { canEnterAdminDashboard } from "./utils/portalMapping";

const PATH_TO_NAV = {
  "/dashboard": 0,
  "/attendance": 1,
  "/analytics": 2,
  "/users": 3,
  "/students": 4,
  "/announcements": 5,
};

const NAV_PATHS = [
  "/dashboard",
  "/attendance",
  "/analytics",
  "/users",
  "/students",
  "/announcements",
];

const ADMIN_PATHS = new Set(NAV_PATHS);

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userCentre, setUserCentre] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [selectedPortal, setSelectedPortal] = useState("");

  const isAdmin = canEnterAdminDashboard(userRole);
  const activeNav = PATH_TO_NAV[location.pathname] ?? 0;

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: CalendarDays, label: "Attendance Record" },
    { icon: TrendingUp, label: "Progress and Analytics" },
    { icon: Users, label: "Users & Roles" },
    { icon: IdCard, label: "Students" },
    { icon: Megaphone, label: "Announcements" },
  ];

  const handleNavChange = (index) => {
    const path = NAV_PATHS[index];
    if (path) navigate(path);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName("");
    setUserCentre(null);
    setUserRole("");
    setSelectedPortal("");
    navigate("/", { replace: true });
  };

  // Invite link must work without login
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

  // Non-admins cannot open admin pages via URL
  if (ADMIN_PATHS.has(location.pathname) && (!isAdmin || !selectedPortal)) {
    return <Navigate to="/portals" replace />;
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
              if (!canEnterAdminDashboard(userRole)) return;
              setSelectedPortal(name);
              navigate("/dashboard");
            }}
          />
        }
      />

      <Route
        path="/dashboard"
        element={
          <Dashboard
            portalName={selectedPortal}
            userName={userName}
            navItems={navItems}
            activeNav={activeNav}
            onNavChange={handleNavChange}
            onLogout={handleLogout}
          />
        }
      />

      <Route
        path="/attendance"
        element={
          <AdminAttendance
            portalName={selectedPortal}
            navItems={navItems}
            activeNav={activeNav}
            onNavChange={handleNavChange}
            onLogout={handleLogout}
          />
        }
      />

      <Route
        path="/analytics"
        element={
          <AdminAnalytics
            portalName={selectedPortal}
            navItems={navItems}
            activeNav={activeNav}
            onNavChange={handleNavChange}
            onLogout={handleLogout}
          />
        }
      />

      <Route
        path="/users"
        element={
          <AdminUser
            portalName={selectedPortal}
            navItems={navItems}
            activeNav={activeNav}
            onNavChange={handleNavChange}
            onLogout={handleLogout}
          />
        }
      />

      <Route
        path="/students"
        element={
          <Student
            portalName={selectedPortal}
            navItems={navItems}
            activeNav={activeNav}
            onNavChange={handleNavChange}
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
            navItems={navItems}
            activeNav={activeNav}
            onNavChange={handleNavChange}
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
