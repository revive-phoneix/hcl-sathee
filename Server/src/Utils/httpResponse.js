const fail = (res, status, message, extra = {}) =>
  res.status(status).json({ success: false, message, ...extra });

const ok = (res, statusOrPayload, payload) => {
  if (typeof statusOrPayload === "number") {
    return res.status(statusOrPayload).json({ success: true, ...payload });
  }
  return res.status(200).json({ success: true, ...statusOrPayload });
};

const serverError = (res, err, message, label) => {
  console.error(label ? `${label}:` : "Error:", err);
  return fail(res, 500, message);
};

const wrap =
  (handler, { label, message, useErrorMessage = false }) =>
  async (req, res) => {
    try {
      return await handler(req, res);
    } catch (err) {
      const msg = useErrorMessage ? err.message || message : message;
      return serverError(res, err, msg, label);
    }
  };

module.exports = { fail, ok, serverError, wrap };
