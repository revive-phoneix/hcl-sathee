const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  listTests,
  createTest,
  ocrPrefillTestMarks,
  documentPrefillTestMarks,
  saveTestMarks,
  getCourseProgress,
} = require("../Controllers/TestMarksController");
const { authenticate, requireAdminOrMitra } = require("../Middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // answer sheet PDFs can run larger than a photo
  fileFilter: (_req, file, cb) => {
    const allowed =
      file.mimetype === "application/pdf" ||
      file.mimetype?.startsWith("image/") ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "application/msword";
    if (!allowed) return cb(new Error("Only PDF, image, or Word uploads are allowed"));
    cb(null, true);
  },
});
const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PDF or Word (.doc/.docx) uploads are allowed here"));
    }
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
  "/document-prefill",
  authenticate,
  requireAdminOrMitra,
  uploadDocument.single("answerSheet"),
  documentPrefillTestMarks
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