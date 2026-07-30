export default function EmptyState({ readOnly, onUploadClick }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 gap-5">
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl"
        style={{ background: "#ccd2dd" }}
      >
        📅
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-gray-800">No Schedule Available</p>
        <p className="text-sm text-gray-500 mt-1 max-w-xs leading-relaxed">
          {readOnly
            ? "No teaching schedule has been uploaded for this centre yet."
            : "Upload an Excel or CSV schedule. It saves to the cloud automatically so phones can see it."}
        </p>
      </div>
      {!readOnly ? (
        <button
          type="button"
          onClick={onUploadClick}
          className="mt-1 px-6 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
        >
          Upload Schedule
        </button>
      ) : null}
    </div>
  );
}
