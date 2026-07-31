const express = require("express");
const router = express.Router();
const {
  getStudentsWithPerformance,
  addSubjectPerformance,
  addSubjectAttendance,
  getDailySubjectAttendance,
  saveDailySubjectAttendance,
} = require("../Controllers/StudentPerformanceController");
const {
  authenticate,
  requireAdminOrPartner,
  requireAdmin,
  requireAdminOrMitra,
} = require("../Middleware/auth");

router.get("/", authenticate, requireAdminOrPartner, getStudentsWithPerformance);
router.post("/performance", authenticate, requireAdmin, addSubjectPerformance);
router.post("/attendance", authenticate, requireAdmin, addSubjectAttendance);

// Per-day subject marks (source of truth) → recomputes subjectAttendances aggregates
router.get(
  "/daily-attendance",
  authenticate,
  requireAdminOrPartner,
  getDailySubjectAttendance
);
router.post(
  "/daily-attendance",
  authenticate,
  requireAdminOrMitra,
  saveDailySubjectAttendance
);

module.exports = router;
