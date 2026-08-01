import { useCallback, useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { loadTimetableForPortal } from "../../services/timetables";
import {
  fetchDailySubjectAttendance,
  saveDailySubjectAttendance,
} from "../../services/dailySubjectAttendance";
import { getApiErrorMessage } from "../../utils/apiRequest";
import { getTodaysClasses } from "../../utils/todayClasses";

const toInputDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeCourseKey = (course = "") => {
  const normalized = String(course)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

  if (normalized.includes("JEE")) return "JEE";
  if (normalized.includes("NEET")) return "NEET";
  if (normalized.includes("SSC")) return "SSC";
  if (normalized.includes("CLAT")) return "CLAT";
  if (normalized.includes("IBPS") || normalized.includes("IPBS")) return "IBPS";
  if (normalized.includes("ICAR")) return "ICAR";
  if (normalized.includes("CUET")) return "CUET";
  if (normalized.includes("RRB")) return "RRB";
  return normalized;
};

const normalizeSubject = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const studentDisplayId = (student) =>
  student?.studentId || student?.enrollmentNo || student?.Student_ID || student?.id || "—";

const studentSubjects = (student) => {
  if (Array.isArray(student?.subjects) && student.subjects.length) {
    return student.subjects;
  }
  return Object.keys(student?.attendance || {});
};

const studentMatchesClass = (student, classItem) => {
  const subject = normalizeSubject(classItem.subject);
  if (!subject) return false;

  const enrolled = studentSubjects(student).some(
    (item) => normalizeSubject(item) === subject
  );
  if (!enrolled) return false;

  if (!classItem.course) return true;
  return (
    normalizeCourseKey(student.course) === normalizeCourseKey(classItem.course)
  );
};

const classHeading = (classItem) => {
  if (classItem.course) {
    return `${classItem.subject} course : ${classItem.course}`;
  }
  return classItem.subject;
};

const classKey = (classItem, index) =>
  `${classItem.time || "notime"}::${classItem.subject || ""}::${classItem.course || ""}::${index}`;

function ClassAttendanceTable({
  classItem,
  students,
  date,
  centre,
  index,
}) {
  const [statusById, setStatusById] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadExisting = useCallback(async () => {
    if (!classItem.subject || !students.length) {
      setStatusById({});
      setLocked(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const records = await fetchDailySubjectAttendance({
        date,
        subject: classItem.subject,
        time: classItem.time || "",
        centre: centre || "",
      });
      const next = {};
      for (const row of records) {
        const id = String(row.studentId);
        if (row.status === "present" || row.status === "absent") {
          next[id] = row.status;
        }
      }
      setStatusById(next);

      const allMarked =
        students.length > 0 &&
        students.every((student) => {
          const status = next[String(student.id)];
          return status === "present" || status === "absent";
        });
      setLocked((prev) => prev || allMarked);
      if (allMarked) {
        setMessage((prev) => prev || "Attendance already saved for this class.");
      }
    } catch (err) {
      console.error("Load class attendance error:", err);
      setError(getApiErrorMessage(err, "Unable to load saved attendance"));
    } finally {
      setLoading(false);
    }
  }, [
    classItem.subject,
    classItem.time,
    centre,
    date,
    students.length,
    students.map((student) => student.id).join(","),
  ]);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  const setStatus = (studentId, status) => {
    if (locked) return;
    setStatusById((prev) => ({ ...prev, [String(studentId)]: status }));
    setMessage("");
    setError("");
  };

  const markAll = (status) => {
    if (locked) return;
    const next = {};
    for (const student of students) {
      next[String(student.id)] = status;
    }
    setStatusById(next);
    setMessage("");
    setError("");
  };

  const handleSave = async () => {
    if (locked || saving) return;

    const records = students
      .map((student) => {
        const status = statusById[String(student.id)];
        if (status !== "present" && status !== "absent") return null;
        return {
          studentId: student.id,
          name: student.name,
          status,
        };
      })
      .filter(Boolean);

    if (!records.length) {
      setError("Mark at least one student Present or Absent before saving.");
      setMessage("");
      return;
    }

    if (records.length < students.length) {
      setError("Mark Present or Absent for every student before saving.");
      setMessage("");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await saveDailySubjectAttendance({
        date,
        subject: classItem.subject,
        time: classItem.time || "",
        course: classItem.course || null,
        centre: centre || null,
        records,
      });
      const failed = Array.isArray(result?.errors) ? result.errors.length : 0;
      if (failed > 0) {
        setError(
          `Saved ${result.savedCount || 0}, but ${failed} row(s) failed.`
        );
      } else {
        setLocked(true);
        setMessage(
          `Saved attendance for ${result.savedCount || records.length} student(s).`
        );
      }
      await loadExisting();
    } catch (err) {
      console.error("Save class attendance error:", err);
      setError(getApiErrorMessage(err, "Unable to save attendance"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">
            {classHeading(classItem)}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {classItem.time ? `${classItem.time} · ` : ""}
            {students.length} student{students.length === 1 ? "" : "s"}
            {locked ? " · Saved" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={locked || saving || loading || !students.length}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
            locked ? "bg-emerald-600" : "bg-sky-600 hover:bg-sky-700"
          }`}
        >
          <Save size={16} />
          {locked ? "Saved" : saving ? "Saving…" : "Save"}
        </button>
      </div>

      {message ? (
        <div className="mx-5 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-[#CCD2DD]">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 w-12">
                S.No
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Student Name
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Gender
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Student ID
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700">
                <div className="flex items-center justify-center gap-4">
                  <span>Status</span>
                  <button
                    type="button"
                    onClick={() => markAll("present")}
                    disabled={locked || !students.length || loading}
                    className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
                    title="Mark all Present"
                  >
                    P
                  </button>
                  <button
                    type="button"
                    onClick={() => markAll("absent")}
                    disabled={locked || !students.length || loading}
                    className="rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-40"
                    title="Mark all Absent"
                  >
                    A
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                  Loading attendance…
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                  No students enrolled for this subject
                  {classItem.course ? ` / ${classItem.course}` : ""}.
                </td>
              </tr>
            ) : (
              students.map((student, rowIndex) => {
                const id = String(student.id);
                const status = statusById[id] || "";
                const isEven = rowIndex % 2 === 0;
                return (
                  <tr
                    key={`${classKey(classItem, index)}-${id}`}
                    className={isEven ? "bg-white" : "bg-[#f8f9fb]"}
                  >
                    <td className="px-5 py-3.5 text-sm text-gray-400 tabular-nums">
                      {String(rowIndex + 1).padStart(2, "0")}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-800">
                      {student.name || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {student.gender || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm tabular-nums text-gray-600">
                      {studentDisplayId(student)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-6">
                        <label
                          className={`inline-flex items-center gap-2 text-sm text-emerald-700 ${
                            locked ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`status-${classKey(classItem, index)}-${id}`}
                            checked={status === "present"}
                            disabled={locked}
                            onChange={() => setStatus(id, "present")}
                            className="h-4 w-4 accent-emerald-600"
                          />
                          P
                        </label>
                        <label
                          className={`inline-flex items-center gap-2 text-sm text-red-700 ${
                            locked ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`status-${classKey(classItem, index)}-${id}`}
                            checked={status === "absent"}
                            disabled={locked}
                            onChange={() => setStatus(id, "absent")}
                            className="h-4 w-4 accent-red-600"
                          />
                          A
                        </label>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ClassSubjectAttendanceTables({
  portalName = "",
  userCentre = null,
  students = [],
  studentsLoading = false,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timetable, setTimetable] = useState(null);
  const date = useMemo(() => toInputDate(), []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { timetable: data } = await loadTimetableForPortal(portalName, {
          canMigrate: false,
        });
        if (cancelled) return;
        setTimetable(data || null);
      } catch (err) {
        console.error("Class attendance tables load error:", err);
        if (!cancelled) {
          setTimetable(null);
          setError(getApiErrorMessage(err, "Unable to load class attendance"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [portalName]);

  const { day, classes, unsupported } = useMemo(
    () => getTodaysClasses(timetable),
    [timetable]
  );

  const isWeekendOff = day === "Sunday";
  const centre = userCentre || portalName || "";

  if (loading || studentsLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500 shadow-sm">
        Loading class attendance tables…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (unsupported || isWeekendOff || !classes.length) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Mark Class Attendance</h2>
        <p className="mt-1 text-sm text-slate-500">
          Mark Present / Absent for every student, then Save once. After saving, the table is locked.
        </p>
      </div>

      {classes.map((classItem, index) => {
        const matched = students
          .filter((student) => studentMatchesClass(student, classItem))
          .sort((a, b) =>
            String(a.name || "").localeCompare(String(b.name || ""), undefined, {
              sensitivity: "base",
            })
          );

        return (
          <ClassAttendanceTable
            key={classKey(classItem, index)}
            classItem={classItem}
            students={matched}
            date={date}
            centre={centre}
            index={index}
          />
        );
      })}
    </div>
  );
}
