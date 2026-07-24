const express = require("express");
const {
  getUsers,
  addUser,
  deleteUser,
} = require("../Controllers/UserController");
const {
  authenticate,
  requireAdminOrPartner,
  requireAdmin,
} = require("../Middleware/auth");

const router = express.Router();

router.use(authenticate);

// Partners may list Sathee Mitra in their centre (for attendance view).
// Create/delete remain admin-only.
router.get("/", requireAdminOrPartner, getUsers);
router.post("/", requireAdmin, addUser);
router.delete("/:id", requireAdmin, deleteUser);

module.exports = router;
