const express = require("express");
const multer = require("multer");
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
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
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
router.post("/", authenticate, requireAdmin, withOptionalAttachment(addAnnouncement));
router.put("/:id", authenticate, requireAdmin, withOptionalAttachment(updateAnnouncement));
router.delete("/:id", authenticate, requireAdmin, deleteAnnouncement);

module.exports = router;
