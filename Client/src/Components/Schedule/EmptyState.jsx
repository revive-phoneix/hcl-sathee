import { Download } from "lucide-react";

export default function EmptyState({ readOnly, onUploadClick, onDownloadTemplate }) {
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
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onUploadClick}
            className="mt-1 px-6 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
          >
            Upload Schedule
          </button>
          {onDownloadTemplate ? (
            <p className="text-xs text-gray-500">
              New to this?{" "}
              <button
                type="button"
                onClick={onDownloadTemplate}
                className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <Download size={12} /> Download the template
              </button>{" "}
              so the columns line up.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
