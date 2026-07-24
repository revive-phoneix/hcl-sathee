const express = require("express");
const router = express.Router();
const {
  getStudentsWithPerformance,
  addSubjectPerformance,
  addSubjectAttendance,
} = require("../Controllers/StudentPerformanceController");
const {
  authenticate,
  requireAdminOrPartner,
  requireAdmin,
} = require("../Middleware/auth");

router.get("/", authenticate, requireAdminOrPartner, getStudentsWithPerformance);
router.post("/performance", authenticate, requireAdmin, addSubjectPerformance);
router.post("/attendance", authenticate, requireAdmin, addSubjectAttendance);

module.exports = router;
