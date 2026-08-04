import { useEffect, useMemo, useState } from "react";
import { fetchStudentPerformance } from "../../services/studentPerformance";
import { matchesPortalCentre } from "../../utils/portalMapping";
import { average, parsePercentValue } from "../../utils/studentMetrics";
import { BarChartCard, BarListChart, EmptyDataCard } from "./AnalyticsCharts";

const formatOneDecimal = (value) => Math.round(value * 10) / 10;

export default function PortalAnalyticsGraphs({ portalName }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadStudents = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchStudentPerformance();
        if (!isMounted) return;
        setStudents(Array.isArray(data) ? data : []);
      } catch (loadError) {
        console.error("Portal analytics graphs error:", loadError);
        if (!isMounted) return;
        setError("Unable to load analytics graphs");
        setStudents([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadStudents();
    return () => {
      isMounted = false;
    };
  }, []);

  const centreStudents = useMemo(
    () => students.filter((student) => matchesPortalCentre(student.centre, portalName)),
    [students, portalName]
  );

  const studentCountsByCourse = useMemo(() => {
    const byCourse = new Map();

    for (const student of centreStudents) {
      const course = String(student.course || "Unassigned").trim() || "Unassigned";
      byCourse.set(course, (byCourse.get(course) || 0) + 1);
    }

    return Array.from(byCourse.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [centreStudents]);

  const attendanceByPeriod = useMemo(() => {
    const periods = [
      { key: "dailyAttendancePercentage", label: "Daily Attendance" },
      { key: "weeklyAttendancePercentage", label: "Weekly Attendance" },
      { key: "monthlyAttendancePercentage", label: "Monthly Attendance" },
    ];

    return periods.map((period) => {
      const values = centreStudents.flatMap((student) =>
        (student.attendances || [])
          .map((row) => parsePercentValue(row?.[period.key]))
          .filter((value) => value != null)
      );

      const avg = average(values);

      return {
        label: period.label,
        value: avg == null ? null : formatOneDecimal(avg),
        helper: avg == null ? "no data exists" : `${values.length} subject records`,
      };
    });
  }, [centreStudents]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
        Loading graphs…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-12 text-center text-sm text-red-600 shadow-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <BarChartCard
          title="Students per Course"
          subtitle="Counts of enrolled students in each course for this portal"
          items={studentCountsByCourse}
          emptyMessage="no data exists"
          valueSuffix=""
          valueFormatter={(value) => value}
          yAxisLabel="Students"
          xAxisLabel="Course"
        />

        <BarListChart
          title="Centre Attendance"
          subtitle="Average attendance across all subject records"
          items={attendanceByPeriod}
          emptyMessage="no data exists"
          valueSuffix="%"
          valueFormatter={(value) => value}
          xAxisLabel="Attendance %"
        />
      </div>

      {!centreStudents.length ? (
        <EmptyDataCard
          title="Portal Analytics"
          message="no data exists"
          subtitle="No students were found for this portal."
        />
      ) : null}
    </div>
  );
}
