const rateLimit = require("express-rate-limit");

/**
 * Dedicated rate limiter for login and forgot-password endpoints
 * Stricter than the global mutation limiter to prevent brute-force attacks
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 8, // 8 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const { fail } = require("../Utils/httpResponse");
    return fail(res, 429, "Too many login attempts, please try again later");
  },
});

module.exports = {
  authLimiter,
};
