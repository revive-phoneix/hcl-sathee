import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileBarChart2, Loader2 } from "lucide-react";
import { MainLayout } from "../../Components/MainLayout";
import { fetchStudents } from "../../services/students";
import { fetchAttendanceDetail } from "../../services/dailySubjectAttendance";
import { fetchCourseTestMarks } from "../../services/testMarks";
import { getCentreValueFromPortal, matchesPortalCentre } from "../../utils/portalMapping";
import {
  getCentreAddress,
  getCentreId,
  getCentrePlace,
} from "../../utils/centreDirectory";
import { normalizeCourseCode, getCourseSubjectConfig } from "../../utils/courseSubjects";
import { getApiErrorMessage } from "../../utils/apiRequest";

const COURSES = ["JEE", "NEET", "SSC", "CLAT", "IBPS", "RRB", "ICAR", "CUET"];

const PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const toDateOnly = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getWeekRange = (date = new Date()) => {
  const day = date.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toDateOnly(monday), to: toDateOnly(sunday) };
};

const getMonthRange = (date = new Date()) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { from: toDateOnly(first), to: toDateOnly(last) };
};

/** Build one student x subject marks table for a single test. Missing marks show "0/0". */
const buildMarksTable = (course, test, students) => {
  let subjects = [...new Set(test.marks.map((m) => m.subject))].sort();
  if (!subjects.length) {
    const config = getCourseSubjectConfig(course);
    subjects = config?.compulsory || [];
  }

  const marksByStudent = new Map();
  for (const mark of test.marks) {
    const key = String(mark.studentId);
    if (!marksByStudent.has(key)) marksByStudent.set(key, {});
    marksByStudent.get(key)[mark.subject] = mark;
  }

  const rows = students.map((student) => ({
    student,
    cells: subjects.map((subject) => {
      const mark = marksByStudent.get(String(student.id))?.[subject];
      return mark ? `${mark.marksObtained}/${mark.totalMarks}` : "0/0";
    }),
  }));

  return { test, subjects, rows };
};

const buildPerformanceForCourse = ({ course, students, tests, marks, period }) => {
  const marksByTestId = new Map();
  for (const mark of marks) {
    const key = String(mark.testId);
    if (!marksByTestId.has(key)) marksByTestId.set(key, []);
    marksByTestId.get(key).push(mark);
  }

  const testsWithType = tests.map((test) => {
    const testMarks = marksByTestId.get(String(test.id)) || [];
    return { ...test, testType: testMarks[0]?.testType || "performance", marks: testMarks };
  });

  const performanceTests = testsWithType
    .filter((t) => t.testType === "performance")
    .sort((a, b) => String(a.testDate).localeCompare(String(b.testDate)))
    .slice(0, 4);

  const preMidTests = testsWithType
    .filter((t) => t.testType === "pre-mid")
    .sort((a, b) => String(a.testDate).localeCompare(String(b.testDate)));

  return {
    performance: performanceTests.map((test) => buildMarksTable(course, test, students)),
    preMid: period === "monthly" ? preMidTests.map((test) => buildMarksTable(course, test, students)) : [],
  };
};

/** Per-course attendance %, denominator = days that course actually took attendance in the range. */
const buildAttendanceForCourse = (records, students) => {
  const recordsByStudent = new Map();
  for (const record of records) {
    const key = String(record.studentId);
    if (!recordsByStudent.has(key)) recordsByStudent.set(key, []);
    recordsByStudent.get(key).push(record);
  }

  const courseDates = new Set();
  for (const student of students) {
    for (const record of recordsByStudent.get(String(student.id)) || []) {
      courseDates.add(record.date);
    }
  }
  const totalDays = courseDates.size;

  return students.map((student) => {
    const studentRecords = recordsByStudent.get(String(student.id)) || [];
    const presentDays = new Set(
      studentRecords.filter((r) => r.status === "present").map((r) => r.date)
    ).size;
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    return { student, presentDays, totalDays, percentage };
  });
};

