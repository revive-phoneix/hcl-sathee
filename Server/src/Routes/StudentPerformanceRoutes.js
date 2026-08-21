const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  getStudentsWithPerformance,
  addSubjectPerformance,
  addSubjectAttendance,
  getDailySubjectAttendance,
  saveDailySubjectAttendance,
  getAttendanceSummary,
  getAttendanceRange,
} = require("../Controllers/StudentPerformanceController");
const {
  authenticate,
  requireAdminOrPartner,
  requireAdmin,
  requireAdminOrMitra,
} = require("../Middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

router.get("/", authenticate, requireAdminOrPartner, getStudentsWithPerformance);
router.post("/performance", authenticate, requireAdmin, addSubjectPerformance);
router.post("/attendance", authenticate, requireAdmin, addSubjectAttendance);

router.get(
  "/daily-attendance",
  authenticate,
  requireAdminOrPartner,
  getDailySubjectAttendance
);
router.get("/attendance-range", authenticate, requireAdminOrPartner, getAttendanceRange);
router.get("/attendance-summary", authenticate, requireAdminOrPartner, getAttendanceSummary);
router.post(
  "/daily-attendance",
  authenticate,
  requireAdminOrMitra,
  (req, res, next) => {
    upload.single("photo")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Invalid photo upload",
        });
      }
      return saveDailySubjectAttendance(req, res, next);
    });
  }
);

module.exports = router;
