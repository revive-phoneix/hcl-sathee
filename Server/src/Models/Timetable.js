const { getSupabase, assertNoError } = require("../config/supabase");
const { uploadToStorage } = require("../config/storage");
const { toDate } = require("../Utils/firestoreHelpers");
const { getCanonicalCentreKey } = require("../Utils/centreMatch");

const TABLE = "timetables";
const MAX_INLINE_SVG_BYTES = 700 * 1024;

const toApi = (row) => {
  if (!row) return null;
  return {
    id: row.centre_key,
    centre: row.centre ?? null,
    centreKey: row.centre_key,
    kind: row.kind ?? null,
    name: row.name ?? null,
    title: row.title ?? null,
    days: Array.isArray(row.days) ? row.days : null,
    slots: Array.isArray(row.slots) ? row.slots : null,
    dataUrl: row.data_url ?? null,
    storagePath: row.storage_path ?? null,
    updatedAt: toDate(row.updated_at),
    updatedBy: row.updated_by ?? null,
  };
};

const findByCentreKey = async (centreKey) => {
  const key = getCanonicalCentreKey(centreKey);
  if (!key) return null;
  const { data, error } = await getSupabase().from(TABLE).select("*").eq("centre_key", key).maybeSingle();
  assertNoError(error, "Failed to load timetable");
  return toApi(data);
};

const uploadSvgToStorage = async (centreKey, dataUrl) => {
  const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return { dataUrl, storagePath: null };

  const contentType = match[1] || "image/svg+xml";
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length <= MAX_INLINE_SVG_BYTES) {
    return { dataUrl, storagePath: null };
  }

  const storagePath = `timetables/${centreKey}/svg-${Date.now()}.svg`;
  const { url, storagePath: savedPath } = await uploadToStorage(storagePath, buffer, { contentType });
  return { dataUrl: url, storagePath: savedPath };
};

const upsert = async ({
  centre,
  centreKey,
  kind,
  name = null,
  title = null,
  days = null,
  slots = null,
  dataUrl = null,
  updatedBy = null,
}) => {
  const key = getCanonicalCentreKey(centreKey || centre);
  if (!key) throw new Error("Valid centre is required");
  if (kind !== "grid" && kind !== "svg") {
    throw new Error("kind must be grid or svg");
  }

  let storedDataUrl = dataUrl || null;
  let storagePath = null;

  if (kind === "svg" && dataUrl) {
    const uploaded = await uploadSvgToStorage(key, dataUrl);
    storedDataUrl = uploaded.dataUrl;
    storagePath = uploaded.storagePath;
  }

  const payload = {
    centre_key: key,
    centre: centre || null,
    kind,
    name: name || null,
    title: title || null,
    days: kind === "grid" && Array.isArray(days) ? days : null,
    slots: kind === "grid" && Array.isArray(slots) ? slots : null,
    data_url: kind === "svg" ? storedDataUrl : null,
    storage_path: kind === "svg" ? storagePath : null,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy || null,
  };

  const { data, error } = await getSupabase()
    .from(TABLE)
    .upsert(payload, { onConflict: "centre_key" })
    .select("*")
    .single();
  assertNoError(error, "Failed to save timetable");
  return toApi(data);
};

const remove = async (centreKey) => {
  const key = getCanonicalCentreKey(centreKey);
  if (!key) return false;
  const { error } = await getSupabase().from(TABLE).delete().eq("centre_key", key);
  assertNoError(error, "Failed to delete timetable");
  return true;
};

module.exports = {
  findByCentreKey,
  upsert,
  remove,
};
