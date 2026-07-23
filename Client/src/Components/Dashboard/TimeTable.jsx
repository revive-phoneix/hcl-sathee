import { useEffect, useRef, useState } from "react";
import { Calendar, Upload, X } from "lucide-react";

const timetableData = [
  {
    day: "Monday",
    date: "06",
    classes: [
      { time: "09:00 - 10:30", subject: "Mathematics" },
      { time: "11:00 - 12:30", subject: "Physics" },
      { time: "14:00 - 15:30", subject: "Chemistry" },
    ],
  },
  {
    day: "Tuesday",
    date: "07",
    classes: [
      { time: "09:00 - 10:30", subject: "English" },
      { time: "11:00 - 12:30", subject: "Biology" },
    ],
  },
  {
    day: "Wednesday",
    date: "08",
    classes: [
      { time: "09:00 - 10:30", subject: "Mathematics" },
      { time: "11:00 - 12:30", subject: "History" },
      { time: "14:00 - 15:30", subject: "Computer Science" },
    ],
  },
  {
    day: "Thursday",
    date: "09",
    classes: [
      { time: "09:00 - 10:30", subject: "Physics" },
      { time: "11:00 - 12:30", subject: "Chemistry" },
    ],
  },
  {
    day: "Friday",
    date: "10",
    classes: [
      { time: "09:00 - 10:30", subject: "English" },
      { time: "11:00 - 12:30", subject: "Mathematics" },
      { time: "14:00 - 15:30", subject: "Biology" },
    ],
  },
];

export default function TimeTable({ isOpen, onClose }) {
  const backdropRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", onKeyDown);
    }

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setUploadedFile(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (event) => {
    if (event.target === backdropRef.current) {
      onClose();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setUploadedFile(file);
    event.target.value = "";
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-[#3B82F6]/30">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center">
              <Calendar size={24} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-black">Timetable</h2>
              <p className="text-sm text-gray-600">July 2026 - Centre Classes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {timetableData.map((day) => (
              <div
                key={`${day.day}-${day.date}`}
                className="bg-[#f8fafc] border border-gray-200 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-semibold text-lg text-black">{day.day}</div>
                    <div className="text-sm text-gray-500">July {day.date}</div>
                  </div>
                  <div className="text-xs px-3 py-1 bg-violet-100 text-violet-700 rounded-full font-medium">
                    {day.classes.length} classes
                  </div>
                </div>

                <div className="space-y-3">
                  {day.classes.map((item) => (
                    <div
                      key={`${day.day}-${item.time}-${item.subject}`}
                      className="bg-white border border-gray-100 rounded-xl p-3 text-sm"
                    >
                      <div className="font-mono text-violet-600 font-medium mb-1">{item.time}</div>
                      <div className="font-medium text-black">{item.subject}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {uploadedFile ? (
            <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-violet-800 truncate">{uploadedFile.name}</p>
                <p className="text-xs text-violet-600 mt-0.5">
                  {(uploadedFile.size / 1024).toFixed(1)} KB · ready to use
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadedFile(null)}
                className="shrink-0 text-violet-600 hover:text-violet-800 text-xs font-semibold"
              >
                Remove
              </button>
            </div>
          ) : null}

          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700">
            <strong>Note:</strong> Timetable is subject to change. Please check with the centre administrator for updates.
          </div>
        </div>

        <div className="p-6 border-t flex flex-wrap items-center justify-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 border border-violet-300 text-violet-700 rounded-2xl hover:bg-violet-50 transition-colors font-medium inline-flex items-center gap-2"
          >
            <Upload size={18} />
            Upload
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-[#0F172A] text-white rounded-2xl hover:bg-black transition-colors font-medium"
          >
            Close Timetable
          </button>
        </div>
      </div>
    </div>
  );
}
