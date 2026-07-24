import { useState } from "react";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import HCLLogo from "../assets/HCL.svg";

export function MainLayout({
  portalName,
  navItems,
  activeNav,
  onNavChange,
  onLogout,
  roleLabel = "Admin Portal",
  children,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F1F5F9] font-sans text-white">
      <header className="h-16 flex items-center justify-between px-6 border-b border-[#3B82F6]/20 bg-[#5785d0] z-50">
        <div className="flex items-center gap-3">
          <img src={HCLLogo} alt="HCL Logo" className="w-9 h-9 object-contain" />
          <div>
            <p className="font-semibold tracking-tight text-black">
              {portalName ? `${portalName} PORTAL` : "HCL SATHEE"}
            </p>
            <p className="text-xs text-[#101011]">{roleLabel}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="bg-[#3B82F6] hover:bg-blue-600 px-6 py-2 rounded-2xl text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`hidden lg:flex flex-col border-r border-[#3B82F6]/20 bg-[#eef0f4] transition-all ${
            sidebarCollapsed ? "w-16" : "w-64"
          }`}
        >
          <div className="p-4 flex justify-end">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-[#030303] hover:text-white"
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          <nav className="flex-1 px-3 space-y-1">
            {navItems?.length ? (
              navItems.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => onNavChange?.(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-base transition-all ${
                    activeNav === i
                      ? "bg-black text-white font-semibold"
                      : "hover:bg-[#fbfcfd] text-[#423333]"
                  }`}
                >
                  <item.icon size={20} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              ))
            ) : (
              <p className="text-gray-500 px-4">No navigation items</p>
            )}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#F1F5F9]">{children}</main>
      </div>
    </div>
  );
}
