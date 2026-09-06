const express = require("express");
const {
  getCentres,
  createCentre,
  updateCentre,
  deleteCentre,
} = require("../Controllers/CentreController");
const { authenticate, requireAdmin } = require("../Middleware/auth");

const router = express.Router();

// Any authenticated user needs this for the portal selector (every role).
router.get("/", authenticate, getCentres);
// Only admins can add a new centre.
router.post("/", authenticate, requireAdmin, createCentre);
// Only admins can rename or delete a custom centre (defaults are locked in the model).
router.patch("/:id", authenticate, requireAdmin, updateCentre);
router.delete("/:id", authenticate, requireAdmin, deleteCentre);

module.exports = router;
