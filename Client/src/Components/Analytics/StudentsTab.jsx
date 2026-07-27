import { useEffect, useMemo, useState } from "react";
import { fetchStudentPerformance } from "../../services/studentPerformance";
import { matchesPortalCentre } from "../../utils/portalMapping";
import { average, getStudentProgressRates } from "../../utils/studentMetrics";
import { performanceBadge, tableHeadRowClass, zebraRowClass } from "./analyticsUi";

const PASS_MARK = 40;

const getPerformanceLabel = (avg) => {
  if (avg >= 75) return "Excellent";
  if (avg >= 65) return "Good";
  if (avg >= 50) return "Average";
  return "Needs Improvement";
};

const round1 = (value) => Math.round(value * 10) / 10;

const STATUS_PANEL = {
  loading: {
    className: "rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500",
    message: "Loading student analytics…",
  },
  empty: {
    className: "rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500",
    message: "No students found for this centre.",
  },
};

const HIGHLIGHT_THEMES = {
  high: {
    card: "bg-blue-50 border-blue-100",
    iconWrap: "bg-blue-100",
    label: "text-blue-500",
    score: "text-blue-700",
    suffix: "text-blue-500",
    badge: "bg-blue-200 text-blue-800",
    name: "text-blue-600",
    meta: "text-blue-400",
    courseLabel: "text-blue-500",
    courseValue: "text-blue-700",
    empty: "text-blue-500",
    title: "Highest Student Marks",
    icon: "🏆",
  },
  low: {
    card: "bg-blue-50 border-blue-100",
    iconWrap: "bg-red-100",
    label: "text-red-500",
    score: "text-red-600",
    suffix: "text-red-400",
    badge: "bg-red-100 text-red-700 border border-red-200",
    name: "text-red-600",
    meta: "text-red-600",
    courseLabel: "text-red-500",
    courseValue: "text-red-600",
    empty: "text-red-500",
    title: "Lowest Student Marks",
    icon: "📉",
  },
};

function StatusPanel({ kind, message }) {
  if (kind === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center text-sm text-red-600">
        {message}
      </div>
    );
  }

  const panel = STATUS_PANEL[kind];
  return <div className={panel.className}>{message ?? panel.message}</div>;
}

function StudentHighlightCard({ theme, entry }) {
  const t = HIGHLIGHT_THEMES[theme];

  return (
    <div className={`${t.card} rounded-2xl p-6 shadow-sm border flex gap-5`}>
      <div className={`flex-shrink-0 w-14 h-14 rounded-xl ${t.iconWrap} flex items-center justify-center text-2xl`}>
        {t.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${t.label} uppercase tracking-wider mb-2`}>
          {t.title}
        </p>
        {entry ? (
          <>
            <div className="flex items-end gap-3 mb-3">
              <span className={`text-4xl font-extrabold ${t.score}`}>{round1(entry.avg)}</span>
              <span className={`text-lg font-semibold ${t.suffix} mb-1`}>/ 100</span>
              <span className={`ml-auto text-sm font-semibold ${t.badge} px-2.5 py-0.5 rounded-full`}>
                {round1(entry.avg)}%
              </span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className={`${t.name} font-medium`}>{entry.student.name}</span>
                <span className={`${t.meta} text-xs`}>{entry.student.studentId || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className={t.courseLabel}>Course</span>
                <span className={`${t.courseValue} font-semibold`}>{entry.student.course || "—"}</span>
              </div>
            </div>
          </>
        ) : (
          <p className={`text-sm ${t.empty}`}>No marks recorded yet.</p>
        )}
      </div>
    </div>
  );
}

export default function StudentsTab({ portalName }) {
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
        console.error("Analytics students error:", loadError);
        if (!isMounted) return;
        setError("Unable to load student analytics");
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

  const { courseRows, highestStudent, lowestStudent } = useMemo(() => {
    const centreStudents = students.filter((student) =>
      matchesPortalCentre(student.centre, portalName)
    );

    const studentsWithScores = centreStudents
      .map((student) => {
        const scores = getStudentProgressRates(student);
        return { student, avg: average(scores) };
      })
      .filter((entry) => entry.avg != null);

    const rankedByAvg = [...studentsWithScores].sort((a, b) => b.avg - a.avg);

    const byCourse = new Map();
    for (const student of centreStudents) {
      const course = (student.course || "Unassigned").trim() || "Unassigned";
      if (!byCourse.has(course)) byCourse.set(course, []);
      byCourse.get(course).push(student);
    }

    const rows = Array.from(byCourse.entries())
      .map(([course, courseStudents]) => {
        const allScores = courseStudents.flatMap(getStudentProgressRates);
        const studentAverages = courseStudents
          .map((student) => average(getStudentProgressRates(student)))
          .filter((value) => value != null);

        const avg = average(allScores);
        const highestMark = allScores.length ? Math.max(...allScores) : null;
        const lowestMark = allScores.length ? Math.min(...allScores) : null;
        const passCount = studentAverages.filter((value) => value >= PASS_MARK).length;
        const pass = studentAverages.length
          ? Math.round((passCount / studentAverages.length) * 100)
          : 0;

        return {
          Course: course,
          students: courseStudents.length,
          avg: avg == null ? "—" : round1(avg),
          highest: highestMark == null ? "—" : round1(highestMark),
          lowest: lowestMark == null ? "—" : round1(lowestMark),
          pass,
          performance: avg == null ? "—" : getPerformanceLabel(avg),
        };
      })
      .sort((a, b) => a.Course.localeCompare(b.Course));

    return {
      courseRows: rows,
      highestStudent: rankedByAvg[0] || null,
      lowestStudent: rankedByAvg[rankedByAvg.length - 1] || null,
    };
  }, [students, portalName]);

  if (loading) return <StatusPanel kind="loading" />;
  if (error) return <StatusPanel kind="error" message={error} />;
  if (!courseRows.length) return <StatusPanel kind="empty" />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        <StudentHighlightCard theme="high" entry={highestStudent} />
        <StudentHighlightCard theme="low" entry={lowestStudent} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Overall Centre Progress</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Performance summary across all streams for this centre
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={tableHeadRowClass}>
                {[
                  ["Course", "text-left px-6"],
                  ["Students Count", "text-center px-4"],
                  ["Avg", "text-center px-4"],
                  ["Highest", "text-center px-4"],
                  ["Lowest", "text-center px-4"],
                  ["Pass %", "text-center px-4"],
                  ["Performance", "text-center px-6"],
                ].map(([label, alignPad]) => (
                  <th
                    key={label}
                    className={`${alignPad} py-3.5 text-xs font-semibold text-gray-700 uppercase`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courseRows.map((row, i) => (
                <tr key={row.Course} className={zebraRowClass(i)}>
                  <td className="px-6 py-4 font-semibold text-gray-900">{row.Course}</td>
                  <td className="px-4 py-4 text-center font-semibold text-gray-800">👤 {row.students}</td>
                  <td className="px-4 py-4 text-center text-gray-700">{row.avg}</td>
                  <td className="px-4 py-4 text-center font-medium text-green-700">{row.highest}</td>
                  <td className="px-4 py-4 text-center font-medium text-red-600">{row.lowest}</td>
                  <td className="px-4 py-4 text-center font-semibold text-gray-800">{row.pass}%</td>
                  <td className="px-6 py-4 text-center">
                    {row.performance === "—" ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${performanceBadge(row.performance)}`}>
                        {row.performance}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
