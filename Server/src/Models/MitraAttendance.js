const { getDb, withStorageBucket } = require("../config/firebase");
const path = require("path");
const { toDate } = require("../Utils/firestoreHelpers");

const COLLECTION = "mitraAttendances";
const MAX_INLINE_BYTES = 700 * 1024;

const attendancesRef = () => getDb().collection(COLLECTION);

const resolvePercentage = (value, fallback = 0) => {
  if (
    value != null &&
    value !== "" &&
    Number.isFinite(Number(value))
  ) {
    return Math.max(0, Math.min(100, Number(value)));
  }
  return fallback;
};

const resolveAttendancePercentages = (data = {}, fallback = {}) => {
  const dailyFallback = resolvePercentage(fallback.dailyAttendancePercentage, 100);
  const weeklyFallback = resolvePercentage(
    fallback.weeklyAttendancePercentage,
    dailyFallback
  );
  const monthlyFallback = resolvePercentage(
    fallback.monthlyAttendancePercentage,
    weeklyFallback
  );

  return {
    dailyAttendancePercentage: resolvePercentage(
      data.dailyAttendancePercentage,
      dailyFallback
    ),
    weeklyAttendancePercentage: resolvePercentage(
      data.weeklyAttendancePercentage,
      weeklyFallback
    ),
    monthlyAttendancePercentage: resolvePercentage(
      data.monthlyAttendancePercentage,
      monthlyFallback
    ),
  };
};

