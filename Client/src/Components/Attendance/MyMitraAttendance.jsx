import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Clock, ImageOff, Upload } from "lucide-react";
import {
  fetchMitraAttendance,
  uploadMitraAttendancePhoto,
} from "../../services/mitraAttendance";
import { fetchCurrentUser } from "../../services/users";
import { getApiErrorMessage } from "../../utils/apiRequest";
import { getAuthPayload } from "../../utils/authToken";
import { compressImageForUpload } from "../../utils/compressImage";
import { getCentreValueFromPortal } from "../../utils/portalMapping";

const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const toInputDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function LockedField({ label, value }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        value={value || ""}
        readOnly
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 cursor-not-allowed"
      />
    </div>
  );
}

function UploadCard({
  title,
  photoUrl,
  time,
  uploading,
  disabled,
  onFile,
  inputRef,
  allowUpload,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <Clock size={12} />
            Uploaded at:{" "}
            <span className="font-medium tabular-nums text-slate-700">
              {formatTime(time)}
            </span>
          </p>
        </div>
        <Camera size={18} className="text-blue-500" />
      </div>

      <div className="mb-4 flex h-48 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
        {photoUrl ? (
          <img src={photoUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <ImageOff size={28} />
            <span className="text-xs font-medium uppercase tracking-wide">No photo yet</span>
          </div>
        )}
      </div>

      {allowUpload ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onFile(file);
            }}
          />

          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload size={16} />
            {uploading
              ? "Uploading…"
              : photoUrl
                ? `Replace ${title} photo`
                : `Upload ${title} photo`}
          </button>
        </>
      ) : null}
    </div>
  );
}

export default function MyMitraAttendance({
  userId: sessionUserId,
  userName: sessionUserName,
  userEmail: sessionUserEmail,
  userCentre: sessionUserCentre,
  portalName,
  selectedDate,
  allowUpload = true,
}) {
  const today = toInputDate();
  const date = selectedDate || today;
  const isToday = date === today;

  const arrivalRef = useRef(null);
  const departureRef = useRef(null);

  const [profile, setProfile] = useState(() => {
    const tokenUser = getAuthPayload();
    return {
      id: sessionUserId ?? tokenUser?.id ?? null,
      name: sessionUserName || "",
      email: sessionUserEmail || tokenUser?.email || "",
      centre:
        sessionUserCentre ||
        tokenUser?.centre ||
        getCentreValueFromPortal(portalName) ||
        null,
    };
  });
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const resolveFromToken = useCallback(() => {
    const tokenUser = getAuthPayload();
    return {
      id: sessionUserId ?? tokenUser?.id ?? null,
      name: sessionUserName || "",
      email: sessionUserEmail || tokenUser?.email || "",
      centre:
        sessionUserCentre ||
        tokenUser?.centre ||
        getCentreValueFromPortal(portalName) ||
        null,
    };
  }, [
    sessionUserId,
    sessionUserName,
    sessionUserEmail,
    sessionUserCentre,
    portalName,
  ]);

  const loadProfile = useCallback(async () => {
    const fallback = resolveFromToken();
    try {
      const user = await fetchCurrentUser();
      setProfile({
        id: user?.id ?? fallback.id,
        name: user?.name || fallback.name,
        // Prefer DB email from /me; otherwise JWT/session (admin-created login email).
        email: user?.email || fallback.email,
        centre: user?.centre || fallback.centre,
      });
    } catch (err) {
      // /users/me may 404 until server deploy; JWT still has admin email.
      console.warn("Load current user failed, using session/token:", err?.message || err);
      setProfile(fallback);
    }
  }, [resolveFromToken]);

  const loadRecord = useCallback(async () => {
    const uid = profile.id;
    if (!date || !uid) {
      setRecord(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const records = await fetchMitraAttendance(date);
      const mine =
        records.find((r) => String(r.userId) === String(uid)) || null;
      setRecord(mine);
    } catch (err) {
      console.error("Load own mitra attendance error:", err);
      setError(getApiErrorMessage(err, "Unable to load your attendance"));
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [date, profile.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  const handleUpload = async (type, file) => {
    if (!isToday) {
      setError("You can only upload photos for today’s attendance.");
      return;
    }
    if (!profile.id) {
      setError("Your account id is missing. Please sign out and sign in again.");
      return;
    }
    if (!profile.email) {
      setError("Your account email was not found. Contact admin.");
      return;
    }

    setUploadingType(type);
    setError("");
    setMessage("");
    try {
      const compressed = await compressImageForUpload(file);
      const saved = await uploadMitraAttendancePhoto({
        userId: profile.id,
        name: profile.name,
        email: profile.email,
        centre: profile.centre,
        centreId: profile.centre,
        date,
        type,
        file: compressed,
      });
      setRecord(saved);
      setMessage(
        `${type === "arrival" ? "Arrival" : "Departure"} photo uploaded at ${formatTime(
          type === "arrival" ? saved.arrivalTime : saved.departureTime
        )}.`
      );
    } catch (err) {
      console.error("Upload mitra photo error:", err);
      setError(getApiErrorMessage(err, "Unable to upload photo"));
    } finally {
      setUploadingType("");
    }
  };

  return (
    <div className="space-y-5 px-5 py-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">My Attendance</p>
        <p className="mt-1 text-xs text-slate-500">
          Upload arrival and departure photos for{" "}
          <span className="font-medium text-slate-700">{date}</span>.
          {isToday
            ? " Time is recorded automatically when you upload."
            : " Past days are view-only. New uploads open again tomorrow."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LockedField label="Name" value={profile.name} />
        <LockedField label="Email" value={profile.email} />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading attendance…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <UploadCard
            title="Arrival"
            photoUrl={record?.arrivalPhotoUrl}
            time={record?.arrivalTime}
            uploading={uploadingType === "arrival"}
            disabled={!isToday || Boolean(uploadingType)}
            onFile={(file) => handleUpload("arrival", file)}
            inputRef={arrivalRef}
            allowUpload={allowUpload}
          />
          <UploadCard
            title="Departure"
            photoUrl={record?.departurePhotoUrl}
            time={record?.departureTime}
            uploading={uploadingType === "departure"}
            disabled={!isToday || Boolean(uploadingType)}
            onFile={(file) => handleUpload("departure", file)}
            inputRef={departureRef}
            allowUpload={allowUpload}
          />
        </div>
      )}
    </div>
  );
}
