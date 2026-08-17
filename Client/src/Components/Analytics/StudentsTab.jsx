import { useEffect, useMemo, useState } from "react";
import { fetchStudentPerformance } from "../../services/studentPerformance";
import { fetchTestTypeProgress } from "../../services/testMarks";
import { matchesPortalCentre } from "../../utils/portalMapping";
import { average, getStudentProgressRates } from "../../utils/studentMetrics";
import { SerialNoCell, SerialNoHeader } from "../common/tableSerial";
import { tableHeadRowClass, zebraRowClass } from "./analyticsUi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";

const TEST_TYPE_OPTIONS = [
  { value: "performance", label: "Performance Test (Weekly)" },
  { value: "pre-mid", label: "Pre-Mid (Monthly)" },
];

const TEST_TYPE_GRAPH_META = {
  performance: {
    title: "Performance Test (Weekly)",
    subtitle: "Average weekly performance across the course",
    labels: ["Week 1", "Week 2", "Week 3"],
  },
  "pre-mid": {
    title: "Pre-Mid (Monthly)",
    subtitle: "Average pre-mid performance across the course",
    labels: ["Month 1", "Month 2", "Month 3"],
  },
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

function GraphPreviewModal({ course, testType, portalName, onClose }) {
  const meta = TEST_TYPE_GRAPH_META[testType];
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const resolvedCourse = String(course || "").trim();
    const resolvedType = String(testType || "").trim();

    if (!resolvedCourse || !resolvedType || !meta) {
      if (isMounted) {
        setSlots([]);
        setError("");
        setLoading(false);
      }
      return undefined;
    }

    setLoading(true);
    setError("");

    fetchTestTypeProgress(resolvedCourse, resolvedType, portalName)
      .then((data) => {
        if (!isMounted) return;
        const nextSlots = Array.isArray(data?.slots) ? data.slots : [];
        setSlots(nextSlots);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Unable to load test progress");
        setSlots([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [course, testType, portalName, meta]);

  if (!meta) return null;

  const chartData = (Array.isArray(slots) ? slots : []).map((slot, index) => ({
    label: slot?.label || meta.labels[index] || `Slot ${index + 1}`,
    average: typeof slot?.average === "number" ? slot.average : null,
    barValue: typeof slot?.average === "number" ? slot.average : 0,
    studentCount: Number(slot?.studentCount) || 0,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">{course}</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">{meta.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{meta.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-700">Average test percentage</p>
            <p className="text-xs text-slate-400">
              Averaged across every enrolled student's marks for each test — updates automatically as marks are entered.
            </p>
          </div>

          <div className="h-64 rounded-2xl border border-slate-200 bg-white p-4">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading…</div>
            ) : error ? (
              <div className="flex h-full items-center justify-center text-sm text-red-500">{error}</div>
            ) : !chartData.length ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No test data is available for this course and test type yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 24, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg">
                          <p className="font-semibold text-slate-900">{d.label}</p>
                          {d.average == null ? (
                            <p className="mt-1 text-slate-400">No percentage exists yet</p>
                          ) : (
                            <>
                              <p className="mt-1 text-slate-700">{d.average}% average</p>
                              <p className="text-slate-400">
                                {d.studentCount} student{d.studentCount === 1 ? "" : "s"}
                              </p>
                            </>
                          )}
                        </div>
                      );
                    }}
                    cursor={{ fill: "#EFF6FF" }}
                  />
                  <Bar dataKey="barValue" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out">
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.average == null ? "#E2E8F0" : "#3B82F6"} />
                    ))}
                    <LabelList
                      dataKey="average"
                      position="top"
                      formatter={(value) => (value == null ? "No percentage exists" : `${value}%`)}
                      style={{ fontSize: 11, fill: "#64748B" }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentsTab({ portalName }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTestTypes, setSelectedTestTypes] = useState({});
  const [activeGraph, setActiveGraph] = useState({ course: null, type: null });

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

        return {
          Course: course,
          students: courseStudents.length,
          avg: avg == null ? "—" : round1(avg),
          highest: highestMark == null ? "—" : round1(highestMark),
          lowest: lowestMark == null ? "—" : round1(lowestMark),
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
                <SerialNoHeader className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase" />
                {[
                  ["Course", "text-left px-6"],
                  ["Students Count", "text-center px-4"],
                  ["Avg", "text-center px-4"],
                  ["Highest", "text-center px-4"],
                  ["Lowest", "text-center px-4"],
                  ["View Graph", "text-center px-6"],
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
                  <SerialNoCell
                    index={i}
                    className="px-6 py-4 text-gray-500 font-medium tabular-nums"
                  />
                  <td className="px-6 py-4 font-semibold text-gray-900">{row.Course}</td>
                  <td className="px-4 py-4 text-center font-semibold text-gray-800">👤 {row.students}</td>
                  <td className="px-4 py-4 text-center text-gray-700">{row.avg}</td>
                  <td className="px-4 py-4 text-center font-medium text-green-700">{row.highest}</td>
                  <td className="px-4 py-4 text-center font-medium text-red-600">{row.lowest}</td>
                  <td className="px-6 py-4 text-center">
                    <select
                      value={selectedTestTypes[row.Course] || ""}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setSelectedTestTypes((prev) => ({
                          ...prev,
                          [row.Course]: nextValue,
                        }));

                        if (nextValue) {
                          setActiveGraph({ course: row.Course, type: nextValue });
                        }
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Select Type</option>
                      {TEST_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeGraph.course && activeGraph.type ? (
        <GraphPreviewModal
          course={activeGraph.course}
          testType={activeGraph.type}
          portalName={portalName}
          onClose={() => setActiveGraph({ course: null, type: null })}
        />
      ) : null}
    </div>
  );
}
