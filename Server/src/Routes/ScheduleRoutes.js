const express = require("express");
const {
  getSchedule,
  saveSchedule,
  deleteSchedule,
} = require("../Controllers/ScheduleController");
const {
  authenticate,
  requireAdminOrPartner,
  requireAdminOrMitra,
} = require("../Middleware/auth");

const router = express.Router();

router.get("/", authenticate, requireAdminOrPartner, getSchedule);
router.put("/", authenticate, requireAdminOrMitra, saveSchedule);
router.delete("/", authenticate, requireAdminOrMitra, deleteSchedule);

module.exports = router;
