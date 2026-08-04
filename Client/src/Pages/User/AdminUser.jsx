import { useCallback, useEffect, useMemo, useState } from "react";
import { Shield, GraduationCap, HeartHandshake } from "lucide-react";

import UserFilter from "../../Components/User/UserFilter";
import UserToolbar from "../../Components/User/UserToolbar";
import UserTable from "../../Components/User/UserTable";
import { MainLayout } from "../../Components/MainLayout";
import { createUser, fetchUsers, removeUser, resendInvite } from "../../services/users";
import { matchesPortalCentre } from "../../utils/portalMapping";
import { getApiErrorMessage } from "../../utils/apiRequest";
import { getInitials } from "../../utils/studentMetrics";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

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

const normalizeUser = (user) => ({
  ...user,
  role: user.role?.toUpperCase() || user.role,
  avatar: getInitials(user.name),
});

export default function AdminUser({ portalName, navItems, activeNav, onNavChange, onLogout }) {
  const [activeFilter, setActiveFilter] = useState("All Users");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submittingUser, setSubmittingUser] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [passwordSetupLink, setPasswordSetupLink] = useState("");
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  useEscapeToClose(() => setUserToDelete(null), Boolean(userToDelete) && !deletingUser);

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchUsers();
      setUsers(data.map(normalizeUser));
      setUsersError("");
    } catch (error) {
      console.error("Fetch Users Error:", error);
      setUsersError(getApiErrorMessage(error, "Unable to load users from the database"));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const isVisibleOnPortal = useCallback(
    (user) => user.role === "ADMIN" || matchesPortalCentre(user.centre, portalName),
    [portalName]
  );

  const visibleUsers = useMemo(
    () => users.filter(isVisibleOnPortal),
    [users, isVisibleOnPortal]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return visibleUsers.filter((user) => {
      const matchesRole = activeFilter === "All Users" || user.role === activeFilter;
      const matchesSearch =
        !q ||
        (user.name || "").toLowerCase().includes(q) ||
        (user.email || "").toLowerCase().includes(q) ||
        (user.phone || "").toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [visibleUsers, activeFilter, search]);

  const roleCount = (role) =>
    role === "All Users"
      ? visibleUsers.length
      : visibleUsers.filter((user) => user.role === role).length;

  const handleAddUser = async (newUser) => {
    setSubmittingUser(true);
    setUsersError("");
    setPasswordSetupLink("");

    try {
      const result = await createUser(newUser);
      const normalizedUser = normalizeUser(result.user);
      setUsers((prev) => [...prev, normalizedUser]);
      setActiveFilter(normalizedUser.role);
      setSearch("");

      if (!result.emailSent) {
        setUsersError(
          result.emailError
            ? `User saved, but email failed: ${result.emailError}`
            : "User saved, but the welcome email was not sent."
        );
        if (result.passwordSetupLink) {
          setPasswordSetupLink(result.passwordSetupLink);
        }
      }

      return true;
    } catch (error) {
      console.error("Create User Error:", error);
      throw new Error(getApiErrorMessage(error, "Unable to save the user to the database"), {
        cause: error,
      });
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleDeleteUser = (user) => {
    setUsersError("");
    setUserToDelete(user);
  };
  const handleResendInvite = async (user) => {
  setUsersError("");
  try {
    const result = await resendInvite(user.id);
    setUsersError(result.emailSent ? "" : result.message || "Could not resend invite");
  } catch (error) {
    console.error("Resend Invite Error:", error);
    setUsersError(getApiErrorMessage(error, "Unable to resend invite right now"));
  }
};

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setDeletingUser(true);
    setUsersError("");

    try {
      await removeUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error) {
      console.error("Delete User Error:", error);
      setUsersError(getApiErrorMessage(error, "Unable to delete the user right now"));
      setUserToDelete(null);
    } finally {
      setDeletingUser(false);
    }
  };

  return (
    <MainLayout
      portalName={portalName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
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
          onAddUser={handleAddUser}
          submittingUser={submittingUser}
          portalName={portalName}
        />

        {usersError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{usersError}</p>
            {passwordSetupLink ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-white px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Password setup link
                </p>
                <p className="mt-1 break-all text-slate-700">{passwordSetupLink}</p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(passwordSetupLink);
                    } catch (error) {
                      console.error("Copy failed:", error);
                    }
                  }}
                  className="mt-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Copy link
                </button>
              </div>
            ) : null}
          </div>
        )}

        <UserTable
          users={filtered}
          allUsersCount={roleCount("All Users")}
          roleBadge={roleBadge}
          avatarColor={avatarColor}
          onDeleteUser={handleDeleteUser}
          onResendInvite={handleResendInvite}
          loading={loadingUsers}
        />
      </div>

      {userToDelete ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
            <h3 className="text-xl font-bold text-slate-900">Delete User?</h3>
            <p className="mt-3 text-sm text-slate-600">
              Are you sure you want to delete the user{" "}
              <strong className="text-slate-900">{userToDelete.name}</strong>?
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deletingUser}
                className="rounded-2xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={deletingUser}
                className="rounded-2xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletingUser ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
}
