const express = require("express");
const { getCentres, createCentre } = require("../Controllers/CentreController");
const { authenticate, requireAdmin } = require("../Middleware/auth");

const router = express.Router();

// Any authenticated user needs this for the portal selector (every role).
router.get("/", authenticate, getCentres);
// Only admins can add a new centre.
router.post("/", authenticate, requireAdmin, createCentre);

module.exports = router;
