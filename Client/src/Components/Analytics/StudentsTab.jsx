import { useEffect, useMemo, useState } from "react";
import { fetchStudentPerformance } from "../../services/studentPerformance";
import { fetchTestTypeProgress } from "../../services/testMarks";
import { matchesPortalCentre } from "../../utils/portalMapping";
import { average, getStudentProgressRates } from "../../utils/studentMetrics";
import { SerialNoCell, SerialNoHeader } from "../common/tableSerial";
import { tableHeadRowClass, zebraRowClass } from "./analyticsUi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
  ComposedChart, Line, Legend,
} from "recharts";

const TEST_TYPE_OPTIONS = [
  { value: "performance", label: "Performance Test (Weekly)" },
  { value: "pre-mid", label: "Pre-Mid (Monthly)" },
  { value: "mid", label: "Mid (in Six Months)" },
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
  mid: {
    title: "Mid (in Six Months)",
    subtitle: "Average mid performance across the course",
    labels: ["Mid 1", "Mid 2", "Mid 3"],
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

function StudentTrendGraphModal({ student, onClose }) {
  const chartData = useMemo(() => {
    if (!student?.tests?.length) return [];

    const subjectNames = [...new Set(student.tests.flatMap((test) => test.rows.map((row) => row.subject)))];

    return subjectNames.map((subject) => {
      const dataPoint = { subject };

      student.tests.forEach((test, index) => {
        const matchingRow = test.rows.find((row) => row.subject === subject);
        const key = `Test ${index + 1}`;
        dataPoint[key] = matchingRow?.obtained ?? 0;
      });

      const values = student.tests
        .map((test) => {
          const matchingRow = test.rows.find((row) => row.subject === subject);
          return matchingRow?.obtained ?? null;
        })
        .filter((value) => value != null && Number.isFinite(value));

      dataPoint.trend = values.length ? round1(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
      return dataPoint;
    });
  }, [student]);

  const testKeys = student?.tests?.map((_, index) => `Test ${index + 1}`) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">{student?.name || "Student"}</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">{student?.name || "Student"} — {student?.tests?.[0]?.title || "Performance Test"} Trend</h3>
            <p className="mt-1 text-sm text-slate-500">
              Bars show marks per subject per test — line traces the average trend across tests within each subject.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="h-[420px] rounded-2xl border border-slate-200 bg-slate-50 p-5">
          {!chartData.length ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No test trend data available for this student.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 18, right: 16, left: 8, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="subject" tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`${value}`, "Marks gained"]}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)" }}
                />
                <Legend />
                {testKeys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    name={key}
                    fill={index === 0 ? "#3B82F6" : index === 1 ? "#F59E0B" : "#94A3B8"}
                    radius={[6, 6, 0, 0]}
                    animationDuration={900}
                    animationEasing="ease-out"
                    maxBarSize={38}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="trend"
                  name="Trend"
                  stroke="#111827"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#111827", strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
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

export default function StudentsTab({ portalName, isCustomCentre = false }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTestTypes, setSelectedTestTypes] = useState({});
  const [activeGraph, setActiveGraph] = useState({ course: null, type: null });
  const [selectedStudentTrend, setSelectedStudentTrend] = useState(null);
  const [analyticsMode, setAnalyticsMode] = useState("overall");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [individualTestType, setIndividualTestType] = useState("");
  const [submittedIndividualQuery, setSubmittedIndividualQuery] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadStudents = async () => {
      // Skip loading for custom centres
      if (isCustomCentre) {
        setStudents([]);
        setLoading(false);
        return;
      }

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
  }, [isCustomCentre]);

  const centreStudents = useMemo(
    () => students.filter((student) => matchesPortalCentre(student.centre, portalName)),
    [students, portalName]
  );

  const courseOptions = useMemo(
    () => [...new Set(centreStudents.map((student) => (student.course || "").trim()).filter(Boolean))].sort(),
    [centreStudents]
  );

  const availableStudents = useMemo(() => {
    if (!selectedCourse) return centreStudents;
    return centreStudents.filter((student) => (student.course || "") === selectedCourse);
  }, [centreStudents, selectedCourse]);

  const individualReady = Boolean(selectedCourse && individualTestType && selectedStudentIds.length);

  const handleStudentToggle = (studentId) => {
    const normalizedId = String(studentId);
    setSelectedStudentIds((prev) =>
      prev.includes(normalizedId)
        ? prev.filter((id) => id !== normalizedId)
        : [...prev, normalizedId]
    );
  };

  const individualResults = useMemo(() => {
    if (!submittedIndividualQuery || !individualReady) return [];

    return availableStudents
      .filter((student) => selectedStudentIds.includes(String(student.id)))
      .map((student) => {
        const records = Array.isArray(student.testMarks)
          ? student.testMarks.filter(
              (mark) =>
                String(mark?.testType || "performance").trim().toLowerCase() ===
                  String(individualTestType).trim().toLowerCase()
            )
          : [];

        const sortedByDate = [...records].sort((left, right) => {
          const leftTime = new Date(left?.created_at || left?.updated_at || 0).getTime();
          const rightTime = new Date(right?.created_at || right?.updated_at || 0).getTime();
          return leftTime - rightTime;
        });

        const groupedByTest = new Map();
        for (const record of sortedByDate) {
          const testKey = String(record?.testId || "manual");
          if (!groupedByTest.has(testKey)) {
            groupedByTest.set(testKey, []);
          }
          groupedByTest.get(testKey).push(record);
        }

        const tests = [...groupedByTest.entries()].map(([testKey, testRecords], index) => {
          const subjectMap = new Map();
          for (const record of testRecords) {
            const subject = String(record?.subject || "").trim();
            if (!subject) continue;

            const current = subjectMap.get(subject);
            const currentTime = current ? new Date(current?.created_at || current?.updated_at || 0).getTime() : 0;
            const nextTime = new Date(record?.created_at || record?.updated_at || 0).getTime();
            if (!current || nextTime >= currentTime) {
              subjectMap.set(subject, record);
            }
          }

          const rows = [...subjectMap.entries()].map(([subject, record]) => {
            const obtained = Number(record?.marksObtained) || 0;
            const total = Number(record?.totalMarks) || 0;
            const percentage = total > 0 ? round1((obtained / total) * 100) : null;
            return {
              subject,
              obtained,
              total,
              percentage,
            };
          });

          const validPercentages = rows
            .map((row) => row.percentage)
            .filter((value) => value != null && Number.isFinite(value));
          const averageScore = validPercentages.length ? round1(average(validPercentages)) : null;
          const baseLabel = TEST_TYPE_OPTIONS.find((option) => option.value === individualTestType)?.label || "Test";
          const title = `${baseLabel.split(" (")[0]} ${index + 1}`;

          return {
            key: testKey,
            title,
            rows,
            averageScore,
          };
        });

        const progress = tests.slice(1).map((nextTest, index) => {
          const prevTest = tests[index];
          if (!prevTest || !nextTest) return null;

          const delta =
            nextTest.averageScore == null || prevTest.averageScore == null
              ? null
              : round1(nextTest.averageScore - prevTest.averageScore);

          return {
            fromTitle: prevTest.title,
            toTitle: nextTest.title,
            fromValue: prevTest.averageScore,
            toValue: nextTest.averageScore,
            delta,
          };
        }).filter(Boolean);

        return {
          id: student.id,
          name: student.name || "Student",
          studentId: student.studentId || "—",
          course: student.course || "—",
          tests,
          progress,
        };
      });
  }, [availableStudents, individualReady, individualTestType, selectedStudentIds, submittedIndividualQuery]);

  const { courseRows, highestStudent, lowestStudent } = useMemo(() => {
    const centreStudentsAvailable = centreStudents;

    const studentsWithScores = centreStudentsAvailable
      .map((student) => {
        const scores = getStudentProgressRates(student);
        return { student, avg: average(scores) };
      })
      .filter((entry) => entry.avg != null);

    const rankedByAvg = [...studentsWithScores].sort((a, b) => b.avg - a.avg);

    const byCourse = new Map();
    for (const student of centreStudentsAvailable) {
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
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Students</h2>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setAnalyticsMode("overall")}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition ${analyticsMode === "overall" ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:text-slate-900"}`}
          >
            Overall
          </button>
          <button
            type="button"
            onClick={() => setAnalyticsMode("individual")}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition ${analyticsMode === "individual" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            Individual
          </button>
        </div>
      </div>

      {analyticsMode === "overall" ? (
        <>
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
        </>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr_1fr_auto] lg:items-end">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    setSelectedStudentIds([]);
                    setSubmittedIndividualQuery(false);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select course</option>
                  {courseOptions.map((course) => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Students</label>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-300 bg-white p-2">
                  {!selectedCourse ? (
                    <p className="text-sm text-slate-400">Choose a course first</p>
                  ) : availableStudents.length === 0 ? (
                    <p className="text-sm text-slate-400">No students found</p>
                  ) : (
                    <div className="space-y-2">
                      {availableStudents.map((student) => {
                        const selected = selectedStudentIds.includes(String(student.id));
                        return (
                          <label
                            key={student.id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => {
                                handleStudentToggle(student.id);
                                setSubmittedIndividualQuery(false);
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">
                              {student.name}
                              {student.studentId ? ` (${student.studentId})` : ""}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Test Type</label>
                <select
                  value={individualTestType}
                  onChange={(e) => {
                    setIndividualTestType(e.target.value);
                    setSubmittedIndividualQuery(false);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select type</option>
                  {TEST_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSubmittedIndividualQuery(true)}
                disabled={!individualReady}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                Go
              </button>
            </div>
          </div>

          {selectedStudentTrend ? (
            <StudentTrendGraphModal
              student={selectedStudentTrend}
              onClose={() => setSelectedStudentTrend(null)}
            />
          ) : null}

          {submittedIndividualQuery && individualResults.length > 0 ? (
            <div className="space-y-5">
              {individualResults.map((student) => (
                <div key={student.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{student.name}</h3>
                      <p className="text-sm text-slate-500">{student.studentId} · {student.course}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentTrend(student)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View Graph
                    </button>
                  </div>

                  <div className="space-y-0">
                    {student.tests.length === 0 ? (
                      <div className="px-5 py-6 text-sm text-slate-500">No marks available for this student and test type.</div>
                    ) : (
                      student.tests.map((test, testIndex) => (
                        <div key={`${student.id}-${test.key}-${testIndex}`} className="border-b border-slate-200 last:border-b-0">
                          <div className="px-5 py-4">
                            <p className="mb-3 text-2xl font-bold text-blue-600">{test.title}</p>
                            {test.rows.length ? (
                              <div className="space-y-2">
                                {test.rows.map((row) => (
                                  <div key={`${test.key}-${row.subject}`} className="flex items-center justify-between gap-4 text-base text-slate-800">
                                    <span className="font-medium text-slate-700">{row.subject}</span>
                                    <span className="font-semibold text-slate-900">{row.obtained} / {row.total}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">No subject marks recorded.</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {student.progress?.length ? (
                    <div className="space-y-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                      {student.progress.map((item, index) => {
                        const isPositive = item.delta > 0;
                        const isNegative = item.delta < 0;
                        const toneClass = isPositive
                          ? "bg-green-100 border-green-200 text-green-700"
                          : isNegative
                            ? "bg-red-100 border-red-200 text-red-700"
                            : "bg-slate-100 border-slate-200 text-slate-700";
                        const valueClass = isPositive ? "text-green-700" : isNegative ? "text-red-700" : "text-slate-700";

                        return (
                          <div key={`${item.fromTitle}-${item.toTitle}-${index}`} className={`rounded-xl border ${toneClass} px-4 py-3`}>
                            <div className="flex items-center justify-between gap-4 text-base font-bold">
                              <span>
                                Progress: {item.fromTitle} → {item.toTitle}
                              </span>
                              <span className={valueClass}>
                                {item.fromValue != null ? `${item.fromValue.toFixed(1)}%` : "—"}
                                <span className="mx-2">→</span>
                                {item.toValue != null ? `${item.toValue.toFixed(1)}%` : "—"}
                                <span className="ml-2">({item.delta == null ? "—" : `${item.delta > 0 ? "+" : ""}${item.delta.toFixed(1)}%`})</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : submittedIndividualQuery ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No student data available for the selected filters.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
