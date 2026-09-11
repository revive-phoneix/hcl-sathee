import { FileBarChart2 } from "lucide-react";
import { MainLayout } from "../../Components/MainLayout";

/**
 * Placeholder landing page for the "Centre Report" nav item. The report
 * content (Sathee Mitra / Vishist / Student attendance & performance) is
 * being designed separately — this keeps the sidebar link real (not a
 * dead nav item) until that's wired in.
 */
export default function CentreReport({
  portalName,
  navItems,
  activeNav,
  onNavChange,
  onLogout,
  roleLabel,
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
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-24 text-center text-slate-900">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
          <FileBarChart2 size={30} />
        </div>
        <h1 className="text-2xl font-bold">Centre Report</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          This section is being built. It will hold {portalName || "this centre"}&rsquo;s
          full report — Sathee Mitra, Sathee Vishist, and student attendance &amp; performance.
        </p>
      </div>
    </MainLayout>
  );
}
