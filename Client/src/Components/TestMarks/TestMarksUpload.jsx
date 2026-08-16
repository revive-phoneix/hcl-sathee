import { useEffect, useMemo, useState } from "react";
import { fetchStudents } from "../../services/students";
import { fetchTests, createTest, deleteTest, saveTestMarks } from "../../services/testMarks";

const COURSES = ["JEE", "NEET", "SSC", "CLAT", "IBPS", "ICAR", "CUET", "RRB"];
const TEST_TYPES = [
  { value: "performance", label: "Performance Test (Weekly)" },
  { value: "pre-mid", label: "Pre-Mid (Monthly)" },
  { value: "mid", label: "Mid (in Six Months)" },
];

export default function TestMarksUpload({ mitraCentre = "" }) {
  const [students, setStudents] = useState([]);
  const [testType, setTestType] = useState("performance");
  const [course, setCourse] = useState("");
  const [tests, setTests] = useState([]);
  const [testId, setTestId] = useState("");
  const [newTestName, setNewTestName] = useState("");
  const [testMenuOpen, setTestMenuOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]); // [{ subject, marksObtained, totalMarks }]
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [rowErrors, setRowErrors] = useState({}); // Track validation errors per row

  useEffect(() => {
    fetchStudents().then(setStudents).catch(() => setStudents([]));
  }, []);

  useEffect(() => {
    if (!course) {
      setTests([]);
      return;
    }
    fetchTests(course, mitraCentre).then(setTests).catch(() => setTests([]));
  }, [course, mitraCentre]);

  const courseStudents = useMemo(
    () => students.filter((s) => (s.course || "").toUpperCase().includes(course)),
    [students, course]
  );

  const selectedStudent = courseStudents.find((s) => String(s.id) === String(studentId));

  const handleCreateTest = async () => {
    if (!course) return;
    const created = await createTest({ name: newTestName, course, centre: mitraCentre });
    setTests((prev) => [...prev, created]);
    setTestId(created.id);
    setNewTestName("");
    setTestMenuOpen(false);
  };

  const handleDeleteTest = async (id, name) => {
    if (!id) return;
    const confirmDelete = window.confirm(`Delete test "${name}"? This will remove the test and its saved subject marks.`);
    if (!confirmDelete) return;

    try {
      await deleteTest(id);
      setTests((prev) => prev.filter((test) => String(test.id) !== String(id)));
      if (String(testId) === String(id)) {
        setTestId("");
        setRows([]);
      }
      setSaveMessage("");
    } catch (err) {
      setSaveMessage(err?.response?.data?.message || "Failed to delete test");
    } finally {
      setTestMenuOpen(false);
    }
  };

  const handleStartManualEntry = () => {
    if (selectedStudent?.subjects?.length) {
      setRows(selectedStudent.subjects.map((subject) => ({ subject, marksObtained: "", totalMarks: "" })));
      return;
    }
    setRows([{ subject: "", marksObtained: "", totalMarks: "" }]);
    setRowErrors({});
  };

  const canUpload = Boolean(course && testId && studentId && file);

  const handleUpload = () => {
    if (!file || !studentId) return;
    setSaveMessage("Answer sheet file selected and will be saved when you save test marks.");
  };

  const updateRow = (index, field, value) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

    // Validate marks obtained doesn't exceed total marks
    const obtained = field === "marksObtained" ? Number(value) || 0 : Number(rows[index]?.marksObtained) || 0;
    const total = field === "totalMarks" ? Number(value) || 0 : Number(rows[index]?.totalMarks) || 0;

    if (obtained > total && total > 0) {
      setRowErrors((prev) => ({ ...prev, [index]: "Marks obtained cannot exceed total marks" }));
    } else {
      setRowErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const handleSave = async () => {
    if (!testId || !studentId || !rows.length) return;

    // Check for validation errors
    if (Object.keys(rowErrors).length > 0) {
      setSaveMessage("Please fix validation errors before saving.");
      return;
    }

    setSaving(true);
    setSaveMessage("");
    try {
      const result = await saveTestMarks({
        testId,
        testType,
        studentId,
        course,
        centre: mitraCentre || selectedStudent?.centre,
        records: rows.map((r) => {
          const marksObtained = Number(r.marksObtained) || 0;
          const totalMarks = Number(r.totalMarks) || 0;
          const subjectPercentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 1000) / 10 : null;
          return {
            subject: r.subject,
            marksObtained,
            totalMarks,
            subjectPercentage,
            source: "manual",
          };
        }),
        answerSheetFile: file,
      });
      setSaveMessage(`Saved ${result.savedCount} subject mark(s).`);
    } catch (err) {
      setSaveMessage(err?.response?.data?.message || "Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Test Marks</h2>

      <div className="grid gap-4 sm:grid-cols-4">
        <select
          className="rounded-xl border border-slate-300 bg-white p-2 text-sm text-slate-900"
          value={testType}
          onChange={(e) => setTestType(e.target.value)}
        >
          {TEST_TYPES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>

        <select
          className="rounded-xl border border-slate-300 bg-white p-2 text-sm text-slate-900"
          value={course}
          onChange={(e) => { setCourse(e.target.value); setTestId(""); setRows([]); }}
        >
          <option value="">Select course</option>
          {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="relative">
          <button
            type="button"
            className="w-full rounded-xl border border-slate-300 bg-white p-2 text-left text-sm text-slate-900"
            onClick={() => setTestMenuOpen((prev) => !prev)}
            disabled={!course}
          >
            {tests.find((t) => String(t.id) === String(testId))?.name || "Select test"}
          </button>

          {testMenuOpen && course ? (
            <div className="absolute left-0 right-0 z-20 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Select test
              </div>
              {tests.length === 0 ? (
                <div className="px-3 py-3 text-sm text-slate-500">No tests found</div>
              ) : (
                tests.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 border-b border-slate-100 last:border-b-0">
                    <button
                      type="button"
                      className="flex-1 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setTestId(String(t.id));
                        setRows([]);
                        setRowErrors({});
                        setSaveMessage("");
                        setTestMenuOpen(false);
                      }}
                    >
                      {t.name}
                    </button>
                    <button
                      type="button"
                      className="mr-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100"
                      onClick={() => handleDeleteTest(t.id, t.name)}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="flex gap-2">
          <input
            className="rounded-xl border border-slate-300 bg-white p-2 text-sm text-slate-900 flex-1"
            placeholder="New test name"
            value={newTestName}
            onChange={(e) => setNewTestName(e.target.value)}
            disabled={!course}
          />
          <button
            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
            onClick={handleCreateTest}
            disabled={!course}
          >
            + Add
          </button>
        </div>
      </div>

      <select
        className="w-full rounded-xl border border-slate-300 bg-white p-2 text-sm text-slate-900"
        value={studentId}
        onChange={(e) => {
          setStudentId(e.target.value);
          setRows([]);
          setRowErrors({});
        }}
        disabled={!course}
      >
        <option value="">Select student</option>
        {courseStudents.map((s) => (
          <option key={s.id} value={s.id}>{s.name} — {s.studentId || s.id}</option>
        ))}
      </select>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          accept="application/pdf,image/*,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full rounded-xl border border-slate-300 bg-white p-2 text-sm text-slate-900"
        />
        <button
          className={`rounded-xl px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-40 ${
            canUpload ? "bg-[#0b2e6f] hover:bg-[#08265d]" : "bg-sky-600 hover:bg-sky-700"
          }`}
          onClick={handleUpload}
          disabled={!file || !studentId}
        >
          Upload
        </button>
        <button
          className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-medium text-slate-800 disabled:opacity-40"
          onClick={handleStartManualEntry}
          disabled={!studentId}
        >
          Manual Entry
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Upload the answer sheet document for backend saving, then type marks manually below.
      </p>

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-600">Manual entry — fields are editable.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-300 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Centre</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{mitraCentre || "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-300 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Date</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {new Date().toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {rows.map((row, i) => {
              const marksObtained = Number(row.marksObtained) || 0;
              const totalMarks = Number(row.totalMarks) || 0;
              const percentage = totalMarks > 0 ? ((marksObtained / totalMarks) * 100).toFixed(1) : "—";
              const hasError = rowErrors[i];
              const isInvalid = marksObtained > totalMarks && totalMarks > 0;

              return (
                <div key={i} className="rounded-xl border border-slate-300 bg-white p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-900">{row.subject}</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className={`rounded-lg border ${isInvalid ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"} p-3`}>
                      <label className={`block text-xs font-medium uppercase tracking-wide ${isInvalid ? "text-red-600" : "text-slate-500"}`}>
                        Marks Gained
                      </label>
                      <input
                        type="number"
                        className={`mt-1 w-full bg-transparent text-lg font-semibold focus:outline-none ${isInvalid ? "text-red-700" : "text-slate-900"}`}
                        value={row.marksObtained}
                        onChange={(e) => updateRow(i, "marksObtained", e.target.value)}
                      />
                      {hasError && <p className="mt-1 text-xs text-red-600">{hasError}</p>}
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                        Total Marks
                      </label>
                      <input
                        type="number"
                        className="mt-1 w-full bg-transparent text-lg font-semibold focus:outline-none text-slate-900"
                        value={row.totalMarks}
                        onChange={(e) => updateRow(i, "totalMarks", e.target.value)}
                      />
                    </div>
                    <div className={`rounded-lg border ${isInvalid ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"} p-3`}>
                      <label className={`block text-xs font-medium uppercase tracking-wide ${isInvalid ? "text-red-700" : "text-emerald-700"}`}>
                        Percentage
                      </label>
                      <p className={`mt-1 text-lg font-semibold ${isInvalid ? "text-red-900" : "text-emerald-900"}`}>
                        {typeof percentage === "number" ? `${percentage}%` : percentage}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-900 bg-slate-900 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-300">Grand Total</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {rows.reduce((sum, r) => sum + (Number(r.marksObtained) || 0), 0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-900 bg-slate-900 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-300">Max Marks</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {rows.reduce((sum, r) => sum + (Number(r.totalMarks) || 0), 0)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-600 bg-emerald-600 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-100">Average %</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {rows.length > 0
                  ? (
                      rows.reduce((sum, r) => {
                        const obtained = Number(r.marksObtained) || 0;
                        const total = Number(r.totalMarks) || 0;
                        return sum + (total > 0 ? (obtained / total) * 100 : 0);
                      }, 0) / rows.length
                    ).toFixed(1) + "%"
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        className="w-full rounded-xl bg-slate-900 py-3 text-sm font-medium text-white disabled:opacity-40"
        onClick={handleSave}
        disabled={!testId || !studentId || !rows.length || saving || Object.keys(rowErrors).length > 0}
      >
        {saving ? "Saving…" : "Save Test Marks"}
      </button>
      {saveMessage && <p className="text-xs text-slate-700">{saveMessage}</p>}
    </div>
  );
}