import { useEffect, useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";

import { MainLayout } from "../../Components/MainLayout";
import { StatCard } from "../../Components/Dashboard/StatCard";
import { WelcomeBanner } from "../../Components/Dashboard/WelcomeBanner";
import { AttendanceChart } from "../../Components/Dashboard/AttendanceChart";
import { StudentsByCourseChart } from "../../Components/Dashboard/StudentsByCourseChart";
import { QuickActions } from "../../Components/Dashboard/QuickActions";
import { ExamProgress } from "../../Components/Dashboard/ExamProgress";
import { fetchStudentPerformance } from "../../services/studentPerformance";
import { fetchAttendanceSummary } from "../../services/dailySubjectAttendance";
import { matchesPortalCentre } from "../../utils/portalMapping";
import { average, getStudentProgressRates } from "../../utils/studentMetrics";

const formatPercent = (value) => (value == null ? "—" : `${value.toFixed(1)}%`);

const STAT_CARDS = (stats, loadingStats) => [
  { icon: TrendingUp, label: "Avg. Progress", value: formatPercent(stats.progressAvg), iconBg: "bg-amber-500/10", iconColor: "text-amber-400" },
].map((card) => ({ ...card, loading: loadingStats }));

export default function AdminDashboard({
  portalName,
  userName,
  navItems,
  activeNav,
  onNavChange,
  onLogout,
  readOnly = false,
  roleLabel = "Admin Portal",
  studentsNavIndex = 4,
  attendanceNavIndex = 1,
}) {
  const [students, setStudents] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [todaySummary, setTodaySummary] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      setLoadingStats(true);
      setStatsError("");

      try {
        const data = await fetchStudentPerformance();
        if (!isMounted) return;
        setStudents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Dashboard stats error:", error);
        if (!isMounted) return;
        setStatsError("Unable to load dashboard stats");
        setStudents([]);
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchAttendanceSummary({ period: "daily", centre: portalName })
      .then((data) => isMounted && setTodaySummary(data))
      .catch(() => isMounted && setTodaySummary(null));
    return () => {
      isMounted = false;
    };
  }, [portalName]);

  const stats = useMemo(() => {
    const centreStudents = students.filter((student) =>
      matchesPortalCentre(student.centre, portalName)
    );
    const progressRates = centreStudents.flatMap(getStudentProgressRates);

    return {
      totalStudents: centreStudents.length,
      progressAvg: average(progressRates),
      centreStudents,
    };
  }, [students, portalName, todaySummary]);

  return (
    <MainLayout
      portalName={portalName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
      roleLabel={roleLabel}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        <WelcomeBanner portalName={portalName} userName={userName} />

        <QuickActions
          readOnly={readOnly}
          portalName={portalName}
          onViewStudents={() => onNavChange(studentsNavIndex)}
          onViewAttendance={() => onNavChange(attendanceNavIndex)}
        />

        {statsError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {statsError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <StudentsByCourseChart students={stats.centreStudents} loading={loadingStats} />
          </div>
          <div className="grid grid-cols-1 gap-5">
            {STAT_CARDS(stats, loadingStats).map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AttendanceChart portalName={portalName} />
          <ExamProgress students={stats.centreStudents} loading={loadingStats} />
        </div>

        <div className="h-8" />
      </div>
    </MainLayout>
  );
}