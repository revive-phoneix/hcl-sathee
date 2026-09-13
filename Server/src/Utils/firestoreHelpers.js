const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  return new Date(value);
};

const toDateOnly = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const findDocRefById = async (collectionRef, id) => {
  const ref = collectionRef.doc(String(id));
  const doc = await ref.get();
  if (doc.exists) return ref;

  const numericId = Number(id);
  if (!Number.isNaN(numericId)) {
    const snap = await collectionRef.where("id", "==", numericId).limit(1).get();
    if (!snap.empty) return snap.docs[0].ref;
  }

  return null;
};

/**
 * Allocate the next numeric id with a single counter doc (1 read + 1 write).
 * Avoids scanning the whole collection on every create (that burned Spark quota).
 */
const getNextId = async (collectionRef) => {
  const db = collectionRef.firestore;
  const counterRef = db.collection("_counters").doc(collectionRef.id);

  const existing = await counterRef.get();
  if (!existing.exists) {
    // Bootstrap without a full collection scan — use a high watermark.
    await counterRef.set(
      {
        value: Date.now(),
        bootstrappedAt: new Date(),
      },
      { merge: true }
    );
  }

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const current = Number(snap.data()?.value) || Date.now();
    const value = current + 1;
    tx.set(
      counterRef,
      {
        value,
        updated_at: new Date(),
      },
      { merge: true }
    );
    return value;
  });
};

module.exports = { toDate, toDateOnly, findDocRefById, getNextId };
