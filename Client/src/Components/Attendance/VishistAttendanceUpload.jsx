import { useEffect, useState } from "react";
import { Camera, ImageOff, Check } from "lucide-react";
import { fetchVishistAttendance, markVishistAttendance, approveVishistAttendance } from "../../services/vishistAttendance";

const toInputDate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export default function VishistAttendanceUpload({ vishistMitras = [], portalName }) {
    const today = toInputDate();
    const [selectedId, setSelectedId] = useState("");
    const [subject, setSubject] = useState("");
    const [topicTaught, setTopicTaught] = useState("");
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [records, setRecords] = useState([]);
    const [loadingRecords, setLoadingRecords] = useState(true);
    const [approvingId, setApprovingId] = useState(null);

    const handleApprove = async (id) => {
        setApprovingId(id);
        try {
            await approveVishistAttendance(id);
            loadRecords();
        } catch (err) {
            console.error("Approve Vishist attendance error:", err);
            setError(err.response?.data?.message || "Unable to approve attendance");
        } finally {
            setApprovingId(null);
        }
    };

    const selectedVishist = vishistMitras.find((m) => String(m.id) === String(selectedId)) || null;

    const loadRecords = async () => {
        setLoadingRecords(true);
        try {
            const data = await fetchVishistAttendance(today, portalName);
            setRecords(data);
        } catch (err) {
            console.error("Load Vishist attendance error:", err);
        } finally {
            setLoadingRecords(false);
        }
    };

    useEffect(() => {
        loadRecords();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [today, portalName]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;
        setPhotoFile(file);
        setPhotoPreview(file ? URL.createObjectURL(file) : null);
    };

    const resetForm = () => {
        setSelectedId("");
        setSubject("");
        setTopicTaught("");
        setPhotoFile(null);
        setPhotoPreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!selectedId) return setError("Select a Sathee Vishist name");
        if (!subject.trim()) return setError("Enter the subject");
        if (!topicTaught.trim()) return setError("Enter the topic taught");

        setSubmitting(true);
        try {
            await markVishistAttendance({
                vishistUserId: selectedId,
                subject: subject.trim(),
                topicTaught: topicTaught.trim(),
                date: today,
                photoFile,
            });
            setMessage("Vishist attendance marked successfully.");
            resetForm();
            loadRecords();
        } catch (err) {
            console.error("Mark Vishist attendance error:", err);
            setError(err.response?.data?.message || "Unable to mark attendance");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Sathee Vishist Name</label>
                        <select
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Select a name</option>
                            {vishistMitras.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="text"
                            value={selectedVishist?.email || ""}
                            readOnly
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                            placeholder="Auto-filled on selection"
                        />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. Physics"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Topic Taught</label>
                        <input
                            type="text"
                            value={topicTaught}
                            onChange={(e) => setTopicTaught(e.target.value)}
                            placeholder="e.g. Newton's Laws of Motion"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Photo</label>
                    <div className="flex items-center gap-4">
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <ImageOff size={22} className="text-slate-400" />
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            onChange={handleFileChange}
                            className="text-sm text-slate-600"
                        />
                    </div>
                </div>

                {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
                {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                    <Camera size={16} />
                    {submitting ? "Saving…" : "Mark Vishist Attendance"}
                </button>
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h4 className="mb-3 text-sm font-semibold text-slate-900">Today's Vishist Attendance</h4>
                {loadingRecords ? (
                    <p className="text-sm text-slate-500">Loading…</p>
                ) : records.length === 0 ? (
                    <p className="text-sm text-slate-400">No Vishist attendance marked yet today.</p>
                ) : (
                    <div className="space-y-3">
                        {records.map((r) => (
                            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                {r.photoUrl ? (
                                    <img src={r.photoUrl} alt={r.vishistName} className="h-12 w-12 rounded-lg object-cover" />
                                ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                                        <ImageOff size={16} />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-900">{r.vishistName}</p>
                                    <p className="truncate text-xs text-slate-500">{r.subject} — {r.topicTaught}</p>
                                </div>
                                {r.status === "approved" ? (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        <Check size={12} /> Approved
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={approvingId === r.id}
                                        onClick={() => handleApprove(r.id)}
                                        className="shrink-0 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        {approvingId === r.id ? "Approving…" : "Approve"}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}