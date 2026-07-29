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

/** Normalize other-centres to null or a non-empty string array. */
const normalizeOtherCentres = (value) => {
  if (value == null || value === "") return null;
  let list = value;
  if (typeof value === "string") {
    try {
      list = JSON.parse(value);
    } catch {
      list = value.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(list)) return null;
  const cleaned = [
    ...new Set(
      list
        .map((c) => String(c || "").trim())
        .filter(Boolean)
    ),
  ];
  return cleaned.length ? cleaned : null;
};

const toApiAnnouncement = (docId, data) => ({
  id: Number(docId) || docId,
  title: data.title,
  description: data.description,
  category: data.category || "General",
  priority: data.priority || "Medium",
  postedBy: data.postedBy || "Admin",
  centre: data.centre ?? null,
  otherCentres: normalizeOtherCentres(
    data.otherCentres ?? data["other-centres"]
  ),
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

const MAX_INLINE_BYTES = 600 * 1024;

const toInlineDataUrl = (file) => {
  if (!file?.buffer) {
    throw new Error("Attachment file is missing or empty");
  }
  if (file.buffer.length > MAX_INLINE_BYTES) {
    throw new Error(
      "Attachment is too large for inline storage (max 600 KB). Enable Firebase Storage or use a smaller file."
    );
  }
  const contentType = file.mimetype || "application/octet-stream";
  const originalName = String(file.originalname || "attachment").trim();
  return {
    attachmentName: originalName,
    attachmentUrl: `data:${contentType};base64,${file.buffer.toString("base64")}`,
    attachmentType: contentType,
    attachmentPath: null,
  };
};

const uploadAttachment = async (file) => {
  if (!file?.buffer) {
    throw new Error("Attachment file is missing or empty");
  }

  const originalName = String(file.originalname || "attachment").trim();
  const ext = path.extname(originalName).toLowerCase() || "";
  const safeExt = ALLOWED_EXTS.includes(ext) ? ext : ".bin";
  const contentType = file.mimetype || "application/octet-stream";

  try {
    const storagePath = `announcements/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}${safeExt}`;
    const bucket = getBucket();
    const storageFile = bucket.file(storagePath);

    await storageFile.save(file.buffer, {
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000",
        metadata: { originalName },
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

    return {
      attachmentName: originalName || `attachment${safeExt}`,
      attachmentUrl: url,
      attachmentType: contentType,
      attachmentPath: storagePath,
    };
  } catch (storageErr) {
    console.error("Firebase Storage upload failed, using inline fallback:", storageErr);
    try {
      return toInlineDataUrl(file);
    } catch (inlineErr) {
      throw new Error(
        `Attachment upload failed: ${storageErr.message || "storage error"}. ${inlineErr.message}`
      );
    }
  }
};

const create = async (data) => {
  const now = new Date();
  const id = await getNextId();
  const otherCentres = normalizeOtherCentres(
    data.otherCentres ?? data["other-centres"]
  );
  const payload = {
    id,
    title: data.title,
    description: data.description,
    category: data.category || "General",
    priority: data.priority || "Medium",
    postedBy: data.postedBy || "Admin",
    centre: data.centre ?? null,
    otherCentres,
    "other-centres": otherCentres,
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

  if (
    Object.prototype.hasOwnProperty.call(updated, "otherCentres") ||
    Object.prototype.hasOwnProperty.call(updated, "other-centres")
  ) {
    const otherCentres = normalizeOtherCentres(
      updated.otherCentres ?? updated["other-centres"]
    );
    updated.otherCentres = otherCentres;
    updated["other-centres"] = otherCentres;
  }

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
    otherCentres: null,
    "other-centres": null,
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
