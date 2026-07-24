const express = require("express");
const {
  getStudentAttendance,
  upsertStudentAttendance,
} = require("../Controllers/StudentAttendanceController");
const {
  authenticate,
  requireAdminOrPartner,
  requireAdmin,
} = require("../Middleware/auth");

const router = express.Router();

router.get("/", authenticate, requireAdminOrPartner, getStudentAttendance);
router.post("/", authenticate, requireAdmin, upsertStudentAttendance);

module.exports = router;