function CourseMultiSelect({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const allChecked = selected.length === COURSES.length;

  const toggleAll = () => onChange(allChecked ? [] : [...COURSES]);
  const toggleCourse = (course) =>
    onChange(
      selected.includes(course)
        ? selected.filter((c) => c !== course)
        : [...selected, course]
    );

  const summary = allChecked
    ? "All Courses"
    : selected.length === 0
      ? "Select courses"
      : selected.length <= 2
        ? selected.join(", ")
        : `${selected.length} courses selected`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 text-left text-sm text-slate-700"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={selected.length ? "text-slate-900" : "text-slate-400"}>{summary}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-1.5 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <label className="flex cursor-pointer items-center gap-2.5 border-b border-slate-100 px-3.5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            All
          </label>
          <div className="max-h-56 overflow-y-auto">
            {COURSES.map((course) => (
              <label
                key={course}
                className="flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(course)}
                  onChange={() => toggleCourse(course)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                {course}
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MarksTable({ title, table }) {
  const colCount = table.subjects.length + 1;
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th
              colSpan={colCount}
              className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700"
            >
              {title}
              {table.test.testDate ? ` — ${table.test.testDate}` : ""}
            </th>
          </tr>
          <tr className="bg-slate-100">
            <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-600">
              Student
            </th>
            {table.subjects.map((subject) => (
              <th
                key={subject}
                className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-600"
              >
                {subject}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-3 py-4 text-center text-slate-400">
                No students in this course.
              </td>
            </tr>
          ) : (
            table.rows.map((row) => (
              <tr key={row.student.id} className="odd:bg-white even:bg-slate-50">
                <td className="border-b border-slate-100 px-3 py-2 text-slate-800">
                  {row.student.name}
                </td>
                {row.cells.map((cell, i) => (
                  <td key={i} className="border-b border-slate-100 px-3 py-2 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function AttendanceTable({ rows }) {
  if (!rows.length) {
    return <p className="mt-1 text-sm text-slate-400">No students in this course.</p>;
  }
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-600">
              Student
            </th>
            <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-600">
              Student ID
            </th>
            <th className="border-b border-slate-200 px-3 py-2 text-right font-semibold text-slate-600">
              Attendance %
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ student, percentage }) => (
            <tr key={student.id} className="odd:bg-white even:bg-slate-50">
              <td className="border-b border-slate-100 px-3 py-2 text-slate-800">{student.name}</td>
              <td className="border-b border-slate-100 px-3 py-2 font-mono text-slate-600">
                {student.studentId || student.enrollmentNo || student.id}
              </td>
              <td className="border-b border-slate-100 px-3 py-2 text-right font-semibold text-slate-800">
                {percentage}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * "Centre Report" (Admin only). Pick a period + courses, press Go — generates
 * a Performance section (weekly/pre-mid test marks, course-wise) and an
 * Attendance section (course-wise, attendance % for the same window), scoped
 * to only the selected courses. Missing data always shows as 0 / 0%, never
 * blank, per spec.
 */
export default function CentreReport({
  portalName,
  navItems,
  activeNav,
  onNavChange,
  onLogout,
  roleLabel,
}) {
  const [period, setPeriod] = useState("weekly");
  const [selectedCourses, setSelectedCourses] = useState([...COURSES]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  const centreValue = getCentreValueFromPortal(portalName) || portalName || "—";

  const handleGo = async () => {
    if (!selectedCourses.length) return;
    setLoading(true);
    setError("");
    try {
      const range = period === "weekly" ? getWeekRange() : getMonthRange();

      const [allStudents, attendanceRecords, ...courseTestData] = await Promise.all([
        fetchStudents(),
        fetchAttendanceDetail({ from: range.from, to: range.to, centre: portalName }),
        ...selectedCourses.map((course) =>
          fetchCourseTestMarks({ course, centre: portalName, from: range.from, to: range.to })
        ),
      ]);

      const centreStudents = allStudents.filter((s) => matchesPortalCentre(s.centre, portalName));

      const performanceByCourse = {};
      const attendanceByCourse = {};
      selectedCourses.forEach((course, index) => {
        const courseStudents = centreStudents.filter(
          (s) => normalizeCourseCode(s.course) === course
        );
        performanceByCourse[course] = buildPerformanceForCourse({
          course,
          students: courseStudents,
          tests: courseTestData[index].tests,
          marks: courseTestData[index].marks,
          period,
        });
        attendanceByCourse[course] = buildAttendanceForCourse(attendanceRecords, courseStudents);
      });

      setReport({
        period,
        courses: [...selectedCourses],
        range,
        generatedAt: new Date(),
        performanceByCourse,
        attendanceByCourse,
      });
    } catch (err) {
      console.error("Centre report error:", err);
      setError(getApiErrorMessage(err, "Unable to generate the report. Please try again."));
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout
      portalName={portalName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
      roleLabel={roleLabel}
    >
      <div className="mx-auto max-w-5xl text-slate-900">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
            <FileBarChart2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Centre Report</h1>
            <p className="mt-0.5 text-sm text-slate-500">{centreValue}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[160px]">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none"
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[220px]">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Courses
              </label>
              <CourseMultiSelect selected={selectedCourses} onChange={setSelectedCourses} />
            </div>

            <button
              type="button"
              onClick={handleGo}
              disabled={selectedCourses.length === 0 || loading}
              className="h-11 rounded-xl bg-sky-600 px-6 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={15} className="animate-spin" /> Generating…
                </span>
              ) : (
                "Go"
              )}
            </button>
          </div>

          {selectedCourses.length === 0 ? (
            <p className="mt-3 text-sm text-red-600">Select at least one course.</p>
          ) : null}
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!report && !loading && !error ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              Choose a period and the courses to include, then press Go.
            </p>
          </div>
        ) : null}

        {report ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8">
            <h2 className="text-center text-xl font-bold uppercase tracking-wide text-slate-900">
              {report.period} Report — {centreValue}
            </h2>

            <div className="mt-6 flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6">
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-semibold text-slate-700">Centre:</span> {centreValue}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Centre ID:</span>{" "}
                  {getCentreId(portalName) ?? "—"}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Place:</span>{" "}
                  {getCentrePlace(portalName) ?? "—"}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Address:</span>{" "}
                  {getCentreAddress(portalName) ?? "—"}
                </p>
              </div>
              <p className="text-sm font-medium text-slate-500">
                {report.generatedAt.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <section className="mt-8">
              <h3 className="border-b-2 border-slate-200 pb-2 text-lg font-bold text-slate-900">
                Performance
              </h3>
              {report.courses.map((course) => (
                <div key={course} className="mt-6">
                  <h4 className="text-base font-semibold text-blue-700">{course}</h4>

                  <p className="mt-3 text-sm font-semibold text-slate-600">Performance Test</p>
                  {report.performanceByCourse[course].performance.length === 0 ? (
                    <p className="mt-1 text-sm text-slate-400">
                      No performance tests recorded for this period.
                    </p>
                  ) : (
                    report.performanceByCourse[course].performance.map((table, index) => (
                      <MarksTable key={table.test.id} title={table.test.name || `Week ${index + 1}`} table={table} />
                    ))
                  )}

                  {report.period === "monthly" ? (
                    <>
                      <p className="mt-5 text-sm font-semibold text-slate-600">Pre-Mid Test</p>
                      {report.performanceByCourse[course].preMid.length === 0 ? (
                        <p className="mt-1 text-sm text-slate-400">
                          No pre-mid test recorded for this period.
                        </p>
                      ) : (
                        report.performanceByCourse[course].preMid.map((table) => (
                          <MarksTable key={table.test.id} title={table.test.name || "Pre-Mid Test"} table={table} />
                        ))
                      )}
                    </>
                  ) : null}
                </div>
              ))}
            </section>

            <section className="mt-10">
              <h3 className="border-b-2 border-slate-200 pb-2 text-lg font-bold text-slate-900">
                Attendance
              </h3>
              {report.courses.map((course) => (
                <div key={course} className="mt-6">
                  <h4 className="text-base font-semibold text-blue-700">{course}</h4>
                  <AttendanceTable rows={report.attendanceByCourse[course]} />
                </div>
              ))}
            </section>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}
