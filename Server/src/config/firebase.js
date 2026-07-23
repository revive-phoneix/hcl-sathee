const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const path = require("path");
const fs = require("fs");

let db;
let bucket;

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
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    `${serviceAccount.project_id}.firebasestorage.app`;

  initializeApp({
    credential: cert(serviceAccount),
    storageBucket,
  });

  db = getFirestore();
  bucket = getStorage().bucket();
  console.log("✅ Firebase Connected Successfully");
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

module.exports = { initFirebase, getDb, getBucket };
