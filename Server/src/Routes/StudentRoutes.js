const express = require("express");
const router = express.Router();
const { getStudents, addStudent } = require("../Controllers/StudentController");
const {
  authenticate,
  requireAdminOrPartner,
  requireAdmin,
} = require("../Middleware/auth");

router.get("/", authenticate, requireAdminOrPartner, getStudents);
router.post("/", authenticate, requireAdmin, addStudent);

module.exports = router;
