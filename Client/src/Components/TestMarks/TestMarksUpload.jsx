import { useEffect, useMemo, useState } from "react";
import { fetchStudents } from "../../services/students";
import {
  fetchTests,
  createTest,
  ocrPrefillTestMarks,
  saveTestMarks,
} from "../../services/testMarks";

const COURSES = ["JEE", "NEET", "SSC", "CLAT", "IBPS", "ICAR", "CUET", "RRB"];

export default function TestMarksUpload({ mitraCentre = "" }) {
  const [students, setStudents] = useState([]);
  const [course, setCourse] = useState("");
  const [tests, setTests] = useState([]);
  const [testId, setTestId] = useState("");
  const [newTestName, setNewTestName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]); // [{ subject, marksObtained, totalMarks }]
  const [ocrMessage, setOcrMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

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
  };

  const handleRunOcr = async () => {
    if (!file) return;
    setOcrMessage("Running OCR…");
    const { available, marks, message } = await ocrPrefillTestMarks(file);
    setOcrMessage(message);
    if (available && marks.length) {
      setRows(marks.map((m) => ({ ...m })));
    } else if (selectedStudent?.subjects?.length) {
      // fallback: blank rows for the student's enrolled subjects, for manual entry
      setRows(selectedStudent.subjects.map((subject) => ({ subject, marksObtained: "", totalMarks: "" })));
    }
  };

  const updateRow = (index, field, value) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const handleSave = async () => {
    if (!testId || !studentId || !rows.length) return;
    setSaving(true);
    setSaveMessage("");
    try {
      const result = await saveTestMarks({
        testId,
        studentId,
        course,
        centre: mitraCentre || selectedStudent?.centre,
        records: rows.map((r) => ({
          subject: r.subject,
          marksObtained: Number(r.marksObtained) || 0,
          totalMarks: Number(r.totalMarks) || 0,
          source: r.confidence ? "ocr" : "manual",
        })),
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
    <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">Test Marks</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <select
          className="rounded-xl border border-slate-200 p-2 text-sm"
          value={course}
          onChange={(e) => { setCourse(e.target.value); setTestId(""); setRows([]); }}
        >
          <option value="">Select course</option>
          {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          className="rounded-xl border border-slate-200 p-2 text-sm"
          value={testId}
          onChange={(e) => setTestId(e.target.value)}
          disabled={!course}
        >
          <option value="">Select test</option>
          {tests.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <div className="flex gap-2">
          <input
            className="rounded-xl border border-slate-200 p-2 text-sm flex-1"
            placeholder="New test name"
            value={newTestName}
            onChange={(e) => setNewTestName(e.target.value)}
            disabled={!course}
          />
          <button
            className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
            onClick={handleCreateTest}
            disabled={!course}
          >
            + Add
          </button>
        </div>
      </div>

      <select
        className="w-full rounded-xl border border-slate-200 p-2 text-sm"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        disabled={!course}
      >
        <option value="">Select student</option>
        {courseStudents.map((s) => (
          <option key={s.id} value={s.id}>{s.name} — {s.enrollmentNo || s.id}</option>
        ))}
      </select>

      <div className="flex items-center gap-3">
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
          onClick={handleRunOcr}
          disabled={!file}
        >
          Extract with OCR
        </button>
      </div>
      {ocrMessage && <p className="text-xs text-slate-500">{ocrMessage}</p>}

      {rows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">Review before saving — OCR values may need correction.</p>
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 items-center">
              <input
                className="rounded-lg border border-slate-200 p-2 text-sm"
                value={row.subject}
                onChange={(e) => updateRow(i, "subject", e.target.value)}
              />
              <input
                className="rounded-lg border border-slate-200 p-2 text-sm"
                type="number"
                placeholder="Marks obtained"
                value={row.marksObtained}
                onChange={(e) => updateRow(i, "marksObtained", e.target.value)}
              />
              <input
                className="rounded-lg border border-slate-200 p-2 text-sm"
                type="number"
                placeholder="Total marks"
                value={row.totalMarks}
                onChange={(e) => updateRow(i, "totalMarks", e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      <button
        className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-medium text-white disabled:opacity-40"
        onClick={handleSave}
        disabled={!testId || !studentId || !rows.length || saving}
      >
        {saving ? "Saving…" : "Save Test Marks"}
      </button>
      {saveMessage && <p className="text-xs text-slate-600">{saveMessage}</p>}
    </div>
  );
}