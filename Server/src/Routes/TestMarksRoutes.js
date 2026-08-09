const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  listTests,
  createTest,
  ocrPrefillTestMarks,
  saveTestMarks,
  getCourseProgress,
} = require("../Controllers/TestMarksController");
const { authenticate, requireAdminOrMitra } = require("../Middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // answer sheet PDFs can run larger than a photo
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === "application/pdf" || file.mimetype?.startsWith("image/");
    if (!ok) return cb(new Error("Only PDF or image uploads are allowed"));
    cb(null, true);
  },
});

router.get("/tests", authenticate, requireAdminOrMitra, listTests);
router.post("/tests", authenticate, requireAdminOrMitra, createTest);

router.post(
  "/ocr-prefill",
  authenticate,
  requireAdminOrMitra,
  upload.single("answerSheet"),
  ocrPrefillTestMarks
);

router.post(
  "/",
  authenticate,
  requireAdminOrMitra,
  upload.single("answerSheet"),
  saveTestMarks
);

router.get("/course-progress", authenticate, requireAdminOrMitra, getCourseProgress);

module.exports = router;