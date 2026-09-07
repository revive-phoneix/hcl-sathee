import { useMemo, useRef, useState } from "react";
import {
  X,
  Download,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Cloud,
} from "lucide-react";
import * as XLSX from "xlsx";
import { getCentreValueFromPortal } from "../../utils/portalMapping";
import { normalizeCourseCode, getCourseSubjectConfig } from "../../utils/courseSubjects";
import { fetchImportSheet } from "../../services/students";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

/**
 * Columns the sheet may contain. These mirror the manually-editable fields on
 * the "Add New Student" form — auto/derived fields (id, marks, attendance,
 * avatarColor, initials, qualifications, timestamps, computed percentages) are
 * deliberately excluded because the platform fills those itself.
 */
const COLUMNS = [
  // `name` is accepted as an alternative to First/Last Name for sheets that keep
  // the student's name in one column. It's hidden from the generated template.
  { key: "name", label: "Name", templateHidden: true, aliases: ["student name", "full name", "student", "candidate name", "name of student"] },
  { key: "firstName", label: "First Name", aliases: ["firstname", "first", "given name"] },
  { key: "lastName", label: "Last Name", aliases: ["lastname", "last", "surname", "family name"] },
  { key: "gender", label: "Gender", required: true, aliases: ["sex"] },
  { key: "email", label: "Email", required: true, aliases: ["email address", "e mail", "mail", "email id"] },
  { key: "phone", label: "Phone", required: true, aliases: ["phone number", "phone no", "mobile", "mobile number", "mobile no", "mob", "mob no", "contact", "contact number", "contact no", "cell", "cell number", "whatsapp", "whatsapp number", "primary contact"] },
  { key: "course", label: "Course", required: true, aliases: ["course enrolled", "exam", "batch"] },
  { key: "category", label: "Category", aliases: ["caste", "category caste", "category (caste)"] },
  { key: "centre", label: "Centre", aliases: ["center", "centre name", "center name"] },
  { key: "studentId", label: "Student ID", aliases: ["studentid", "student id", "roll no", "roll number", "roll"] },
  { key: "enrollmentNo", label: "Enrollment No", aliases: ["enrollmentno", "enrolment no", "enrollment number", "enrolment number", "enrollment"] },
  { key: "address", label: "Address", aliases: ["addr", "residential address"] },
  { key: "fatherName", label: "Father Name", aliases: ["fathers name", "father's name", "father", "father full name", "guardian name"] },
  { key: "fatherPhone", label: "Father Phone", aliases: ["father phone", "fathers phone", "father's phone", "father phone number", "father phone no", "father mobile", "father mobile number", "father mobile no", "fathers mobile", "father contact", "father contact number", "father contact no", "father number", "father no", "father whatsapp", "guardian phone", "guardian mobile", "guardian contact", "parent phone", "parent contact"] },
  { key: "motherName", label: "Mother Name", aliases: ["mothers name", "mother's name", "mother", "mother full name"] },
  { key: "motherPhone", label: "Mother Phone", aliases: ["mother phone", "mothers phone", "mother's phone", "mother phone number", "mother phone no", "mother mobile", "mother mobile number", "mother mobile no", "mothers mobile", "mother contact", "mother contact number", "mother contact no", "mother number", "mother no", "mother whatsapp"] },
  { key: "subjects", label: "Subjects", aliases: ["optional subjects", "domain subjects", "subject"] },
];

