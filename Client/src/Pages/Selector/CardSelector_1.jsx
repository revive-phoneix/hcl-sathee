import { ArrowUpRight } from "lucide-react";
import HCLLogo from "../../assets/HCL.svg";
import SatheeLogo from "../../assets/sathee.svg";

function HCLIcon() {
  return (
    <img
      src={HCLLogo}
      alt="HCL"
      style={{ width: "100%", height: "100%" }}
      className="h-full w-full rounded-xl object-cover"
    />
  );
}

function SatheeIcon() {
  return (
    <img
      src={SatheeLogo}
      alt="SATHEE"
      style={{ width: "100%", height: "100%" }}
      className="h-full w-full rounded-xl object-cover"
    />
  );
}

export default function DashboardSelect({ openHCLSathee }) {
  const cards = [
    {
      title: "HCL SATHEE",
      subtitle: "Open your internal HCL SATHEE analytics workspace",
      icon: HCLIcon,
      buttonText: "Open HCL SATHEE",
      onClick: openHCLSathee,
      badge: "Internal",
    },
    {
      title: "SATHEE",
      subtitle: "Go to the official SATHEE learning portal",
      icon: SatheeIcon,
      buttonText: "Visit SATHEE",
      onClick: () =>
        window.open(
          "https://sathee.iitk.ac.in/",
          "_blank",
          "noopener,noreferrer"
        ),
      badge: "External",
    },
    {
      title: "ADD NEW DASHBOARD",
      subtitle: "Create OR add a new custom dashboard",
      icon: ArrowUpRight,
      buttonText: "Add New Dashboard",
      onClick: () => {},
      badge: "External",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#94A3B8] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,.16),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,.12),transparent_40%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 lg:px-10 lg:py-14">
        <p className="inline-flex w-fit rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-4xs font-semibold uppercase tracking-wider text-black">
          Dashboard Selection
        </p>

        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
          Choose Your
          <span className="bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            {" "}
            Platform
          </span>
        </h1>

        <p className="mt-3 max-w-2xl text-sm-bold text-slate-400 sm:text-black">
          You are logged in successfully. Select where you want to continue.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:mt-10 lg:gap-7">
          {cards.map(
            ({ title, subtitle, icon: Icon, buttonText, onClick, badge }) => (
              <article
                key={title}
                className="group rounded-2xl border border-slate-700/70 bg-[#F1F5F9]/90 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_20px_70px_rgba(59,130,246,0.2)] lg:p-7 text-black"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20">
                    <Icon size={24} />
                  </div>

                  <span className="rounded-full border border-slate-600 bg-slate-800/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black">
                    {badge}
                  </span>
                </div>

                <h2 className="mt-5 text-2xl font-bold tracking-tight">
                  {title}
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-black">
                  {subtitle}
                </p>

                <button
                  type="button"
                  onClick={onClick}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/15 px-4 py-2.5 text-sm  font-semibold text-black transition hover:border-blue-400/60 hover:bg-blue-500/25"
                >
                  {buttonText}
                  <ArrowUpRight
                    size={18}
                    className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </button>
              </article>
            )
          )}
        </div>
      </div>
    </div>
  );
}
