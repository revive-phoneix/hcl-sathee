const express = require("express");
const {
  getTimetable,
  saveTimetable,
  deleteTimetable,
} = require("../Controllers/TimetableController");
const {
  authenticate,
  requireAdminOrPartner,
  requireAdminOrMitra,
} = require("../Middleware/auth");

const router = express.Router();

router.get("/", authenticate, requireAdminOrPartner, getTimetable);
router.put("/", authenticate, requireAdminOrMitra, saveTimetable);
router.delete("/", authenticate, requireAdminOrMitra, deleteTimetable);

module.exports = router;
