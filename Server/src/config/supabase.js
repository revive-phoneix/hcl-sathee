const { createClient } = require("@supabase/supabase-js");

// --- Migration-window dual-write support -----------------------------------
// Firebase/Firestore is the real, primary database right now. Supabase is a
// best-effort MIRROR: every create/update/delete in the Models also tries to
// write the same row into Postgres (see Utils/supabaseMirror.js), using the
// schema in Server/supabase/schema.sql, so that once a real Supabase project
// is provisioned, its data is already caught up and Firebase can be retired.
//
// Until real SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY values are set, this
// module simply stays disabled — no error, no crash, nothing written.

let client = null;
let enabled = false;

const isSupabaseConfigured = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Called once at boot. Never throws — a missing or broken Supabase config
 * must never take down the (Firebase-backed) server.
 */
const initSupabaseMirror = () => {
  if (!isSupabaseConfigured()) {
    console.log("↪️  Supabase mirror disabled (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set yet)");
    return;
  }

  try {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    enabled = true;
    console.log("✅ Supabase mirror enabled — writes will also be copied to Postgres");
  } catch (err) {
    console.warn("⚠️  Supabase mirror failed to initialize, continuing on Firebase only:", err.message);
  }
};

const isMirrorEnabled = () => enabled;

/** Returns the Supabase client, or null if the mirror isn't configured/enabled. */
const getSupabaseMirror = () => (enabled ? client : null);

module.exports = { initSupabaseMirror, isSupabaseConfigured, isMirrorEnabled, getSupabaseMirror };
