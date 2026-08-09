const express = require("express");
const { authenticate } = require("../Middleware/auth");
const { createSupportQuery } = require("../Controllers/SupportQueryController");

const router = express.Router();

router.post("/", authenticate, createSupportQuery);

module.exports = router;
