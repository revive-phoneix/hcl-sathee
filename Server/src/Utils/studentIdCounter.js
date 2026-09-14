const { getDb } = require("../config/firebase");

/**
 * Per-Kendra sequential counter for human-facing student IDs (RJ-JU-001,
 * RJ-JU-002, ...). Starts at 1. Deliberately separate from getNextId() in
 * firestoreHelpers.js — that one bootstraps from a Date.now() watermark
 * (fine for an internal numeric id, wrong for a human-readable sequence
 * that must start at 1 for the first student at a Kendra).
 */
const getNextStudentSequence = async (kendraId) => {
  const db = getDb();
  const counterRef = db.collection("_studentIdCounters").doc(kendraId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const current = Number(snap.data()?.value) || 0;
    const value = current + 1;
    tx.set(counterRef, { value, updated_at: new Date() }, { merge: true });
    return value;
  });
};

module.exports = { getNextStudentSequence };
