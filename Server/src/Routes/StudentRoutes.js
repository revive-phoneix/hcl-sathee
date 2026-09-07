const express = require("express");
const router = express.Router();
const {
  getStudents,
  addStudent,
  importStudents,
  updateStudent,
  deleteStudent,
} = require("../Controllers/StudentController");
const {
  authenticate,
  requireAdminOrPartner,
  requireAdminOrMitra,
} = require("../Middleware/auth");

router.get("/", authenticate, requireAdminOrPartner, getStudents);
router.post("/", authenticate, requireAdminOrMitra, addStudent);
router.post("/import", authenticate, requireAdminOrMitra, importStudents);
router.patch("/:id", authenticate, requireAdminOrMitra, updateStudent);
router.delete("/:id", authenticate, requireAdminOrMitra, deleteStudent);

module.exports = router;
