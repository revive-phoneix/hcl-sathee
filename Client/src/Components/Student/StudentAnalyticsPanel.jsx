import { useMemo } from "react";
import { average, parsePercentValue, getProgressColor } from "../../utils/studentMetrics";
import { resolveEnrolledSubjects } from "../../utils/courseSubjects";
import { BarListChart, EmptyDataCard } from "../Analytics/AnalyticsCharts";

const formatOneDecimal = (value) => Math.round(value * 10) / 10;

const formatDateLabel = (value) => {
  if (!value) return "Recent";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
};

export default function StudentAnalyticsPanel({ student }) {
  const { attendanceRows, performanceRows, overallAttendance, overallPerformance, subjects } = useMemo(() => {
    if (!student) {
      return {
        attendanceRows: [],
        performanceRows: [],
        overallAttendance: null,
        overallPerformance: null,
        subjects: [],
      };
    }

    const resolvedSubjects = resolveEnrolledSubjects(student.course, student.subjects);

    const attendanceRowsValue = resolvedSubjects.map((subject) => {
      const value = parsePercentValue(student.attendance?.[subject]);
      return {
        label: subject,
        value: value == null ? null : formatOneDecimal(value),
        helper: value == null ? "no data exists" : "subject attendance",
      };
    });

    const attendanceValues = attendanceRowsValue
      .map((entry) => entry.value)
      .filter((value) => value != null);
    const overall = average(attendanceValues);

    // Test mark subject percentages
    const performanceRowsValue = resolvedSubjects.map((subject) => {
      const testPercentage = student.subjectPercentages?.[subject];
      const value = testPercentage == null ? null : formatOneDecimal(testPercentage);
      return {
        label: subject,
        value,
        helper: value == null ? "no test marks" : "test performance %",
        isTestMark: true,
      };
    });

    // Also include performance records for fallback
    const performanceEntries = Array.isArray(student.performances) ? [...student.performances] : [];
    performanceEntries.sort((left, right) => {
      const leftTime = new Date(left?.created_at || left?.updated_at || 0).getTime();
      const rightTime = new Date(right?.created_at || right?.updated_at || 0).getTime();
      return rightTime - leftTime;
    });

    // Only add non-test records if no test marks exist
    if (!performanceRowsValue.some((row) => row.value != null)) {
      performanceEntries.slice(0, 5).forEach((record, index) => {
        const marks = parsePercentValue(record?.marks);
        const maxMarks = parsePercentValue(record?.maxMarks) || 100;
        const value = marks == null ? null : Math.min(100, (marks / maxMarks) * 100);

        performanceRowsValue.push({
          label: `${record?.subject || `Test ${index + 1}`}`,
          value: value == null ? null : formatOneDecimal(value),
          helper: record?.created_at ? formatDateLabel(record.created_at) : "no data exists",
          isTestMark: false,
        });
      });
    }

    return {
      attendanceRows: attendanceRowsValue,
      performanceRows: performanceRowsValue,
      overallAttendance: overall == null ? null : formatOneDecimal(overall),
      overallPerformance: student.overallPercentage != null ? formatOneDecimal(student.overallPercentage) : null,
      subjects: resolvedSubjects,
    };
  }, [student]);

  if (!student) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Student Analytics</p>
        <h3 className="mt-2 text-xl font-bold text-slate-900">{student.name}</h3>
        <p className="mt-1 text-sm text-slate-500">
          Course {student.course || "—"} · {subjects.length} subjects
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">Subjects</p>
            <p className="mt-2 text-2xl font-bold text-blue-700">{subjects.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Attendance</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">
              {overallAttendance == null ? "no data exists" : `${overallAttendance}%`}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">Performance</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">
              {overallPerformance == null ? "no data exists" : `${overallPerformance}%`}
            </p>
          </div>
        </div>
      </div>

      <BarListChart
        title="Attendance in All Subjects"
        subtitle="Subject-wise attendance percentages"
        items={attendanceRows}
        emptyMessage="no data exists"
        valueSuffix="%"
        valueFormatter={(value) => value}
        xAxisLabel="Attendance %"
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">Subject-wise Test Performance</h2>
          <p className="mt-1 text-sm text-slate-500">Test mark percentages for each enrolled subject</p>
        </div>

        {performanceRows.length ? (
          <div className="space-y-5">
            {performanceRows.map((item) => {
              const value = Number(item.value);
              const hasValue = Number.isFinite(value);
              const width = hasValue ? Math.max(6, Math.round((value / 100) * 100)) : 0;

              return (
                <div key={`${item.label}-${item.helper}`}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className={hasValue ? "font-semibold text-slate-900" : "font-medium text-slate-400"}>
                      {hasValue ? `${value}%` : "no data exists"}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    {hasValue ? (
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${width}%`, backgroundColor: getProgressColor(value) }}
                      />
                    ) : (
                      <div className="h-full w-1/3 rounded-full bg-slate-200" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{item.helper || "no data exists"}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyDataCard title="Student Progress" message="no data exists" subtitle="No test marks or performance records available." />
        )}
      </div>
    </div>
  );
}
