const express = require("express");
const router = express.Router();
const {
  login,
  createPassword,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
} = require("../Controllers/AuthController");
const { authLimiter } = require("../Middleware/rateLimits");

router.post("/login", authLimiter, login);
router.post("/create-password", createPassword);
router.post("/forgot-password/request-otp", authLimiter, requestPasswordResetOtp);
router.post("/forgot-password/verify-otp", authLimiter, verifyPasswordResetOtp);
router.post("/forgot-password/reset", authLimiter, resetPassword);

module.exports = router;
