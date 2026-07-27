const express = require("express");
const router = express.Router();
const {
  login,
  createPassword,
  forgotPasswordLookup,
  forgotPasswordReset,
} = require("../Controllers/AuthController");

router.post("/login", login);
router.post("/create-password", createPassword);
router.post("/forgot-password/lookup", forgotPasswordLookup);
router.post("/forgot-password/reset", forgotPasswordReset);

module.exports = router;
