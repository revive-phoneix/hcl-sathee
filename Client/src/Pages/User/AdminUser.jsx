import { useCallback, useEffect, useMemo, useState } from "react";
import { Shield, GraduationCap, HeartHandshake } from "lucide-react";

import UserFilter from "../../Components/User/UserFilter";
import UserToolbar from "../../Components/User/UserToolbar";
import UserTable from "../../Components/User/UserTable";
import { MainLayout } from "../../Components/MainLayout";
import { createUser, fetchUsers, removeUser } from "../../services/users";
import { matchesPortalCentre } from "../../utils/portalMapping";

const ROLE_FILTERS = ["All Users", "ADMIN", "SATHEE MITRA", "HCL PARTNER"];

const roleBadge = {
  ADMIN: { bg: "bg-blue-100 text-blue-700 border border-blue-200", icon: <Shield size={11} className="inline mr-1" /> },
  "SATHEE MITRA": { bg: "bg-emerald-100 text-emerald-700 border border-emerald-200", icon: <GraduationCap size={11} className="inline mr-1" /> },
  "HCL PARTNER": { bg: "bg-purple-100 text-purple-700 border border-purple-200", icon: <HeartHandshake size={11} className="inline mr-1" /> },
};

const avatarColor = {
  ADMIN: "bg-blue-600",
  "SATHEE MITRA": "bg-emerald-600",
  "HCL PARTNER": "bg-purple-600",
};

const getAvatar = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const normalizeUser = (user) => ({
  ...user,
  role: user.role?.toUpperCase() || user.role,
  avatar: getAvatar(user.name),
});

export default function AdminUser({ portalName, navItems, activeNav, onNavChange }) {
  const [activeFilter, setActiveFilter] = useState("All Users");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submittingUser, setSubmittingUser] = useState(false);
  const [usersError, setUsersError] = useState("");

  const loadUsers = useCallback(async ({ showRefreshSpinner = false } = {}) => {
    if (showRefreshSpinner) {
      setRefreshing(true);
      setUsersError("");
    }

    try {
      const data = await fetchUsers();
      setUsers(data.map(normalizeUser));
      setUsersError("");
    } catch (error) {
      console.error("Fetch Users Error:", error);
      setUsersError(
        error.response?.data?.message || "Unable to load users from the database"
      );
    } finally {
      setLoadingUsers(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      // Admins are visible on every portal; others only on their centre
      const matchesPortal =
        u.role === "ADMIN" || matchesPortalCentre(u.centre, portalName);
      const matchesRole = activeFilter === "All Users" || u.role === activeFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q);
      return matchesPortal && matchesRole && matchesSearch;
    });
  }, [users, activeFilter, search, portalName]);

  const roleCount = (role) => {
    const visibleUsers = users.filter(
      (u) => u.role === "ADMIN" || matchesPortalCentre(u.centre, portalName)
    );
    return role === "All Users"
      ? visibleUsers.length
      : visibleUsers.filter((u) => u.role === role).length;
  };

  const handleAddUser = async (newUser) => {
    setSubmittingUser(true);
    setUsersError("");

    try {
      const savedUser = await createUser(newUser);
      const normalizedUser = normalizeUser(savedUser);
      setUsers((prev) => [...prev, normalizedUser]);
      setActiveFilter(normalizedUser.role);
      setSearch("");
      return true;
    } catch (error) {
      console.error("Create User Error:", error);
      throw new Error(
        error.response?.data?.message || "Unable to save the user to the database",
        { cause: error }
      );
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await removeUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      console.error("Delete User Error:", error);
      setUsersError(
        error.response?.data?.message || "Unable to delete the user right now"
      );
    }
  };

  return (
    <MainLayout
      portalName={portalName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={onNavChange}
    >
      <div className="max-w-7xl mx-auto px-2 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users &amp; Roles</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage portal users and view their assigned roles.
          </p>
        </div>

        <UserFilter
          filters={ROLE_FILTERS}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          roleCount={roleCount}
        />

        <UserToolbar
          search={search}
          setSearch={setSearch}
          refreshing={refreshing}
          handleRefresh={() => loadUsers({ showRefreshSpinner: true })}
          onAddUser={handleAddUser}
          submittingUser={submittingUser}
          portalName={portalName}
        />

        {usersError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {usersError}
          </div>
        )}

        <UserTable
          users={filtered}
          allUsersCount={roleCount("All Users")}
          roleBadge={roleBadge}
          avatarColor={avatarColor}
          onDeleteUser={handleDeleteUser}
          loading={loadingUsers}
        />
      </div>
    </MainLayout>
  );
}
