import { useEffect, useState } from "react";
import {
  BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation,
} from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, TrendingUp, Users, IdCard, Megaphone,
} from "lucide-react";

import Authentication from "./Pages/Auth/Authentication";
import CreatePassword from "./Components/Auth/CreatePassword";
import ForgetPassword from "./Components/Auth/ForgetPassword";
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
import { clearSession, getSession, setSession, updateSession } from "./utils/authSession";
import { getAuthToken } from "./utils/authToken";

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

const readInitialSession = () => {
  if (!getAuthToken()) return null;
  return getSession();
};

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialSession = readInitialSession();

  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialSession));
  const [userName, setUserName] = useState(initialSession?.name || "");
  const [userCentre, setUserCentre] = useState(initialSession?.centre ?? null);
  const [userRole, setUserRole] = useState(initialSession?.role || "");
  const [selectedPortal, setSelectedPortal] = useState(initialSession?.portal || "");

  useEffect(() => {
    if (!getAuthToken()) {
      clearSession();
      setIsLoggedIn(false);
    }
  }, []);

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

  const handleLogout = () => {
    clearSession();
    setIsLoggedIn(false);
    setUserName("");
    setUserCentre(null);
    setUserRole("");
    setSelectedPortal("");
    navigate("/", { replace: true });
  };

  const handleAdminNavChange = (index) => {
    const path = ADMIN_NAV_PATHS[index];
    if (path) navigate(path);
  };

  const handlePartnerNavChange = (index) => {
    const path = PARTNER_NAV_PATHS[index];
    if (path) navigate(path);
  };

  const selectPortal = (name) => {
    setSelectedPortal(name);
    updateSession({ portal: name });
  };

  const adminLayout = {
    portalName: selectedPortal,
    navItems: adminNavItems,
    activeNav,
    onNavChange: handleAdminNavChange,
    onLogout: handleLogout,
  };

  const partnerLayout = {
    portalName: selectedPortal,
    navItems: partnerNavItems,
    activeNav,
    onNavChange: handlePartnerNavChange,
    onLogout: handleLogout,
  };

  if (location.pathname === "/create-password") {
    return <CreatePassword />;
  }

  if (location.pathname === "/forgot-password") {
    return <ForgetPassword />;
  }

  if (!isLoggedIn) {
    return (
      <Authentication
        onLoginSuccess={(user) => {
          const name = typeof user === "string" ? user : user?.name;
          const role = typeof user === "object" ? user?.role || "" : "";
          const centre = typeof user === "object" ? user?.centre ?? null : null;
          setUserName(name || "Administrator");
          setUserCentre(centre);
          setUserRole(role);
          setSelectedPortal("");
          setSession({
            name: name || "Administrator",
            role,
            centre,
            portal: "",
          });
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
                selectPortal(name);
                navigate("/dashboard");
                return;
              }

              if (canEnterPartnerDashboard(userRole)) {
                selectPortal(name);
                navigate("/partner/dashboard");
              }
            }}
          />
        }
      />

      {/* Admin routes */}
      <Route path="/dashboard" element={<Dashboard {...adminLayout} userName={userName} />} />
      <Route path="/attendance" element={<AdminAttendance {...adminLayout} />} />
      <Route path="/analytics" element={<AdminAnalytics {...adminLayout} />} />
      <Route path="/users" element={<AdminUser {...adminLayout} />} />
      <Route path="/students" element={<Student {...adminLayout} />} />
      <Route
        path="/announcements"
        element={<AdminAnnouncements {...adminLayout} userName={userName} />}
      />

      {/* HCL Partner routes (no Users page) */}
      <Route path="/partner/dashboard" element={<HCLPartnerDashboard {...partnerLayout} userName={userName} />} />
      <Route path="/partner/attendance" element={<HCLPartnerAttendance {...partnerLayout} />} />
      <Route path="/partner/analytics" element={<HCLPartnerAnalytics {...partnerLayout} />} />
      <Route path="/partner/students" element={<PartnerStudents {...partnerLayout} />} />
      <Route
        path="/partner/announcements"
        element={<HCLPartnerAnnouncements {...partnerLayout} userName={userName} />}
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
