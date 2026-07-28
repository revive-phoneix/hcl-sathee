import { useState } from "react";

const CENTRE_OPTIONS = [
  "HCL RAJASTHAN",
  "HCL JHARKHAND",
  "HCL MADHYA PRADESH",
];

export default function NewAnnouncementModal({
  onClose,
  onSubmit,
  editData,
  submitting = false,
  defaultCentre = null,
}) {
  const initialCentres = editData?.centre
    ? [editData.centre]
    : defaultCentre
      ? [defaultCentre]
      : [];

  const [form, setForm] = useState({
    title: editData?.title || "",
    category: editData?.category || "JEE",
    description: editData?.description || "",
    priority: editData?.priority || "Medium",
    attachment: null,
    centres: initialCentres,
  });
  const [centreError, setCentreError] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const needsReupload =
    Boolean(editData?.attachmentName) && !editData?.attachmentUrl;

  const toggleCentre = (centre) => {
    setCentreError("");
    setForm((prev) => {
      const selected = prev.centres.includes(centre)
        ? prev.centres.filter((c) => c !== centre)
        : [...prev.centres, centre];
      return { ...prev, centres: selected };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!form.centres.length) {
      setCentreError("Select at least one centre.");
      return;
    }

    if (needsReupload && !form.attachment) {
      setAttachmentError("Please re-attach the PDF/document file before updating.");
      return;
    }

    setAttachmentError("");
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white text-black rounded-3xl w-full max-w-2xl shadow-2xl border border-sky-100 max-h-[92vh] overflow-auto">
        <div className="p-8 border-b flex items-center justify-between bg-gradient-to-r from-blue-350 to-blue-700">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-sky-100 flex items-center justify-center text-3xl">📢</div>
            <div>
              <h2 className="text-2xl font-bold">{editData ? "Edit Announcement" : "New Announcement"}</h2>
              <p className="text-sm text-slate-500">Fill in the details below</p>
            </div>
          </div>
          <button onClick={onClose} className="text-3xl text-slate-400 hover:text-slate-600">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Announcement Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:border-sky-500 outline-none"
              placeholder="JEE Main 2027 Notification"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:border-sky-500 outline-none"
              >
                {["JEE", "NEET", "SSC", "CLAT", "CUET", "General"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:border-sky-500 outline-none"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Centres
              <span className="ml-2 font-normal text-slate-400">
                (select one or more)
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CENTRE_OPTIONS.map((centre) => {
                const checked = form.centres.includes(centre);
                return (
                  <label
                    key={centre}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition ${
                      checked
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 hover:border-sky-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCentre(centre)}
                      className="h-4 w-4 rounded accent-sky-600"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {centre.replace("HCL ", "")}
                    </span>
                  </label>
                );
              })}
            </div>
            {centreError ? (
              <p className="mt-2 text-sm text-red-600">{centreError}</p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={6}
              className="w-full px-5 py-4 border border-slate-200 rounded-3xl focus:border-sky-500 outline-none resize-y"
              placeholder="Write the full announcement..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Attachment{" "}
              <span className="text-slate-400">
                {needsReupload ? "(Required — previous file was not saved)" : "(Optional)"}
              </span>
            </label>

            {needsReupload ? (
              <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Only the filename was saved earlier. Choose the file again so it can be stored and
                previewed.
              </p>
            ) : null}

            <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-sky-200 rounded-3xl cursor-pointer hover:bg-sky-50 transition">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center text-2xl text-sky-600">
                  ⬆
                </div>

                <p className="mt-4 text-blue-600 font-medium">
                  Click to upload <span className="text-slate-500 font-normal">or drag & drop</span>
                </p>

                <p className="text-sm text-slate-400 mt-2">
                  PDF, DOC, DOCX, JPG, PNG — max 10 MB
                </p>

                {form.attachment ? (
                  <p className="mt-3 text-sm text-green-600 font-medium">
                    {form.attachment.name}
                  </p>
                ) : editData?.attachmentName ? (
                  <p className="mt-3 text-sm text-slate-600 font-medium">
                    Current: {editData.attachmentName}
                    {!editData.attachmentUrl ? " (missing file)" : ""}
                  </p>
                ) : null}
              </div>

              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  setAttachmentError("");
                  setForm({
                    ...form,
                    attachment: e.target.files[0],
                  });
                }}
              />
            </label>
            {attachmentError ? (
              <p className="mt-2 text-sm text-red-600">{attachmentError}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button type="button" onClick={onClose} disabled={submitting} className="px-8 py-3 border border-slate-300 rounded-2xl font-medium disabled:opacity-60">Cancel</button>
            <button type="submit" disabled={submitting} className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl font-semibold disabled:opacity-60">
              {submitting
                ? "Saving..."
                : editData
                  ? "Update Announcement"
                  : "Publish Announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
