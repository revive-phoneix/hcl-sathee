const express = require("express");
const {
  getUsers,
  getAdminUsers,
  getMe,
  addUser,
  updateUser,
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
