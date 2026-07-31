const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const path = require("path");
const fs = require("fs");

let db;
let bucket;
let projectId = null;

const bucketCandidateNames = (id) => {
  const names = [
    process.env.FIREBASE_STORAGE_BUCKET,
    id ? `${id}.firebasestorage.app` : null,
    id ? `${id}.appspot.com` : null,
  ].filter(Boolean);
  return [...new Set(names)];
};

const initFirebase = () => {
  if (getApps().length) {
    db = getFirestore();
    bucket = getStorage().bucket();
    return db;
  }

  const explicitPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const defaultPath = path.join(__dirname, "../../firebase-service-account.json");
  const credentialPath = explicitPath || defaultPath;

  if (!fs.existsSync(credentialPath)) {
    throw new Error(
      `Firebase service account not found at: ${credentialPath}\n` +
        "Save your JSON key as Server/firebase-service-account.json " +
        "or set FIREBASE_SERVICE_ACCOUNT_PATH in .env."
    );
  }

  const serviceAccount = require(credentialPath);
  projectId = serviceAccount.project_id;
  const storageBucket = bucketCandidateNames(projectId)[0];

  initializeApp({
    credential: cert(serviceAccount),
    storageBucket,
  });

  db = getFirestore();
  bucket = getStorage().bucket();
  console.log("✅ Firebase Connected Successfully");
  console.log(`   Storage bucket default: ${storageBucket}`);
  return db;
};

const getDb = () => {
  if (!db) {
    throw new Error("Firebase not initialized. Call initFirebase() first.");
  }
  return db;
};

const getBucket = () => {
  if (!bucket) {
    throw new Error("Firebase Storage not initialized. Call initFirebase() first.");
  }
  return bucket;
};

const getBucketCandidates = () => {
  const names = bucketCandidateNames(projectId);
  if (!names.length) return [getBucket()];
  return names.map((name) => getStorage().bucket(name));
};

/**
 * Run an upload against each known bucket name until one succeeds.
 * Useful when FIREBASE_STORAGE_BUCKET is missing or outdated.
 */
const withStorageBucket = async (fn) => {
  const candidates = getBucketCandidates();
  let lastErr = null;
  for (const candidate of candidates) {
    try {
      return await fn(candidate);
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || "");
      const missingBucket =
        /bucket does not exist/i.test(msg) ||
        err?.code === 404 ||
        err?.code === "ENOENT";
      if (!missingBucket) throw err;
      console.warn(
        `Firebase Storage bucket unavailable (${candidate?.name || "unknown"}):`,
        msg
      );
    }
  }
  throw lastErr || new Error("No Firebase Storage bucket available");
};

module.exports = {
  initFirebase,
  getDb,
  getBucket,
  getBucketCandidates,
  withStorageBucket,
};
