const express = require("express");
const multer = require("multer");
const { authenticate, requireAdminOrMitra } = require("../Middleware/auth");
const {
  getVishistAttendance,
  markVishistAttendance,
  approveVishistAttendance,
} = require("../Controllers/VishistAttendanceController");

const router = express.Router();
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

router.get("/", authenticate, requireAdminOrMitra, getVishistAttendance);
router.post("/", authenticate, requireAdminOrMitra, upload.single("photo"), markVishistAttendance);
router.patch("/:id/approve", authenticate, requireAdminOrMitra, approveVishistAttendance);

module.exports = router;