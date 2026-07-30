const express = require("express");
const router = express.Router();
const { getStudents, addStudent } = require("../Controllers/StudentController");
const {
  authenticate,
  requireAdminOrPartner,
  requireAdminOrMitra,
} = require("../Middleware/auth");

router.get("/", authenticate, requireAdminOrPartner, getStudents);
router.post("/", authenticate, requireAdminOrMitra, addStudent);

module.exports = router;
