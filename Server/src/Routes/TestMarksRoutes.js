const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  listTests,
  createTest,
  deleteTest,
  saveTestMarks,
  getCourseProgress,
} = require("../Controllers/TestMarksController");
const { authenticate, requireAdminOrMitra } = require("../Middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const okType =
      file.mimetype === "application/pdf" ||
      file.mimetype?.startsWith("image/") ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "application/msword";
    if (!okType) return cb(new Error("Only PDF, Word, or image uploads are allowed"));
    cb(null, true);
  },
});

const uploadSingle = (req, res, next) => {
  upload.single("answerSheet")(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
};

router.get("/tests", authenticate, requireAdminOrMitra, listTests);
router.post("/tests", authenticate, requireAdminOrMitra, createTest);
router.delete("/tests/:id", authenticate, requireAdminOrMitra, deleteTest);
router.post("/", authenticate, requireAdminOrMitra, uploadSingle, saveTestMarks);

router.get("/course-progress", authenticate, requireAdminOrMitra, getCourseProgress);
router.get("/test-type-progress", authenticate, requireAdminOrMitra, getTestTypeProgress);
module.exports = router;