// A name column is required too, but "Name" OR "First Name" both satisfy it — so
// it's checked separately rather than via this list.
const REQUIRED_KEYS = COLUMNS.filter((c) => c.required).map((c) => c.key);
const TEMPLATE_COLUMNS = COLUMNS.filter((c) => !c.templateHidden);
const GENDERS = ["male", "female", "other"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeHeader = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const digits = (value = "") => String(value ?? "").replace(/\D/g, "");

/** Digits only, tolerating common Indian formats: +91 prefix, leading 0. */
const toPhone10 = (value = "") => {
  let d = digits(value);
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
};

const FATHER_TOKENS = ["father", "fathers", "papa", "guardian"];
const MOTHER_TOKENS = ["mother", "mothers", "mummy", "mom"];
const PHONE_TOKENS = ["phone", "mobile", "contact", "whatsapp", "cell", "mob", "number", "no", "ph"];

const matchHeaderToKey = (header) => {
  const norm = normalizeHeader(header);
  if (!norm) return null;
  for (const col of COLUMNS) {
    if (normalizeHeader(col.label) === norm) return col.key;
    if (col.key.toLowerCase() === norm.replace(/\s/g, "")) return col.key;
    if ((col.aliases || []).some((a) => normalizeHeader(a) === norm)) return col.key;
  }

  // Fuzzy fallback: parent contact/name columns are worded countless ways
  // ("Father's Contact No.", "Mother Mobile Number", …). Only fire when the
  // header clearly names a parent AND clearly refers to a phone or a name.
  const tokens = new Set(norm.split(" "));
  const hasFather = FATHER_TOKENS.some((t) => tokens.has(t));
  const hasMother = MOTHER_TOKENS.some((t) => tokens.has(t));
  if (hasFather || hasMother) {
    if (PHONE_TOKENS.some((t) => tokens.has(t))) {
      return hasFather ? "fatherPhone" : "motherPhone";
    }
    if (tokens.has("name")) {
      return hasFather ? "fatherName" : "motherName";
    }
  }
  return null;
};

const splitSubjects = (value) =>
  String(value ?? "")
    .split(/[,;/|\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Build the request payload for one parsed row (same shape the Add form sends). */
const toPayload = (row, defaultCentre) => {
  const name =
    String(row.name ?? "").trim() ||
    `${row.firstName || ""} ${row.lastName || ""}`.trim();
  return {
    __row: row.__row,
    studentId: String(row.studentId ?? "").trim(),
    enrollmentNo: String(row.enrollmentNo ?? "").trim(),
    name,
    gender: String(row.gender ?? "").trim(),
    email: String(row.email ?? "").trim(),
    phone: toPhone10(row.phone),
    centre: String(row.centre ?? "").trim() || defaultCentre,
    course: String(row.course ?? "").trim(),
    category: String(row.category ?? "").trim(),
    address: String(row.address ?? "").trim(),
    parents: {
      father: String(row.fatherName ?? "").trim(),
      fatherPhone: toPhone10(row.fatherPhone),
      mother: String(row.motherName ?? "").trim(),
      motherPhone: toPhone10(row.motherPhone),
    },
    subjects: splitSubjects(row.subjects),
  };
};

/** Light pre-flight check so obvious mistakes surface before uploading. */
const previewIssue = (payload) => {
  if (!`${payload.name}`.trim()) return "Name is required";
  if (!GENDERS.includes(payload.gender.toLowerCase())) return "Gender must be Male, Female or Other";
  if (!payload.email) return "Email is required";
  if (!EMAIL_RE.test(payload.email)) return "Email looks invalid";
  if (payload.phone.length !== 10) return "Phone must be exactly 10 digits";
  const course = normalizeCourseCode(payload.course);
  if (!course || !getCourseSubjectConfig(course)) return "Unknown course code";
  if (payload.parents.fatherPhone && payload.parents.fatherPhone.length !== 10)
    return "Father phone must be 10 digits (or blank)";
  if (payload.parents.motherPhone && payload.parents.motherPhone.length !== 10)
    return "Mother phone must be 10 digits (or blank)";
  const config = getCourseSubjectConfig(course);
  if (config?.type === "choice" && payload.subjects.length === 0)
    return `${course} needs a Subjects value (optional subjects)`;
  return null;
};

const EXAMPLE_ROW = {
  firstName: "Aarav",
  lastName: "Sharma",
  gender: "Male",
  email: "aarav.sharma@example.com",
  phone: "9876543210",
  course: "JEE",
  category: "General",
  centre: "",
  studentId: "",
  enrollmentNo: "",
  address: "Jaipur, Rajasthan",
  fatherName: "Rajesh Sharma",
  fatherPhone: "9876500000",
  motherName: "Sunita Sharma",
  motherPhone: "9876511111",
  subjects: "",
};

export default function ImportStudentsModal({ open, onClose, onImport, portalName }) {
  const defaultCentre = getCentreValueFromPortal(portalName) || "HCL RAJASTHAN";
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState("file"); // "file" | "cloud"
  const [fileName, setFileName] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [sourceLabel, setSourceLabel] = useState("");
  const [rows, setRows] = useState([]); // parsed row objects with __row
  const [parseError, setParseError] = useState("");
  const [ignoredHeaders, setIgnoredHeaders] = useState([]);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState(null); // { total, created, failed, results }

  useEscapeToClose(onClose, open && !importing);

  const payloads = useMemo(
    () => rows.map((row) => toPayload(row, defaultCentre)),
    [rows, defaultCentre]
  );

  const preview = useMemo(
    () => payloads.map((p) => ({ payload: p, issue: previewIssue(p) })),
    [payloads]
  );

  const readyCount = preview.filter((p) => !p.issue).length;
  const issueCount = preview.length - readyCount;

  if (!open) return null;

  const resetParsed = () => {
    setRows([]);
    setFileName("");
    setSourceLabel("");
    setParseError("");
    setIgnoredHeaders([]);
    setReport(null);
  };

  const handleClose = () => {
    if (importing || fetching) return;
    resetParsed();
    setSheetUrl("");
    setMode("file");
    onClose();
  };

  const downloadTemplate = () => {
    const headers = TEMPLATE_COLUMNS.map((c) => c.label);
    const example = TEMPLATE_COLUMNS.map((c) => EXAMPLE_ROW[c.key] ?? "");
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    ws["!cols"] = headers.map((h) => ({ wch: Math.max(14, h.length + 2) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student-data-import-template.xlsx");
  };

  /** Shared: turn a parsed workbook into preview rows (or set a parse error). */
  const ingestWorkbook = (wb) => {
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) {
      setParseError("No readable sheet was found.");
      return;
    }

    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });
    if (!aoa.length) {
      setParseError("The sheet is empty.");
      return;
    }

    const headerRow = aoa[0].map((c) => String(c ?? "").trim());
    const headerMap = {}; // colIndex -> key
    const ignored = [];
    headerRow.forEach((header, idx) => {
      if (!header) return;
      const key = matchHeaderToKey(header);
      if (key) headerMap[idx] = key;
      else ignored.push(header);
    });

    const mappedKeys = new Set(Object.values(headerMap));
    const missing = [];
    if (!mappedKeys.has("name") && !mappedKeys.has("firstName")) {
      missing.push('"Name" (or "First Name")');
    }
    for (const key of REQUIRED_KEYS) {
      if (!mappedKeys.has(key)) missing.push(COLUMNS.find((c) => c.key === key)?.label || key);
    }
    if (missing.length) {
      setParseError(
        `Missing required column(s): ${missing.join(", ")}. Download the template to see the expected headers.`
      );
      return;
    }

    const parsed = [];
    for (let j = 1; j < aoa.length; j += 1) {
      const cells = aoa[j] || [];
      const obj = { __row: j + 1 };
      let hasValue = false;
      Object.entries(headerMap).forEach(([idx, key]) => {
        const raw = cells[idx];
        const value = raw == null ? "" : String(raw).trim();
        obj[key] = value;
        if (value) hasValue = true;
      });
      if (hasValue) parsed.push(obj);
    }

    if (!parsed.length) {
      setParseError("No data rows were found under the header.");
      return;
    }

    setRows(parsed);
    setIgnoredHeaders(ignored);
  };

  const handleFile = async (file) => {
    resetParsed();
    if (!file) return;
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      ingestWorkbook(XLSX.read(new Uint8Array(buffer), { type: "array" }));
    } catch (err) {
      console.error("Import parse error:", err);
      setParseError("Could not read that file. Use .xlsx, .xls or .csv exported from your sheet.");
    }
  };

  const handleFetchSheet = async () => {
    if (!sheetUrl.trim() || fetching) return;
    resetParsed();
    setFetching(true);
    try {
      const csv = await fetchImportSheet(sheetUrl.trim());
      setSourceLabel("Google Sheets");
      ingestWorkbook(XLSX.read(csv, { type: "string" }));
    } catch (err) {
      console.error("Fetch sheet error:", err);
      setParseError(
        err?.response?.data?.message ||
          "Could not load that sheet. Make sure the link is shared as \"Anyone with the link\"."
      );
    } finally {
      setFetching(false);
    }
  };

  const handleImport = async () => {
    if (!payloads.length || importing) return;
    setImporting(true);
    setReport(null);
    try {
      const result = await onImport(payloads);
      setReport(result);
    } catch (err) {
      console.error("Import request error:", err);
      setParseError(
        err?.response?.data?.message || "The import request failed. Please try again."
      );
    } finally {
      setImporting(false);
    }
  };

  const failedResults = report?.results?.filter((r) => !r.ok) ?? [];

  return (
    <div style={backdrop}>
      <div style={panel}>
        <div style={header}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={iconBadge}>
              <FileSpreadsheet size={26} color="#1d4ed8" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
                Import Student Data
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                Bulk-add students from a Google Sheets / Excel export (.xlsx, .xls, .csv).
              </p>
            </div>
          </div>
          <button onClick={handleClose} style={closeBtn} disabled={importing || fetching} aria-label="Close">
            <X size={22} color="#64748b" />
          </button>
        </div>

        <div style={body}>
          {/* STEP: result report */}
          {report ? (
            <div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                <SummaryPill label="Imported" value={report.created} tone="ok" />
                <SummaryPill label="Failed" value={report.failed} tone={report.failed ? "bad" : "muted"} />
                <SummaryPill label="Total rows" value={report.total} tone="muted" />
              </div>

              {failedResults.length > 0 ? (
                <div style={reportBox}>
                  <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>
                    Rows that were skipped
                  </p>
                  <div style={{ maxHeight: 240, overflowY: "auto" }}>
                    {failedResults.map((r) => (
                      <div key={r.row} style={reportRow}>
                        <span style={{ fontWeight: 700, color: "#334155", minWidth: 64 }}>
                          Row {r.row}
                        </span>
                        <span style={{ color: "#b91c1c" }}>{r.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 14, color: "#15803d", fontWeight: 600 }}>
                  All rows imported successfully.
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
                <button type="button" style={secondaryBtn} onClick={resetParsed}>
                  Import more
                </button>
                <button type="button" style={primaryBtn} onClick={handleClose}>
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP: pick file */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                  New to this? Start from the template so the column headers line up.
                </p>
                <button type="button" style={templateBtn} onClick={downloadTemplate}>
                  <Download size={15} /> Download template
                </button>
              </div>

              <div style={tabRow}>
                <button
                  type="button"
                  style={mode === "file" ? tabActive : tabIdle}
                  onClick={() => { setMode("file"); resetParsed(); }}
                >
                  <UploadCloud size={15} /> Upload file
                </button>
                <button
                  type="button"
                  style={mode === "cloud" ? tabActive : tabIdle}
                  onClick={() => { setMode("cloud"); resetParsed(); }}
                >
                  <Cloud size={15} /> Add from cloud
                </button>
              </div>

              {mode === "file" ? (
                <>
                  <button
                    type="button"
                    style={dropZone}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                  >
                    <UploadCloud size={30} color="#3b82f6" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1e3a5f" }}>
                      {fileName || "Choose a spreadsheet file"}
                    </span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>
                      Students are added to <strong>{defaultCentre}</strong> unless the sheet has a Centre column
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                    onChange={(e) => handleFile(e.target.files?.[0] || null)}
                    style={{ display: "none" }}
                  />
                </>
              ) : (
                <div style={{ ...dropZone, cursor: "default" }}>
                  <Cloud size={28} color="#3b82f6" />
                  <span style={{ fontSize: 13, color: "#475569", textAlign: "center" }}>
                    Paste a <strong>Google Sheets</strong> link. In Sheets: <em>Share → General access →
                    “Anyone with the link” → Viewer</em>, then paste it here.
                  </span>
                  <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 520 }}>
                    <input
                      type="url"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleFetchSheet(); }}
                      placeholder="https://docs.google.com/spreadsheets/d/…"
                      style={urlInput}
                    />
                    <button
                      type="button"
                      style={{ ...primaryBtn, padding: "10px 18px", opacity: fetching || !sheetUrl.trim() ? 0.6 : 1, cursor: fetching || !sheetUrl.trim() ? "not-allowed" : "pointer" }}
                      onClick={handleFetchSheet}
                      disabled={fetching || !sheetUrl.trim()}
                    >
                      {fetching ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading
                        </span>
                      ) : "Fetch"}
                    </button>
                  </div>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>
                    Students are added to <strong>{defaultCentre}</strong> unless the sheet has a Centre column
                  </span>
                </div>
              )}

              <p style={{ fontSize: 12, color: "#64748b", margin: "12px 0 0" }}>
                Headers are matched loosely — a single <strong>Name</strong> column works instead of
                First / Last Name. Marks, attendance and other auto-generated fields are filled by the
                platform, so leave them out. For <strong>CUET</strong> and <strong>ICAR</strong>, put
                every required subject (compulsory + chosen) in the <strong>Subjects</strong> column,
                comma-separated.
              </p>

              {parseError ? (
                <div style={errorBox}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{parseError}</span>
                </div>
              ) : null}

              {ignoredHeaders.length > 0 ? (
                <p style={{ fontSize: 12, color: "#b45309", margin: "10px 0 0" }}>
                  Ignored unrecognised column(s): {ignoredHeaders.join(", ")}
                </p>
              ) : null}

              {/* STEP: preview */}
              {preview.length > 0 ? (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
                    <SummaryPill label="Ready" value={readyCount} tone="ok" />
                    <SummaryPill label="Needs a fix" value={issueCount} tone={issueCount ? "bad" : "muted"} />
                    {(sourceLabel || fileName) ? (
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        from {sourceLabel || fileName}
                      </span>
                    ) : null}
                  </div>

                  <div style={tableWrap}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr>
                          {["Row", "Name", "Course", "Email", "Status"].map((h) => (
                            <th key={h} style={th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map(({ payload, issue }) => (
                          <tr key={payload.__row}>
                            <td style={td}>{payload.__row}</td>
                            <td style={td}>{payload.name || <em style={{ color: "#94a3b8" }}>—</em>}</td>
                            <td style={td}>{payload.course || "—"}</td>
                            <td style={td}>{payload.email || "—"}</td>
                            <td style={td}>
                              {issue ? (
                                <span style={{ color: "#b91c1c", display: "inline-flex", alignItems: "center", gap: 5 }}>
                                  <AlertTriangle size={13} /> {issue}
                                </span>
                              ) : (
                                <span style={{ color: "#15803d", display: "inline-flex", alignItems: "center", gap: 5 }}>
                                  <CheckCircle2 size={13} /> Ready
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p style={{ fontSize: 12, color: "#64748b", margin: "10px 0 0" }}>
                    All {preview.length} row(s) will be sent. Rows flagged above are re-checked on the
                    server and skipped with a reason if they still fail — nothing else is affected.
                  </p>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 18 }}>
                    <button type="button" style={secondaryBtn} onClick={resetParsed} disabled={importing}>
                      Clear
                    </button>
                    <button
                      type="button"
                      style={{ ...primaryBtn, opacity: importing || !readyCount ? 0.6 : 1, cursor: importing || !readyCount ? "not-allowed" : "pointer" }}
                      onClick={handleImport}
                      disabled={importing || !readyCount}
                    >
                      {importing ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Importing…
                        </span>
                      ) : (
                        `Import ${readyCount} student${readyCount === 1 ? "" : "s"}`
                      )}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function SummaryPill({ label, value, tone }) {
  const tones = {
    ok: { bg: "#ecfdf5", border: "#a7f3d0", color: "#047857" },
    bad: { bg: "#fef2f2", border: "#fecaca", color: "#b91c1c" },
    muted: { bg: "#f1f5f9", border: "#e2e8f0", color: "#475569" },
  };
  const t = tones[tone] || tones.muted;
  return (
    <div style={{ borderRadius: 10, border: `1px solid ${t.border}`, background: t.bg, padding: "8px 14px" }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: t.color }}>{value}</span>
      <span style={{ fontSize: 12, color: t.color, marginLeft: 6 }}>{label}</span>
    </div>
  );
}

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,.45)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  padding: 20,
};

const panel = {
  width: "100%",
  maxWidth: 820,
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
  background: "#fff",
  borderRadius: 18,
  boxShadow: "0 25px 60px rgba(0,0,0,.25)",
  overflow: "hidden",
};

const header = {
  padding: "22px 28px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  borderBottom: "1px solid #e2e8f0",
  background: "linear-gradient(90deg,#eef2ff 0%,#dbeafe 100%)",
};

const iconBadge = {
  width: 52,
  height: 52,
  borderRadius: 14,
  background: "#dbeafe",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexShrink: 0,
};

const closeBtn = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: 4,
};

const body = { padding: 28, overflowY: "auto" };

const templateBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #bfdbfe",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const tabRow = {
  display: "flex",
  gap: 8,
  marginBottom: 14,
};

const tabBase = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 16px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const tabActive = {
  ...tabBase,
  border: "1px solid #1d4ed8",
  background: "#1d4ed8",
  color: "#fff",
};

const tabIdle = {
  ...tabBase,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#475569",
};

const urlInput = {
  flex: 1,
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#fff",
  fontSize: 13,
  color: "#0f172a",
  outline: "none",
};

const dropZone = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
  padding: "28px 20px",
  borderRadius: 14,
  border: "2px dashed #bfdbfe",
  background: "#f8fafc",
  cursor: "pointer",
};

const errorBox = {
  marginTop: 14,
  display: "flex",
  gap: 8,
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  fontSize: 13,
};

const tableWrap = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  overflow: "hidden",
  maxHeight: 300,
  overflowY: "auto",
};

const th = {
  textAlign: "left",
  padding: "10px 12px",
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  fontSize: 12,
  fontWeight: 700,
  color: "#475569",
  position: "sticky",
  top: 0,
};

const td = {
  padding: "9px 12px",
  borderBottom: "1px solid #f1f5f9",
  color: "#334155",
};

const reportBox = {
  border: "1px solid #fecaca",
  borderRadius: 12,
  background: "#fff7f7",
  padding: 14,
};

const reportRow = {
  display: "flex",
  gap: 12,
  padding: "6px 0",
  fontSize: 13,
  borderBottom: "1px solid #fee2e2",
};

const primaryBtn = {
  padding: "11px 22px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg,#1e40af,#3b82f6)",
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const secondaryBtn = {
  padding: "11px 20px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#374151",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};
