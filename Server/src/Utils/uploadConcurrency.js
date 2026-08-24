const { fail } = require("./httpResponse");

const MAX_CONCURRENT_UPLOADS = Number(process.env.MAX_CONCURRENT_UPLOADS || 4);
let activeUploads = 0;

const uploadConcurrencyLimiter = (req, res, next) => {
  if (activeUploads >= MAX_CONCURRENT_UPLOADS) {
    return fail(res, 503, "server busy, please retry");
  }

  activeUploads += 1;

  const release = () => {
    activeUploads = Math.max(0, activeUploads - 1);
  };

  res.on("finish", release);
  res.on("close", release);
  res.on("error", release);

  return next();
};

module.exports = {
  uploadConcurrencyLimiter,
  getActiveUploadCount: () => activeUploads,
  MAX_CONCURRENT_UPLOADS,
};
