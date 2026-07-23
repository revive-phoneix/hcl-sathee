export function ConfirmDeleteModal({ title, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-black">
      <div className="bg-white rounded-3xl p-10 max-w-md text-center">
        <div className="text-5xl mb-6">🗑️</div>
        <h3 className="text-2xl font-bold mb-3">Delete Announcement?</h3>
        <p className="text-slate-600 mb-8">Are you sure you want to delete <strong>"{title}"</strong>?</p>
        <div className="flex gap-4 justify-center">
          <button onClick={onCancel} className="px-8 py-3 border rounded-2xl">Cancel</button>
          <button onClick={onConfirm} className="px-8 py-3 bg-red-600 text-white rounded-2xl">Delete</button>
        </div>
      </div>
    </div>
  );
}

export function ViewModal({ announcement, onClose }) {
  if (!announcement) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="p-8 border-b bg-gradient-to-r from-blue-50 to-red-50 text-black">
          <button onClick={onClose} className="float-right text-3xl text-slate-400">×</button>
          <h2 className="text-2xl font-bold pr-8">{announcement.title}</h2>
        </div>
        <div className="p-8 text-slate-700 leading-relaxed">
          {announcement.description}
        </div>
      </div>
    </div>
  );
}