const { getDb, getBucket } = require("../config/firebase");
const path = require("path");
const {
  toDate,
  findDocRefById: findRef,
  getNextId: nextId,
} = require("../Utils/firestoreHelpers");

const COLLECTION = "announcements";
const ALLOWED_EXTS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"];

const announcementsRef = () => getDb().collection(COLLECTION);
const findDocRefById = (id) => findRef(announcementsRef(), id);
const getNextId = () => nextId(announcementsRef());

const toApiAnnouncement = (docId, data) => ({
  id: Number(docId) || docId,
  title: data.title,
  description: data.description,
  category: data.category || "General",
  priority: data.priority || "Medium",
  postedBy: data.postedBy || "Admin",
  centre: data.centre ?? null,
  attachmentName: data.attachmentName ?? null,
  attachmentUrl: data.attachmentUrl ?? null,
  attachmentType: data.attachmentType ?? null,
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
});

const findAll = async () => {
  const snap = await announcementsRef().orderBy("created_at", "desc").get();
  return snap.docs.map((doc) => toApiAnnouncement(doc.id, doc.data()));
};

const findById = async (id) => {
  const ref = await findDocRefById(id);
  if (!ref) return null;
  const doc = await ref.get();
  return toApiAnnouncement(doc.id, doc.data());
};

const uploadAttachment = async (file) => {
  if (!file?.buffer) {
    throw new Error("Attachment file is missing or empty");
  }

  const originalName = String(file.originalname || "attachment").trim();
  const ext = path.extname(originalName).toLowerCase() || "";
  const safeExt = ALLOWED_EXTS.includes(ext) ? ext : ".bin";
  const storagePath = `announcements/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}${safeExt}`;
  const bucket = getBucket();
  const storageFile = bucket.file(storagePath);
  const contentType = file.mimetype || "application/octet-stream";

  try {
    await storageFile.save(file.buffer, {
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000",
        metadata: {
          originalName,
        },
      },
      resumable: false,
    });
  } catch (err) {
    throw new Error(
      `Failed to upload attachment to storage: ${err.message || "unknown error"}`
    );
  }

  let url;
  try {
    const [signedUrl] = await storageFile.getSignedUrl({
      action: "read",
      expires: new Date("2500-01-01T00:00:00.000Z"),
    });
    url = signedUrl;
  } catch (err) {
    try {
      await storageFile.makePublic();
      url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    } catch (publicErr) {
      throw new Error(
        `Failed to create attachment URL: ${err.message || publicErr.message}`
      );
    }
  }

  return {
    attachmentName: originalName || `attachment${safeExt}`,
    attachmentUrl: url,
    attachmentType: contentType,
    attachmentPath: storagePath,
  };
};

const create = async (data) => {
  const now = new Date();
  const id = await getNextId();
  const payload = {
    id,
    title: data.title,
    description: data.description,
    category: data.category || "General",
    priority: data.priority || "Medium",
    postedBy: data.postedBy || "Admin",
    centre: data.centre ?? null,
    attachmentName: data.attachmentName ?? null,
    attachmentUrl: data.attachmentUrl ?? null,
    attachmentType: data.attachmentType ?? null,
    attachmentPath: data.attachmentPath ?? null,
    created_at: now,
    updated_at: now,
  };

  await announcementsRef().doc(String(id)).set(payload);
  return toApiAnnouncement(String(id), payload);
};

const update = async (id, data) => {
  const ref = await findDocRefById(id);
  if (!ref) return null;

  const updated = { updated_at: new Date() };
  Object.entries(data || {}).forEach(([key, value]) => {
    if (value !== undefined) updated[key] = value;
  });

  // merge:true safely adds new attachment fields on older announcement docs
  await ref.set(updated, { merge: true });
  const doc = await ref.get();
  return toApiAnnouncement(doc.id, doc.data());
};

const destroy = async (id) => {
  const ref = await findDocRefById(id);
  if (!ref) return 0;
  await ref.delete();
  return 1;
};

/** One-time import from MySQL row shape into Firestore (preserves numeric id). */
const importFromMysql = async (row) => {
  const id = row.id;
  const payload = {
    id,
    title: row.title,
    description: row.description,
    category: row.category || "General",
    priority: row.priority || "Medium",
    postedBy: row.postedBy || "Admin",
    centre: row.centre ?? null,
    attachmentName: row.attachmentName ?? null,
    attachmentUrl: row.attachmentUrl ?? null,
    attachmentType: row.attachmentType ?? null,
    attachmentPath: row.attachmentPath ?? null,
    created_at: toDate(row.created_at) || new Date(),
    updated_at: toDate(row.updated_at) || new Date(),
  };

  await announcementsRef().doc(String(id)).set(payload);
  return toApiAnnouncement(String(id), payload);
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  destroy,
  uploadAttachment,
  importFromMysql,
};
