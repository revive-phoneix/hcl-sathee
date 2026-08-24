const express = require("express");
const multer = require("multer");
const { uploadConcurrencyLimiter } = require("../Utils/uploadConcurrency");
const router = express.Router();
const {
  getAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../Controllers/AnnouncementController");
const {
  authenticate,
  requireAdminOrPartner,
  requireAdmin,
} = require("../Middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/x-pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const name = String(file.originalname || "").toLowerCase();
    const byExt = /\.(pdf|jpe?g|png|webp|docx?)$/i.test(name);
    if (allowed.includes(file.mimetype) || byExt) return cb(null, true);
    return cb(new Error("Only PDF, DOC, DOCX, JPG, and PNG uploads are allowed"));
  },
});

const withOptionalAttachment = (handler) => (req, res, next) => {
  upload.single("attachment")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Invalid attachment upload",
      });
    }
    return handler(req, res, next);
  });
};

router.get("/", authenticate, requireAdminOrPartner, getAnnouncements);
router.post("/", authenticate, requireAdmin, uploadConcurrencyLimiter, withOptionalAttachment(addAnnouncement));
// POST preferred for multipart updates (some hosts mishandle PUT + FormData)
router.post("/:id", authenticate, requireAdmin, uploadConcurrencyLimiter, withOptionalAttachment(updateAnnouncement));
router.put("/:id", authenticate, requireAdmin, uploadConcurrencyLimiter, withOptionalAttachment(updateAnnouncement));
router.delete("/:id", authenticate, requireAdmin, deleteAnnouncement);

module.exports = router;
