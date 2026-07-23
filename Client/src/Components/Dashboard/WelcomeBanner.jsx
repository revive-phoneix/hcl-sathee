import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";

export function WelcomeBanner({ portalName, userName }) {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formattedLastLogin = useMemo(() => {
    return currentTime.toLocaleString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, [currentTime]);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-[#3B82F6]/30 bg-[#0F172A]">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7599bd] via-[#b5bdd1] to-[#ffffff]/30" />

      <div className="relative px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">👋</span>
            <h1 className="text-black text-3xl font-bold tracking-tight">
              Welcome Back, {userName || "Administrator"}
            </h1>
          </div>

          <p className="text-black text-lg font-medium">
            {portalName ? `${portalName} Portal` : "HCL SATHEE Portal"}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-[#121314]">
            <Clock size={18} />
            <span>Last Login: {formattedLastLogin}</span>
          </div>

          <div className="flex items-center gap-2 text-emerald-900">
            <div className="w-2 h-2 bg-emerald-900 rounded-full animate-pulse" />
            <span>Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
