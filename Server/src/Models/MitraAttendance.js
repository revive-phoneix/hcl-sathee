const { getDb, getBucket } = require("../config/firebase");
const path = require("path");
const { toDate } = require("../Utils/firestoreHelpers");

const COLLECTION = "mitraAttendances";

const attendancesRef = () => getDb().collection(COLLECTION);

const toApiRecord = (docId, data) => ({
  id: docId,
  userId: data.userId,
  name: data.name ?? null,
  centre: data.centre ?? null,
  centreId: data.centreId ?? null,
  date: data.date,
  arrivalPhotoUrl: data.arrivalPhotoUrl ?? null,
  arrivalTime: toDate(data.arrivalTime),
  departurePhotoUrl: data.departurePhotoUrl ?? null,
  departureTime: toDate(data.departureTime),
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
});

const buildDocId = (userId, date) => `${userId}_${date}`;

const findByDate = async (date) => {
  const snap = await attendancesRef().where("date", "==", date).get();
  return snap.docs.map((doc) => toApiRecord(doc.id, doc.data()));
};

const findByUserAndDate = async (userId, date) => {
  const docId = buildDocId(userId, date);
  const doc = await attendancesRef().doc(docId).get();
  if (!doc.exists) return null;
  return toApiRecord(doc.id, doc.data());
};

const uploadPhoto = async (file, userId, date, type) => {
  const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
  const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
  const storagePath = `mitra-attendance/${userId}/${date}/${type}-${Date.now()}${safeExt}`;
  const bucket = getBucket();
  const storageFile = bucket.file(storagePath);

  await storageFile.save(file.buffer, {
    metadata: {
      contentType: file.mimetype || "image/jpeg",
      cacheControl: "public, max-age=31536000",
    },
    resumable: false,
  });

  // Long-lived signed URL for viewing photos in the admin UI
  const [url] = await storageFile.getSignedUrl({
    action: "read",
    expires: "03-01-2500",
  });

  return { url, storagePath };
};

const upsertCheckIn = async ({
  userId,
  name,
  centre,
  centreId = null,
  date,
  type,
  file,
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

  const patch =
    type === "arrival"
      ? {
          arrivalPhotoUrl: url,
          arrivalPhotoPath: storagePath,
          arrivalTime: now,
          name: name || base.name || null,
          centre: centre || base.centre || null,
        }
      : {
          departurePhotoUrl: url,
          departurePhotoPath: storagePath,
          departureTime: now,
          name: name || base.name || null,
          centre: centre || base.centre || null,
        };

  const payload = {
    ...base,
    ...patch,
    updated_at: now,
  };

  await ref.set(payload, { merge: true });
  return toApiRecord(docId, payload);
};

module.exports = {
  findByDate,
  findByUserAndDate,
  upsertCheckIn,
};
