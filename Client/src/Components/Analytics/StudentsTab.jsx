import { useEffect, useMemo, useState } from "react";
import { fetchStudentPerformance } from "../../services/studentPerformance";
import { matchesPortalCentre } from "../../utils/portalMapping";
import { average, getStudentProgressRates } from "../../utils/studentMetrics";

const PASS_MARK = 40;

const performanceBadge = (level) => {
  const map = {
    Excellent: "bg-green-100 text-green-700 border border-green-200",
    Good: "bg-blue-100 text-blue-700 border border-blue-200",
    Average: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    "Needs Improvement": "bg-red-100 text-red-700 border border-red-200",
  };
  return map[level] || "bg-gray-100 text-gray-600";
};

const getPerformanceLabel = (avg) => {
  if (avg >= 75) return "Excellent";
  if (avg >= 65) return "Good";
  if (avg >= 50) return "Average";
  return "Needs Improvement";
};

const round1 = (value) => Math.round(value * 10) / 10;

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

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
        Loading student analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!courseRows.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
        No students found for this centre.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-2xl p-6 shadow-sm border border-blue-100 flex gap-5">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
            🏆
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">
              Highest Student Marks
            </p>
            {highestStudent ? (
              <>
                <div className="flex items-end gap-3 mb-3">
                  <span className="text-4xl font-extrabold text-blue-700">
                    {round1(highestStudent.avg)}
                  </span>
                  <span className="text-lg font-semibold text-blue-500 mb-1">/ 100</span>
                  <span className="ml-auto text-sm font-semibold bg-blue-200 text-blue-800 px-2.5 py-0.5 rounded-full">
                    {round1(highestStudent.avg)}%
                  </span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-600 font-medium">
                      {highestStudent.student.name}
                    </span>
                    <span className="text-blue-400 text-xs">
                      {highestStudent.student.studentId || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-500">Course</span>
                    <span className="text-blue-700 font-semibold">
                      {highestStudent.student.course || "—"}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-blue-500">No marks recorded yet.</p>
            )}
          </div>
        </div>

        <div className="bg-blue-50 rounded-2xl p-6 shadow-sm border border-blue-100 flex gap-5">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center text-2xl">
            📉
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">
              Lowest Student Marks
            </p>
            {lowestStudent ? (
              <>
                <div className="flex items-end gap-3 mb-3">
                  <span className="text-4xl font-extrabold text-red-600">
                    {round1(lowestStudent.avg)}
                  </span>
                  <span className="text-lg font-semibold text-red-400 mb-1">/ 100</span>
                  <span className="ml-auto text-sm font-semibold bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full border border-red-200">
                    {round1(lowestStudent.avg)}%
                  </span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-red-600">
                      {lowestStudent.student.name}
                    </span>
                    <span className="text-red-600 text-xs">
                      {lowestStudent.student.studentId || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-500">Course</span>
                    <span className="font-semibold text-red-600">
                      {lowestStudent.student.course || "—"}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-red-500">No marks recorded yet.</p>
            )}
          </div>
        </div>
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
              <tr style={{ backgroundColor: "#CCD2DD" }}>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase">
                  Course
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">
                  Students Count
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">
                  Avg
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">
                  Highest
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">
                  Lowest
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">
                  Pass %
                </th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-gray-700 uppercase">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody>
              {courseRows.map((row, i) => (
                <tr
                  key={row.Course}
                  className={`hover:bg-blue-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                >
                  <td className="px-6 py-4 font-semibold text-gray-900">{row.Course}</td>
                  <td className="px-4 py-4 text-center font-semibold text-gray-800">
                    👤 {row.students}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-700">{row.avg}</td>
                  <td className="px-4 py-4 text-center font-medium text-green-700">
                    {row.highest}
                  </td>
                  <td className="px-4 py-4 text-center font-medium text-red-600">
                    {row.lowest}
                  </td>
                  <td className="px-4 py-4 text-center font-semibold text-gray-800">
                    {row.pass}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row.performance === "—" ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${performanceBadge(row.performance)}`}
                      >
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
