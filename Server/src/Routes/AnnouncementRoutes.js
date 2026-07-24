const express = require("express");
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

router.get("/", authenticate, requireAdminOrPartner, getAnnouncements);
router.post("/", authenticate, requireAdmin, addAnnouncement);
router.put("/:id", authenticate, requireAdmin, updateAnnouncement);
router.delete("/:id", authenticate, requireAdmin, deleteAnnouncement);

module.exports = router;
