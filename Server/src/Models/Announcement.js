const path = require("path");
const { getSupabase, assertNoError, paginateByCreatedAt } = require("../config/supabase");
const { uploadToStorage } = require("../config/storage");
const { toDate } = require("../Utils/firestoreHelpers");

const TABLE = "announcements";
const ALLOWED_EXTS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"];

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

const toApiAnnouncement = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category || "General",
    priority: row.priority || "Medium",
    postedBy: row.posted_by || "Admin",
    centre: row.centre ?? null,
    otherCentres: normalizeOtherCentres(row.other_centres),
    attachmentName: row.attachment_name ?? null,
    attachmentUrl: row.attachment_url ?? null,
    attachmentType: row.attachment_type ?? null,
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };
};

const findAll = async ({ limit = 200, cursor } = {}) => {
  const { rows, nextCursor } = await paginateByCreatedAt(TABLE, { limit, cursor });
  const announcements = rows.map(toApiAnnouncement);
  Object.defineProperty(announcements, "nextCursor", { value: nextCursor, enumerable: false });
  return announcements;
};

const findById = async (id) => {
  const { data, error } = await getSupabase().from(TABLE).select("*").eq("id", id).maybeSingle();
  assertNoError(error, "Failed to find announcement");
  return toApiAnnouncement(data);
};

const MAX_INLINE_BYTES = 600 * 1024;

const toInlineDataUrl = (file) => {
  if (!file?.buffer) {
    throw new Error("Attachment file is missing or empty");
  }
  if (file.buffer.length > MAX_INLINE_BYTES) {
    throw new Error(
      "Attachment is too large for inline storage (max 600 KB). Enable Supabase Storage or use a smaller file."
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
    const { url } = await uploadToStorage(storagePath, file.buffer, { contentType });

    return {
      attachmentName: originalName || `attachment${safeExt}`,
      attachmentUrl: url,
      attachmentType: contentType,
      attachmentPath: storagePath,
    };
  } catch (storageErr) {
    console.error("Supabase Storage upload failed, using inline fallback:", storageErr);
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
  const otherCentres = normalizeOtherCentres(data.otherCentres ?? data["other-centres"]);
  const payload = {
    title: data.title,
    description: data.description,
    category: data.category || "General",
    priority: data.priority || "Medium",
    posted_by: data.postedBy || "Admin",
    centre: data.centre ?? null,
    other_centres: otherCentres,
    attachment_name: data.attachmentName ?? null,
    attachment_url: data.attachmentUrl ?? null,
    attachment_type: data.attachmentType ?? null,
    attachment_path: data.attachmentPath ?? null,
  };

  const { data: row, error } = await getSupabase().from(TABLE).insert(payload).select("*").single();
  assertNoError(error, "Failed to create announcement");
  return toApiAnnouncement(row);
};

const update = async (id, data) => {
  const patch = {};
  if (data.title !== undefined) patch.title = data.title;
  if (data.description !== undefined) patch.description = data.description;
  if (data.category !== undefined) patch.category = data.category;
  if (data.priority !== undefined) patch.priority = data.priority;
  if (data.postedBy !== undefined) patch.posted_by = data.postedBy;
  if (data.centre !== undefined) patch.centre = data.centre;
  if (data.attachmentName !== undefined) patch.attachment_name = data.attachmentName;
  if (data.attachmentUrl !== undefined) patch.attachment_url = data.attachmentUrl;
  if (data.attachmentType !== undefined) patch.attachment_type = data.attachmentType;
  if (data.attachmentPath !== undefined) patch.attachment_path = data.attachmentPath;

  if (
    Object.prototype.hasOwnProperty.call(data, "otherCentres") ||
    Object.prototype.hasOwnProperty.call(data, "other-centres")
  ) {
    patch.other_centres = normalizeOtherCentres(data.otherCentres ?? data["other-centres"]);
  }

  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  assertNoError(error, "Failed to update announcement");
  return toApiAnnouncement(row);
};

const destroy = async (id) => {
  const { data, error } = await getSupabase().from(TABLE).delete().eq("id", id).select("id");
  assertNoError(error, "Failed to delete announcement");
  return data && data.length ? 1 : 0;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  destroy,
  uploadAttachment,
};
