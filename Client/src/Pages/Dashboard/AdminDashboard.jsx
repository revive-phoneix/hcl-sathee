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

export default function AdminDashboard({
  portalName,
  userName,
  navItems,
  activeNav,
  onNavChange,
  onLogout,
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
    >
      <div className="max-w-7xl mx-auto space-y-8">
        <WelcomeBanner portalName={portalName} userName={userName} />

        <QuickActions
          onViewStudents={() => onNavChange(4)}
          onViewAttendance={() => onNavChange(1)}
        />

        {statsError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {statsError}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={GraduationCap}
            label="Total Students"
            value={formatCount(stats.totalStudents)}
            loading={loadingStats}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-400"
          />
          <StatCard
            icon={Users}
            label="Active Today"
            value={formatCount(stats.activeToday)}
            loading={loadingStats}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-400"
          />
          <StatCard
            icon={CalendarDays}
            label="Today's Attendance"
            value={formatPercent(stats.attendanceAvg)}
            loading={loadingStats}
            iconBg="bg-violet-500/10"
            iconColor="text-violet-400"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg. Progress"
            value={formatPercent(stats.progressAvg)}
            loading={loadingStats}
            iconBg="bg-amber-500/10"
            iconColor="text-amber-400"
          />
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
