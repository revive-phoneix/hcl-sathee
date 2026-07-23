const express = require("express");
const multer = require("multer");
const {
  getMitraAttendance,
  uploadMitraPhoto,
} = require("../Controllers/MitraAttendanceController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

router.get("/", getMitraAttendance);
router.post("/upload", (req, res, next) => {
  upload.single("photo")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Invalid photo upload",
      });
    }
    return uploadMitraPhoto(req, res, next);
  });
});

module.exports = router;
