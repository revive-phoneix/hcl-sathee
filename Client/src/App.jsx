import { useEffect, useState } from "react";
import {
  BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation,
} from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, TrendingUp, Users, IdCard, Megaphone, UserCircle,
} from "lucide-react";

import Authentication from "./Pages/Auth/Authentication";
import CreatePassword from "./Components/Auth/CreatePassword";
import ForgetPassword from "./Components/Auth/ForgetPassword";
import CardSelector_1 from "./Pages/Selector/CardSelector_1";
import CardSelector_2 from "./Pages/Selector/CardSelector_2";
import Dashboard from "./Pages/Dashboard/AdminDashboard";
import HCLPartnerDashboard from "./Pages/Dashboard/HCLPartnerDashboard";
import SatheeMitraDashboard from "./Pages/Dashboard/SatheeMitraDashboard";
import AdminAttendance from "./Pages/Attendance/AdminAttendance";
import HCLPartnerAttendance from "./Pages/Attendance/HCLPartnerAttendance";
import SM_Attendance from "./Pages/Attendance/SM_Attendance";
import AdminUser from "./Pages/User/AdminUser";
import Student from "./Pages/Student/Student";
import PartnerStudents from "./Pages/Student/View";
import SM_Student from "./Pages/Student/SM_Student";
import AdminAnnouncements from "./Pages/Announcements/AdminAnnouncements";
import HCLPartnerAnnouncements from "./Pages/Announcements/HCLPartnerAnnouncements";
import SatheeMitraAnnouncements from "./Pages/Announcements/SatheeMitraAnnouncements";
import AdminAnalytics from "./Pages/Analytics/AdminAnalytics";
import HCLPartnerAnalytics from "./Pages/Analytics/HCLPartnerAnalytics";
import SM_Analytics from "./Pages/Analytics/SM_Analytics";
import MyProfile from "./Pages/Profile/MyProfile";
import {
  canAccessPortal,
  canEnterAdminDashboard,
  canEnterPartnerDashboard,
  canEnterSatheeMitraDashboard,
} from "./utils/portalMapping";
import { clearSession, getSession, setSession, updateSession } from "./utils/authSession";
import { getAuthPayload, getAuthToken } from "./utils/authToken";

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
  "/partner/profile": 5,
};

const PARTNER_NAV_PATHS = [
  "/partner/dashboard",
  "/partner/attendance",
  "/partner/analytics",
  "/partner/students",
  "/partner/announcements",
  "/partner/profile",
];

const MITRA_PATH_TO_NAV = {
  "/mitra/dashboard": 0,
  "/mitra/attendance": 1,
  "/mitra/analytics": 2,
  "/mitra/students": 3,
  "/mitra/announcements": 4,
  "/mitra/profile": 5,
};

const MITRA_NAV_PATHS = [
  "/mitra/dashboard",
  "/mitra/attendance",
  "/mitra/analytics",
  "/mitra/students",
  "/mitra/announcements",
  "/mitra/profile",
];

const ADMIN_PATHS = new Set(ADMIN_NAV_PATHS);
const PARTNER_PATHS = new Set(PARTNER_NAV_PATHS);
const MITRA_PATHS = new Set(MITRA_NAV_PATHS);

