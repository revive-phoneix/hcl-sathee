import { Trash2, Users as UsersIcon } from "lucide-react";

const UserTable = ({ users, allUsersCount, roleBadge, avatarColor, onDeleteUser, loading }) => {
  // Helper function to get role badge safely
  const getRoleBadge = (role) => {
    // If the role exists in roleBadge, use it
    if (roleBadge[role]) {
      return roleBadge[role];
    }
    
    // Fallback for unknown roles
    return {
      bg: "bg-gray-100 text-gray-700 border border-gray-200",
      icon: null
    };
  };

  // Helper function to get avatar color safely
  const getAvatarColor = (role) => {
    return avatarColor[role] || "bg-gray-600";
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      {/* Table Header */}
      <div
        className="grid gap-4 px-6 py-4 border-b"
        style={{
          gridTemplateColumns: "2fr 1.5fr 2.5fr 1.2fr 1fr",
          background: "#f1f5f9",
          color: "#374151",
          fontWeight: 700,
          fontSize: "13px",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}
      >
        {["Name", "Phone Number", "Email Address", "Role", "Actions"].map((col) => (
          <span key={col}>{col}</span>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-white">
            <p className="font-medium text-sm">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-white">
            <UsersIcon size={36} className="mb-3 opacity-30" />
            <p className="font-medium text-sm">No users found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          users.map((user, idx) => {
            // Safely get role badge and avatar color
            const badge = getRoleBadge(user.role);
            const avatarBg = getAvatarColor(user.role);
            
            return (
              <div
                key={user.id}
                className="grid gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors"
                style={{
                  gridTemplateColumns: "2fr 1.5fr 2.5fr 1.2fr 1fr",
                  background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                }}
              >
                {/* Name + Avatar */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm ${avatarBg}`}
                  >
                    {user.avatar}
                  </div>
                  <span className="text-sm font-semibold text-slate-900 truncate">
                    {user.name}
                  </span>
                </div>

                {/* Phone */}
                <span className="text-sm text-slate-600 truncate">{user.phone || "—"}</span>

                {/* Email */}
                <span className="text-sm text-blue-600 truncate font-mono text-[13px]">
                  {user.email}
                </span>

                {/* Role Badge */}
                <div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badge.bg}`}
                  >
                    {badge.icon}
                    {user.role}
                  </span>
                </div>

                {/* Delete Button */}
                <div>
                  <button
                    onClick={() => onDeleteUser(user)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    title="Delete user"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        className="px-6 py-3 flex items-center justify-between border-t bg-slate-50"
      >
        <p className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-700">{users.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{allUsersCount}</span> users
        </p>
      </div>
    </div>
  );
};

export default UserTable;