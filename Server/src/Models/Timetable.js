const { getDb, withStorageBucket } = require("../config/firebase");
const { toDate } = require("../Utils/firestoreHelpers");
const { getCanonicalCentreKey } = require("../Utils/centreMatch");

const COLLECTION = "timetables";
const MAX_INLINE_SVG_BYTES = 700 * 1024;

const timetablesRef = () => getDb().collection(COLLECTION);

const toApi = (docId, data = {}) => ({
  id: docId,
  centre: data.centre ?? null,
  centreKey: docId,
  kind: data.kind ?? null,
  name: data.name ?? null,
  title: data.title ?? null,
  days: Array.isArray(data.days) ? data.days : null,
  slots: Array.isArray(data.slots) ? data.slots : null,
  dataUrl: data.dataUrl ?? null,
  storagePath: data.storagePath ?? null,
  updatedAt: toDate(data.updatedAt) || toDate(data.updated_at),
  updatedBy: data.updatedBy ?? null,
});

const findByCentreKey = async (centreKey) => {
  const key = getCanonicalCentreKey(centreKey);
  if (!key) return null;
  const doc = await timetablesRef().doc(key).get();
  if (!doc.exists) return null;
  return toApi(doc.id, doc.data());
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
  return withStorageBucket(async (bucket) => {
    const file = bucket.file(storagePath);
    await file.save(buffer, {
      metadata: { contentType, cacheControl: "public, max-age=31536000" },
      resumable: false,
    });

    let url;
    try {
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: new Date("2500-01-01T00:00:00.000Z"),
      });
      url = signedUrl;
    } catch {
      await file.makePublic();
      url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    }

    return { dataUrl: url, storagePath };
  });
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

  const now = new Date();
  let storedDataUrl = dataUrl || null;
  let storagePath = null;

  if (kind === "svg" && dataUrl) {
    const uploaded = await uploadSvgToStorage(key, dataUrl);
    storedDataUrl = uploaded.dataUrl;
    storagePath = uploaded.storagePath;
  }

  const payload = {
    centre: centre || null,
    centreKey: key,
    kind,
    name: name || null,
    title: title || null,
    days: kind === "grid" && Array.isArray(days) ? days : null,
    slots: kind === "grid" && Array.isArray(slots) ? slots : null,
    dataUrl: kind === "svg" ? storedDataUrl : null,
    storagePath: kind === "svg" ? storagePath : null,
    updatedAt: now,
    updatedBy: updatedBy || null,
  };

  await timetablesRef().doc(key).set(payload, { merge: false });
  return toApi(key, payload);
};

const remove = async (centreKey) => {
  const key = getCanonicalCentreKey(centreKey);
  if (!key) return false;
  await timetablesRef().doc(key).delete();
  return true;
};

module.exports = {
  findByCentreKey,
  upsert,
  remove,
};