const readInitialSession = () => {
  if (!getAuthToken()) return null;
  const session = getSession();
  if (!session) return null;
  const tokenUser = getAuthPayload();
  // Backfill id/email from JWT when older sessions omitted them.
  if (tokenUser && (!session.email || session.id == null)) {
    const patched = {
      ...session,
      id: session.id ?? tokenUser.id,
      email: session.email || tokenUser.email || "",
      role: session.role || tokenUser.role || "",
      centre: session.centre ?? tokenUser.centre ?? null,
    };
    setSession(patched);
    return patched;
  }
  return session;
};

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialSession = readInitialSession();

  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialSession));
  const [userName, setUserName] = useState(initialSession?.name || "");
  const [userEmail, setUserEmail] = useState(initialSession?.email || "");
  const [userId, setUserId] = useState(initialSession?.id ?? null);
  const [userCentre, setUserCentre] = useState(initialSession?.centre ?? null);
  const [userRole, setUserRole] = useState(initialSession?.role || "");
  const [selectedPortal, setSelectedPortal] = useState(initialSession?.portal || "");

  useEffect(() => {
    if (!getAuthToken()) {
      clearSession();
      setIsLoggedIn(false);
      return;
    }
    const tokenUser = getAuthPayload();
    if (!tokenUser) return;

    setUserEmail((prev) => {
      if (prev) return prev;
      if (tokenUser.email) {
        updateSession({ email: tokenUser.email });
        return tokenUser.email;
      }
      return prev;
    });
    setUserId((prev) => {
      if (prev != null) return prev;
      if (tokenUser.id != null) {
        updateSession({ id: tokenUser.id });
        return tokenUser.id;
      }
      return prev;
    });
  }, []);

  const isAdmin = canEnterAdminDashboard(userRole);
  const isPartner = canEnterPartnerDashboard(userRole);
  const isMitra = canEnterSatheeMitraDashboard(userRole);

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
    { icon: UserCircle, label: "My Profile" },
  ];

  const mitraNavItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: CalendarDays, label: "Attendance Record" },
    { icon: TrendingUp, label: "Progress and Analytics" },
    { icon: IdCard, label: "Students" },
    { icon: Megaphone, label: "Announcements" },
    { icon: UserCircle, label: "My Profile" },
  ];

  const activeNav = isMitra
    ? MITRA_PATH_TO_NAV[location.pathname] ?? 0
    : isPartner
      ? PARTNER_PATH_TO_NAV[location.pathname] ?? 0
      : ADMIN_PATH_TO_NAV[location.pathname] ?? 0;

  const handleLogout = () => {
    clearSession();
    setIsLoggedIn(false);
    setUserName("");
    setUserEmail("");
    setUserId(null);
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

  const handleMitraNavChange = (index) => {
    const path = MITRA_NAV_PATHS[index];
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

  const mitraLayout = {
    portalName: selectedPortal,
    navItems: mitraNavItems,
    activeNav,
    onNavChange: handleMitraNavChange,
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
          const email = typeof user === "object" ? user?.email || "" : "";
          const id = typeof user === "object" ? user?.id ?? null : null;
          setUserName(name || "Administrator");
          setUserEmail(email);
          setUserId(id);
          setUserCentre(centre);
          setUserRole(role);
          setSelectedPortal("");
          setSession({
            id,
            name: name || "Administrator",
            email,
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

  if (MITRA_PATHS.has(location.pathname)) {
    if (!isMitra || !selectedPortal) {
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
                return;
              }

              if (canEnterSatheeMitraDashboard(userRole)) {
                selectPortal(name);
                navigate("/mitra/dashboard");
              }
            }}
          />
        }
      />

      <Route path="/dashboard" element={<Dashboard {...adminLayout} userName={userName} />} />
      <Route path="/attendance" element={<AdminAttendance {...adminLayout} />} />
      <Route path="/analytics" element={<AdminAnalytics {...adminLayout} />} />
      <Route path="/users" element={<AdminUser {...adminLayout} />} />
      <Route path="/students" element={<Student {...adminLayout} />} />
      <Route
        path="/announcements"
        element={<AdminAnnouncements {...adminLayout} userName={userName} />}
      />

      <Route path="/partner/dashboard" element={<HCLPartnerDashboard {...partnerLayout} userName={userName} />} />
      <Route path="/partner/attendance" element={<HCLPartnerAttendance {...partnerLayout} />} />
      <Route path="/partner/analytics" element={<HCLPartnerAnalytics {...partnerLayout} />} />
      <Route path="/partner/students" element={<PartnerStudents {...partnerLayout} />} />
      <Route
        path="/partner/announcements"
        element={<HCLPartnerAnnouncements {...partnerLayout} userName={userName} />}
      />
      <Route
        path="/partner/profile"
        element={
          <MyProfile
            {...partnerLayout}
            roleLabel="Partner Portal"
            userName={userName}
            userEmail={userEmail}
            userId={userId}
            userCentre={userCentre}
            userRole={userRole}
          />
        }
      />

      <Route path="/mitra/dashboard" element={<SatheeMitraDashboard {...mitraLayout} userName={userName} />} />
      <Route
        path="/mitra/attendance"
        element={
          <SM_Attendance
            {...mitraLayout}
            userName={userName}
            userEmail={userEmail}
            userId={userId}
            userCentre={userCentre}
          />
        }
      />
      <Route path="/mitra/analytics" element={<SM_Analytics {...mitraLayout} />} />
      <Route path="/mitra/students" element={<SM_Student {...mitraLayout} />} />
      <Route path="/mitra/announcements" element={<SatheeMitraAnnouncements {...mitraLayout} userName={userName} />} />
      <Route
        path="/mitra/profile"
        element={
          <MyProfile
            {...mitraLayout}
            roleLabel="Sathee Mitra Portal"
            userName={userName}
            userEmail={userEmail}
            userId={userId}
            userCentre={userCentre}
            userRole={userRole}
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
