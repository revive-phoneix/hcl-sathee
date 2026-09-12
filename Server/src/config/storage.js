const { getSupabase } = require("./supabase");

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "sathee-uploads";

// ~10 years, matching the far-future ("2500-01-01") signed URL expiry the
// Firebase Storage code used to request.
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365 * 10;

/**
 * Upload a buffer to Supabase Storage and return a long-lived URL for it.
 * Mirrors the old Firebase `withStorageBucket()` helper's return shape
 * ({ url, storagePath }) so every call site only needed its upload call
 * swapped, not its surrounding logic.
 *
 * Tries a signed URL first (works for a private bucket); if that fails,
 * falls back to the bucket's public URL (works if SUPABASE_STORAGE_BUCKET
 * is a public bucket) — matching the old signed-URL-then-makePublic fallback.
 */
const uploadToStorage = async (storagePath, buffer, { contentType } = {}) => {
  const supabase = getSupabase();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: contentType || "application/octet-stream",
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    const err = new Error(`Supabase Storage upload failed: ${uploadError.message}`);
    err.cause = uploadError;
    throw err;
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) throw error || new Error("No signed URL returned");
    return { url: data.signedUrl, storagePath };
  } catch (signErr) {
    console.warn(
      `Supabase signed URL failed for ${storagePath}, falling back to public URL:`,
      signErr?.message || signErr
    );
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return { url: data?.publicUrl || null, storagePath };
  }
};

module.exports = { uploadToStorage, BUCKET };
