const express = require("express");
const { authenticate, requireAdmin } = require("../Middleware/auth");
const {
  createSupportQuery,
  getSupportQueries,
  replyToSupportQuery,
} = require("../Controllers/SupportQueryController");

const router = express.Router();

router.get("/", authenticate, requireAdmin, getSupportQueries);
router.post("/", authenticate, createSupportQuery);
router.post("/:id/reply", authenticate, requireAdmin, replyToSupportQuery);

module.exports = router;
