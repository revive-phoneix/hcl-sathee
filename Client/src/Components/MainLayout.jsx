import { useEffect, useState } from "react";
import { LogOut, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import HCLLogo from "../assets/HCL.svg";

function NavButtons({
  navItems,
  activeNav,
  onNavChange,
  collapsed = false,
  onNavigate,
}) {
  if (!navItems?.length) {
    return <p className="text-gray-500 px-4">No navigation items</p>;
  }

  return navItems.map((item, i) => (
    <button
      key={item.label}
      type="button"
      onClick={() => {
        onNavChange?.(i);
        onNavigate?.();
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-base transition-all ${
        activeNav === i
          ? "bg-black text-white font-semibold"
          : "hover:bg-[#fbfcfd] text-[#423333]"
      }`}
    >
      <item.icon size={20} className="shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </button>
  ));
}

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileNavOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F1F5F9] font-sans text-white">
      <header className="h-16 flex items-center justify-between gap-3 px-4 sm:px-6 border-b border-[#3B82F6]/20 bg-[#5785d0] z-50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden shrink-0 rounded-xl bg-white/20 p-2 text-slate-900 hover:bg-white/30"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
          <img
            src={HCLLogo}
            alt="HCL Logo"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0"
          />
          <div className="min-w-0">
            <p className="font-semibold tracking-tight text-black truncate text-sm sm:text-base">
              {portalName ? `${portalName} PORTAL` : "HCL SATHEE"}
            </p>
            <p className="text-xs text-[#101011] truncate">{roleLabel}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="bg-[#3B82F6] hover:bg-blue-600 px-3 sm:px-6 py-2 rounded-2xl text-sm font-medium flex items-center gap-2 transition-colors shrink-0"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside
          className={`hidden lg:flex flex-col border-r border-[#3B82F6]/20 bg-[#eef0f4] transition-all ${
            sidebarCollapsed ? "w-16" : "w-64"
          }`}
        >
          <div className="p-4 flex justify-end">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-[#030303] hover:text-slate-700"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          <nav className="flex-1 px-3 space-y-1">
            <NavButtons
              navItems={navItems}
              activeNav={activeNav}
              onNavChange={onNavChange}
              collapsed={sidebarCollapsed}
            />
          </nav>
        </aside>

        {mobileNavOpen ? (
          <div className="lg:hidden fixed inset-0 z-[60]">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close navigation menu"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-[min(18rem,85vw)] bg-[#eef0f4] shadow-2xl flex flex-col">
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
                <p className="text-sm font-semibold text-slate-900">Menu</p>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-xl p-2 text-slate-700 hover:bg-white"
                  aria-label="Close navigation menu"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                <NavButtons
                  navItems={navItems}
                  activeNav={activeNav}
                  onNavChange={onNavChange}
                  onNavigate={() => setMobileNavOpen(false)}
                />
              </nav>
              <div className="p-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setMobileNavOpen(false);
                    onLogout?.();
                  }}
                  className="w-full rounded-2xl bg-[#3B82F6] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  <LogOut size={18} /> Logout
                </button>
              </div>
            </aside>
          </div>
        ) : null}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F1F5F9]">
          {children}
        </main>
      </div>
    </div>
  );
}
