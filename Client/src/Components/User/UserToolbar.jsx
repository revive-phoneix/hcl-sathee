import { useState } from "react";
import { Search, Plus } from "lucide-react";
import NewUser from "./NewUser";

export default function UserToolbar({
  search,
  setSearch,
  onAddUser,
  submittingUser,
  portalName,
}) {
  const [showNewUser, setShowNewUser] = useState(false);

  const handleAddUser = async (newUser) => {
    if (await onAddUser(newUser)) setShowNewUser(false);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all shadow-sm"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setShowNewUser(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold
              hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-400/30 transition-all"
          >
            <Plus size={15} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {showNewUser && (
        <NewUser
          onClose={() => setShowNewUser(false)}
          onAddUser={handleAddUser}
          submittingUser={submittingUser}
          portalName={portalName}
        />
      )}
    </>
  );
}
