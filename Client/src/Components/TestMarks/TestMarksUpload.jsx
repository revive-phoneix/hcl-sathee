import { useEffect, useMemo, useState } from "react";
import { fetchStudents } from "../../services/students";
import {
  fetchTests,
  createTest,
  ocrPrefillTestMarks,
  documentPrefillTestMarks,
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

  const buildRowsFromSubjects = (extractedMarks) => {
    const subjects = selectedStudent?.subjects?.length ? selectedStudent.subjects : [];
    if (!subjects.length) {
      // No known subject list for this student — fall back to raw extraction.
      return extractedMarks.map((m) => ({ ...m }));
    }
    return subjects.map((subject) => {
      const match = extractedMarks.find(
        (m) =>
          m.subject.toLowerCase().includes(subject.toLowerCase()) ||
          subject.toLowerCase().includes(m.subject.toLowerCase())
      );
      return {
        subject,
        marksObtained: match ? match.marksObtained : "",
        totalMarks: match ? match.totalMarks : "",
      };
    });
  };

  const handleRunOcr = async () => {
    if (!file) return;
    setOcrMessage("Running OCR…");
    const { available, marks, message } = await ocrPrefillTestMarks(file);
    setOcrMessage(message);
    if (available) {
      setRows(buildRowsFromSubjects(marks));
    }
  };

  const handleRunDocumentExtract = async () => {
    if (!file) return;
    setOcrMessage("Reading document…");
    try {
      const { available, marks, message } = await documentPrefillTestMarks(file);
      setOcrMessage(message);
      if (available) {
        setRows(buildRowsFromSubjects(marks));
      }
    } catch (err) {
      setOcrMessage(err?.response?.data?.message || "Unable to read this file");
    }
  };

  const handleStartManualEntry = () => {
    if (selectedStudent?.subjects?.length) {
      setRows(selectedStudent.subjects.map((subject) => ({ subject, marksObtained: "", totalMarks: "" })));
      return;
    }
    setRows([{ subject: "", marksObtained: "", totalMarks: "" }]);
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
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Test Marks</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <select
          className="rounded-xl border border-slate-300 bg-white p-2 text-sm text-slate-900"
          value={course}
          onChange={(e) => { setCourse(e.target.value); setTestId(""); setRows([]); }}
        >
          <option value="">Select course</option>
          {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          className="rounded-xl border border-slate-300 bg-white p-2 text-sm text-slate-900"
          value={testId}
          onChange={(e) => setTestId(e.target.value)}
          disabled={!course}
        >
          <option value="">Select test</option>
          {tests.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

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
        onChange={(e) => setStudentId(e.target.value)}
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
          className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
          onClick={handleRunOcr}
          disabled={!file || !studentId}
        >
          Extract with OCR
        </button>
        <button
          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
          onClick={handleRunDocumentExtract}
          disabled={!file || !studentId}
        >
          Extract from PDF/Word (Text)
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Use <b>Extract with OCR</b> for a photographed/scanned sheet, or <b>Extract from PDF/Word</b> for a
        digitally typed PDF or Word answer sheet.
      </p>
      {ocrMessage && <p className="text-xs text-slate-600">{ocrMessage}</p>}

      {rows.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-medium text-slate-600">
            Review before saving — extracted values may need correction.
          </p>

          {/* Centre + Date */}
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

          {/* Per-subject cards */}
          <div className="space-y-3">
            {rows.map((row, i) => (
              <div key={i} className="rounded-xl border border-slate-300 bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-slate-900">{row.subject}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                      Marks Gained
                    </label>
                    <input
                      type="number"
                      className="mt-1 w-full bg-transparent text-lg font-semibold text-slate-900 focus:outline-none"
                      value={row.marksObtained}
                      onChange={(e) => updateRow(i, "marksObtained", e.target.value)}
                    />
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      className="mt-1 w-full bg-transparent text-lg font-semibold text-slate-900 focus:outline-none"
                      value={row.totalMarks}
                      onChange={(e) => updateRow(i, "totalMarks", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grand Total + Max Marks — auto-computed from the rows above, always in sync */}
          <div className="grid gap-3 sm:grid-cols-2">
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
          </div>
        </div>
      )}

      <button
        className="w-full rounded-xl bg-slate-900 py-3 text-sm font-medium text-white disabled:opacity-40"
        onClick={handleSave}
        disabled={!testId || !studentId || !rows.length || saving}
      >
        {saving ? "Saving…" : "Save Test Marks"}
      </button>
      {saveMessage && <p className="text-xs text-slate-700">{saveMessage}</p>}
    </div>
  );
}