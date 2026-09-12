// Firebase Admin is kept ONLY for push notifications (Firebase Cloud
// Messaging) — Supabase has no equivalent push service. Firestore and
// Firebase Storage are no longer used anywhere in the app; see
// Server/src/config/supabase.js and Server/src/config/storage.js instead.
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const path = require("path");
const fs = require("fs");

let initialized = false;

const initFirebaseMessaging = () => {
  if (getApps().length) {
    initialized = true;
    return;
  }

  const explicitPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const defaultPath = path.join(__dirname, "../../firebase-service-account.json");
  const credentialPath = explicitPath || defaultPath;

  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    if (!fs.existsSync(credentialPath)) {
      throw new Error(
        `Firebase service account not found at: ${credentialPath}\n` +
          "Save your JSON key as Server/firebase-service-account.json or set " +
          "FIREBASE_SERVICE_ACCOUNT_PATH/FIREBASE_SERVICE_ACCOUNT_JSON in .env. " +
          "This is only required for push notifications (FCM) — the database " +
          "and file storage no longer depend on Firebase."
      );
    }
    serviceAccount = require(credentialPath);
  }

  initializeApp({ credential: cert(serviceAccount) });
  initialized = true;
  console.log("✅ Firebase Messaging (FCM) Connected Successfully");
};

const isFirebaseMessagingReady = () => initialized;

module.exports = { initFirebaseMessaging, isFirebaseMessagingReady };
