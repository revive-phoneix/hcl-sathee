import { useEffect, useMemo, useState } from "react";
import { CalendarDays, TrendingUp, Users, GraduationCap } from "lucide-react";

import { MainLayout } from "../../Components/MainLayout";
import { StatCard } from "../../Components/Dashboard/StatCard";
import { WelcomeBanner } from "../../Components/Dashboard/WelcomeBanner";
import { AttendanceChart } from "../../Components/Dashboard/AttendanceChart";
import { QuickActions } from "../../Components/Dashboard/QuickActions";
import { ExamProgress } from "../../Components/Dashboard/ExamProgress";
import { fetchStudentPerformance } from "../../services/studentPerformance";
import { matchesPortalCentre } from "../../utils/portalMapping";
import {
  average,
  getStudentAttendanceRates,
  getStudentProgressRates,
} from "../../utils/studentMetrics";

const formatCount = (value) => value.toLocaleString("en-IN");
const formatPercent = (value) => (value == null ? "—" : `${value.toFixed(1)}%`);

const STAT_CARDS = (stats, loadingStats) => [
  { icon: GraduationCap, label: "Total Students", value: formatCount(stats.totalStudents), iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
  { icon: Users, label: "Active Today", value: formatCount(stats.activeToday), iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
  { icon: CalendarDays, label: "Today's Attendance", value: formatPercent(stats.attendanceAvg), iconBg: "bg-violet-500/10", iconColor: "text-violet-400" },
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

  const stats = useMemo(() => {
    const centreStudents = students.filter((student) =>
      matchesPortalCentre(student.centre, portalName)
    );

    const attendanceRates = centreStudents.flatMap(getStudentAttendanceRates);
    const progressRates = centreStudents.flatMap(getStudentProgressRates);
    const activeToday = centreStudents.filter(
      (student) => getStudentAttendanceRates(student).length > 0
    ).length;

    return {
      totalStudents: centreStudents.length,
      activeToday,
      attendanceAvg: average(attendanceRates),
      progressAvg: average(progressRates),
      centreStudents,
    };
  }, [students, portalName]);


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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {STAT_CARDS(stats, loadingStats).map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AttendanceChart />
          <ExamProgress students={stats.centreStudents} loading={loadingStats} />
        </div>

        <div className="h-8" />
      </div>
    </MainLayout>
  );
}