const toApiRecord = (docId, data) => {
  const percentages = resolveAttendancePercentages(data, {
    dailyAttendancePercentage: data.dailyAttendancePercentage,
    weeklyAttendancePercentage: data.weeklyAttendancePercentage,
    monthlyAttendancePercentage: data.monthlyAttendancePercentage,
  });

  return {
    id: docId,
    userId: data.userId,
    name: data.name ?? null,
    email: data.email ?? null,
    centre: data.centre ?? null,
    centreId: data.centreId ?? null,
    date: data.date,
    arrivalPhotoUrl: data.arrivalPhotoUrl ?? null,
    arrivalTime: toDate(data.arrivalTime),
    departurePhotoUrl: data.departurePhotoUrl ?? null,
    departureTime: toDate(data.departureTime),
    approved: Boolean(data.approved),
approvedBy: data.approvedBy ?? null,
approvedAt: toDate(data.approvedAt),
    dailyAttendancePercentage: percentages.dailyAttendancePercentage,
    weeklyAttendancePercentage: percentages.weeklyAttendancePercentage,
    monthlyAttendancePercentage: percentages.monthlyAttendancePercentage,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
};

const buildDocId = (userId, date) => `${userId}_${date}`;

const APPROVAL_WINDOW_HOURS = 24;

const approveAttendance = async (userId, date, approvedBy) => {
  const docId = buildDocId(userId, date);
  const ref = attendancesRef().doc(docId);
  const doc = await ref.get();
  if (!doc.exists) {
    const err = new Error("Attendance record not found");
    err.status = 404;
    throw err;
  }

  const data = doc.data();
  if (!data.arrivalTime) {
    const err = new Error("Cannot approve attendance with no arrival record");
    err.status = 400;
    throw err;
  }
  if (data.approved) {
    const err = new Error("This attendance is already approved");
    err.status = 400;
    throw err;
  }

  const arrival = toDate(data.arrivalTime);
  const hoursSince = (Date.now() - arrival.getTime()) / (1000 * 60 * 60);
  if (hoursSince > APPROVAL_WINDOW_HOURS) {
    const err = new Error("Approval window has expired (24 hours)");
    err.status = 400;
    throw err;
  }

  await ref.update({
    approved: true,
    approvedBy,
    approvedAt: new Date(),
    updated_at: new Date(),
  });

  const updated = await ref.get();
  return toApiRecord(updated.id, updated.data());
};

const findByDate = async (date) => {
  const snap = await attendancesRef().where("date", "==", date).get();
  return snap.docs.map((doc) => toApiRecord(doc.id, doc.data()));
};

const findByDateRange = async (fromDate, toDate) => {
  const snap = await attendancesRef()
    .where("date", ">=", fromDate)
    .where("date", "<=", toDate)
    .get();
  return snap.docs.map((doc) => toApiRecord(doc.id, doc.data()));
};

const findByUserAndDate = async (userId, date) => {
  const docId = buildDocId(userId, date);
  const doc = await attendancesRef().doc(docId).get();
  if (!doc.exists) return null;
  return toApiRecord(doc.id, doc.data());
};

const toInlinePhoto = (file) => {
  if (!file?.buffer?.length) {
    throw new Error("Photo file is missing or empty");
  }
  if (file.buffer.length > MAX_INLINE_BYTES) {
    throw new Error(
      "Photo is too large for fallback storage (max ~700 KB). Enable Firebase Storage or use a smaller image."
    );
  }
  const contentType = file.mimetype || "image/jpeg";
  return {
    url: `data:${contentType};base64,${file.buffer.toString("base64")}`,
    storagePath: null,
  };
};

const uploadPhotoToBucket = async (bucket, file, userId, date, type) => {
  const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
  const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
  const storagePath = `mitra-attendance/${userId}/${date}/${type}-${Date.now()}${safeExt}`;
  const storageFile = bucket.file(storagePath);

  await storageFile.save(file.buffer, {
    metadata: {
      contentType: file.mimetype || "image/jpeg",
      cacheControl: "public, max-age=31536000",
    },
    resumable: false,
  });

  let url;
  try {
    const [signedUrl] = await storageFile.getSignedUrl({
      action: "read",
      expires: new Date("2500-01-01T00:00:00.000Z"),
    });
    url = signedUrl;
  } catch {
    await storageFile.makePublic();
    url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
  }

  return { url, storagePath };
};

const uploadPhoto = async (file, userId, date, type) => {
  if (!file?.buffer?.length) {
    throw new Error("Photo file is missing or empty");
  }

  try {
    return await withStorageBucket((bucket) =>
      uploadPhotoToBucket(bucket, file, userId, date, type)
    );
  } catch (storageErr) {
    console.error(
      "Firebase Storage upload failed, using inline fallback:",
      storageErr?.message || storageErr
    );
    try {
      return toInlinePhoto(file);
    } catch (inlineErr) {
      throw new Error(
        `Photo upload failed: ${storageErr.message || "storage error"}. ${inlineErr.message}`
      );
    }
  }
};

const upsertCheckIn = async ({
  userId,
  name,
  email = null,
  centre,
  centreId = null,
  date,
  type,
  file,
  dailyAttendancePercentage = null,
  weeklyAttendancePercentage = null,
  monthlyAttendancePercentage = null,
}) => {
  const docId = buildDocId(userId, date);
  const ref = attendancesRef().doc(docId);
  const existing = await ref.get();
  const now = new Date();

  const { url, storagePath } = await uploadPhoto(file, userId, date, type);

  const base = existing.exists
    ? existing.data()
    : {
        id: docId,
        userId: Number(userId) || userId,
        name: name || null,
        email: email || null,
        centre: centre || null,
        centreId: centreId || null,
        date,
        arrivalPhotoUrl: null,
        arrivalPhotoPath: null,
        arrivalTime: null,
        departurePhotoUrl: null,
        departurePhotoPath: null,
        departureTime: null,
        created_at: now,
      };

  const percentages = resolveAttendancePercentages(
    {
      dailyAttendancePercentage,
      weeklyAttendancePercentage,
      monthlyAttendancePercentage,
    },
    {
      dailyAttendancePercentage: base.dailyAttendancePercentage,
      weeklyAttendancePercentage: base.weeklyAttendancePercentage,
      monthlyAttendancePercentage: base.monthlyAttendancePercentage,
    }
  );

  const patch =
    type === "arrival"
      ? {
          arrivalPhotoUrl: url,
          arrivalPhotoPath: storagePath,
          arrivalTime: now,
          name: name || base.name || null,
          email: email || base.email || null,
          centre: centre || base.centre || null,
        }
      : {
          departurePhotoUrl: url,
          departurePhotoPath: storagePath,
          departureTime: now,
          name: name || base.name || null,
          email: email || base.email || null,
          centre: centre || base.centre || null,
        };

  const payload = {
    ...base,
    ...patch,
    dailyAttendancePercentage: percentages.dailyAttendancePercentage,
    weeklyAttendancePercentage: percentages.weeklyAttendancePercentage,
    monthlyAttendancePercentage: percentages.monthlyAttendancePercentage,
    updated_at: now,
  };

  await ref.set(payload, { merge: true });
  return toApiRecord(docId, payload);
};

module.exports = {
  findByDate,
  findByDateRange,
  findByUserAndDate,
  upsertCheckIn,
  resolvePercentage,
  resolveAttendancePercentages,
  approveAttendance,
};
