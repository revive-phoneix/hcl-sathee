const express = require("express");
const router = express.Router();
const {
  getStudentsWithPerformance,
  addSubjectPerformance,
  addSubjectAttendance,
} = require("../Controllers/StudentPerformanceController");

router.get("/", getStudentsWithPerformance);
router.post("/performance", addSubjectPerformance);
router.post("/attendance", addSubjectAttendance);

module.exports = router;
