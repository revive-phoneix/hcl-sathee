const express = require("express");
const {
  getEquipments,
  addEquipment,
} = require("../Controllers/EquipmentController");
const {
  authenticate,
  requireAdminOrPartner,
  requireAdmin,
} = require("../Middleware/auth");

const router = express.Router();

router.get("/", authenticate, requireAdminOrPartner, getEquipments);
router.post("/", authenticate, requireAdmin, addEquipment);

module.exports = router;
