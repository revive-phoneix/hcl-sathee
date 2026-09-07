const express = require("express");
const router = express.Router();
const {
  getStudents,
  addStudent,
  importStudents,
  fetchImportSheet,
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
router.post("/import/fetch-sheet", authenticate, requireAdminOrMitra, fetchImportSheet);
router.patch("/:id", authenticate, requireAdminOrMitra, updateStudent);
router.delete("/:id", authenticate, requireAdminOrMitra, deleteStudent);

module.exports = router;
