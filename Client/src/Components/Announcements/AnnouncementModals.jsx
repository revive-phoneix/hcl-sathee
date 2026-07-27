const isPdf = (announcement) => {
  const type = String(announcement.attachmentType || "").toLowerCase();
  const name = String(announcement.attachmentName || "").toLowerCase();
  const url = String(announcement.attachmentUrl || "").toLowerCase();
  return type.includes("pdf") || name.endsWith(".pdf") || url.includes(".pdf");
};

const isImage = (announcement) => {
  const type = String(announcement.attachmentType || "").toLowerCase();
  const name = String(announcement.attachmentName || "").toLowerCase();
  return (
    type.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp)$/i.test(name)
  );
};

export function ConfirmDeleteModal({ title, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-black">
      <div className="bg-white rounded-3xl p-10 max-w-md text-center">
        <div className="text-5xl mb-6">🗑️</div>
        <h3 className="text-2xl font-bold mb-3">Delete Announcement?</h3>
        <p className="text-slate-600 mb-8">
          Are you sure you want to delete <strong>"{title}"</strong>?
        </p>
        <div className="flex gap-4 justify-center">
          <button onClick={onCancel} className="px-8 py-3 border rounded-2xl">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-8 py-3 bg-red-600 text-white rounded-2xl"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function ViewModal({ announcement, onClose }) {
  if (!announcement) return null;

  const hasAttachment = Boolean(announcement.attachmentUrl);
  const pdf = hasAttachment && isPdf(announcement);
  const image = hasAttachment && isImage(announcement);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-auto">
        <div className="p-8 border-b bg-gradient-to-r from-blue-50 to-red-50 text-black">
          <button
            type="button"
            onClick={onClose}
            className="float-right text-3xl text-slate-400"
          >
            ×
          </button>
          <h2 className="text-2xl font-bold pr-8">{announcement.title}</h2>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            {announcement.category ? (
              <span className="rounded-full bg-white px-3 py-1 border border-sky-100">
                {announcement.category}
              </span>
            ) : null}
            {announcement.priority ? (
              <span className="rounded-full bg-white px-3 py-1 border border-sky-100">
                {announcement.priority} priority
              </span>
            ) : null}
            {announcement.postedOn ? (
              <span className="rounded-full bg-white px-3 py-1 border border-sky-100">
                {announcement.postedOn}
              </span>
            ) : null}
          </div>
        </div>

        <div className="p-8 text-slate-700 leading-relaxed whitespace-pre-wrap">
          {announcement.description}
        </div>

        {hasAttachment ? (
          <div className="px-8 pb-8">
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Attachment</p>
                  <p className="text-sm text-slate-600 mt-1 break-all">
                    {announcement.attachmentName || "Attached document"}
                  </p>
                </div>
                <a
                  href={announcement.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Open / Download
                </a>
              </div>

              {pdf ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <iframe
                    title={announcement.attachmentName || "PDF attachment"}
                    src={announcement.attachmentUrl}
                    className="h-[420px] w-full"
                  />
                </div>
              ) : null}

              {image ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                  <img
                    src={announcement.attachmentUrl}
                    alt={announcement.attachmentName || "Announcement attachment"}
                    className="max-h-[420px] w-full object-contain"
                  />
                </div>
              ) : null}

              {!pdf && !image ? (
                <p className="mt-3 text-sm text-slate-500">
                  Preview is not available for this file type. Use Open / Download to view it.
                </p>
              ) : null}
            </div>
          </div>
        ) : announcement.attachmentName ? (
          <div className="px-8 pb-8">
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Attachment listed as <strong>{announcement.attachmentName}</strong>, but the
              file was not uploaded. Re-edit and attach the document again.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
