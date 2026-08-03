const express = require("express");
const {
  createLeaveRequest,
  getMyLeaveRequests,
  getLeaveRequests,
  updateLeaveRequestStatus,
} = require("../Controllers/LeaveRequestController");
const {
  authenticate,
  requireAdmin,
  requireSatheeMitra,
} = require("../Middleware/auth");

const router = express.Router();

router.use(authenticate);

router.post("/", requireSatheeMitra, createLeaveRequest);
router.get("/mine", requireSatheeMitra, getMyLeaveRequests);
router.get("/", requireAdmin, getLeaveRequests);
router.patch("/:id/status", requireAdmin, updateLeaveRequestStatus);

module.exports = router;
