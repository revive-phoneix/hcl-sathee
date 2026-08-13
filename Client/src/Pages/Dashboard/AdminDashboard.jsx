import { useEffect, useMemo, useState } from "react";

import { MainLayout } from "../../Components/MainLayout";
import { WelcomeBanner } from "../../Components/Dashboard/WelcomeBanner";
import { AttendanceChart } from "../../Components/Dashboard/AttendanceChart";
import { StudentsByCourseChart } from "../../Components/Dashboard/StudentsByCourseChart";
import { QuickActions } from "../../Components/Dashboard/QuickActions";
import { ExamProgress } from "../../Components/Dashboard/ExamProgress";
import { fetchStudentPerformance } from "../../services/studentPerformance";
import { fetchAttendanceSummary } from "../../services/dailySubjectAttendance";
import { matchesPortalCentre } from "../../utils/portalMapping";

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

    return {
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

        <StudentsByCourseChart students={stats.centreStudents} loading={loadingStats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AttendanceChart portalName={portalName} />
          <ExamProgress students={stats.centreStudents} loading={loadingStats} />
        </div>

        <div className="h-8" />
      </div>
    </MainLayout>
  );
}