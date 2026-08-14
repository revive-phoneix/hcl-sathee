const { getDb, withStorageBucket } = require("../config/firebase");
const path = require("path");
const { toDate } = require("../Utils/firestoreHelpers");

const COLLECTION = "vishistAttendances";
const attendancesRef = () => getDb().collection(COLLECTION);

const uploadPhotoToBucket = async (bucket, file, vishistUserId, date) => {
  const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
  const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
  const storagePath = `vishist-attendance/${vishistUserId}/${date}/${Date.now()}${safeExt}`;
  const storageFile = bucket.file(storagePath);

  await storageFile.save(file.buffer, {
    metadata: { contentType: file.mimetype || "image/jpeg", cacheControl: "public, max-age=31536000" },
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

const toApiRecord = (docId, data) => ({
  id: docId,
  vishistUserId: data.vishistUserId ?? null,
  vishistName: data.vishistName ?? null,
  vishistEmail: data.vishistEmail ?? null,
  centre: data.centre ?? null,
  subject: data.subject ?? null,
  topicTaught: data.topicTaught ?? null,
  photoUrl: data.photoUrl ?? null,
  photoPath: data.photoPath ?? null,
  markedByUserId: data.markedByUserId ?? null,
  markedByName: data.markedByName ?? null,
  date: data.date ?? null,
  created_at: toDate(data.created_at),
  status: data.status || "pending",
approvedByUserId: data.approvedByUserId ?? null,
approvedAt: toDate(data.approvedAt),
});

const create = async ({
  vishistUserId, vishistName, vishistEmail, centre,
  subject, topicTaught, date, file, markedByUserId, markedByName,
}) => {
  if (!vishistUserId || !subject || !topicTaught || !date) {
    throw new Error("vishistUserId, subject, topicTaught and date are required");
  }

  let photoUrl = null;
  let photoPath = null;
  if (file?.buffer?.length) {
    const uploaded = await withStorageBucket((bucket) =>
      uploadPhotoToBucket(bucket, file, vishistUserId, date)
    );
    photoUrl = uploaded.url;
    photoPath = uploaded.storagePath;
  }

  const docData = {
    vishistUserId: Number(vishistUserId) || vishistUserId,
    vishistName: vishistName || null,
    vishistEmail: vishistEmail || null,
    centre: centre || null,
    subject,
    topicTaught,
    photoUrl,
    photoPath,
    markedByUserId: markedByUserId ?? null,
    markedByName: markedByName || null,
    date,
    created_at: new Date(),
    status: "pending",
  };

  const ref = await attendancesRef().add(docData);
  return toApiRecord(ref.id, docData);
};

const approve = async (recordId, approvedByUserId) => {
  const ref = attendancesRef().doc(recordId);
  const doc = await ref.get();
  if (!doc.exists) {
    const err = new Error("Vishist attendance record not found");
    err.status = 404;
    throw err;
  }
  if (doc.data().status === "approved") {
    const err = new Error("This attendance is already approved");
    err.status = 400;
    throw err;
  }

  await ref.update({ status: "approved", approvedByUserId, approvedAt: new Date() });
  const updated = await ref.get();
  return toApiRecord(updated.id, updated.data());
};

const findByDate = async (date, centre = null, status = null) => {
  const snap = await attendancesRef().where("date", "==", date).get();
  let rows = snap.docs.map((doc) => toApiRecord(doc.id, doc.data()));
  if (centre) {
    const { matchesCentre } = require("../Utils/centreMatch");
    rows = rows.filter((r) => matchesCentre(r.centre, centre));
  }
  if (status) {
    rows = rows.filter((r) => r.status === status);
  }
  return rows.sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0));
};

module.exports = { create, findByDate, approve };