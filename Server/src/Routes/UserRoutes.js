const express = require("express");
const {
  getUsers,
  getAdminUsers,
  getMe,
  getVishistMentors,
  addUser,
  updateUser,
  updateCurrentUser,
  deleteUser,
  saveFcmToken,
  resendInvite,
} = require("../Controllers/UserController");
const {
  authenticate,
  requireAdminOrPartner,
  requireAdmin,
} = require("../Middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/me", getMe);
router.patch("/me/fcm-token", saveFcmToken);

// Any authenticated user may fetch Vishist mentors; the handler enforces
// centre-scoping per role (admins may pass ?centre=, others are locked to their own).
router.get("/vishist", getVishistMentors);

// Partners may list Sathee Mitra in their centre (for attendance view).
// Create/update/delete remain admin-only.
router.get("/admins", requireAdminOrPartner, getAdminUsers);
router.get("/", requireAdminOrPartner, getUsers);
router.post("/", requireAdmin, addUser);
router.post("/:id/resend-invite", requireAdmin, resendInvite);
router.patch("/me", updateCurrentUser);
router.patch("/:id", requireAdmin, updateUser);
router.delete("/:id", requireAdmin, deleteUser);

module.exports = router;
