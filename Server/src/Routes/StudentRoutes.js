const express = require("express");
const router = express.Router();
const { getStudents, addStudent } = require("../Controllers/StudentController");

router.get("/", getStudents);
router.post("/", addStudent);

module.exports = router;
