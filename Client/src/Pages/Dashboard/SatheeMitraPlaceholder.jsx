import { MainLayout } from "../../Components/MainLayout";

/** Temporary heading-only pages until Mitra-specific designs are ready. */
export default function SatheeMitraPlaceholder({
  title,
  portalName,
  navItems,
  activeNav,
  onNavChange,
  onLogout,
  roleLabel = "Sathee Mitra Portal",
}) {
  return (
    <MainLayout
      portalName={portalName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
      roleLabel={roleLabel}
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          This page will be available in a future update.
        </p>
      </div>
    </MainLayout>
  );
}
