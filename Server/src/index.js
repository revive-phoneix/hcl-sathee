const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { initFirebase } = require("./config/firebase");
const authRoutes = require("./Routes/AuthRoutes");
const userRoutes = require("./Routes/UserRoutes");
const studentRoutes = require("./Routes/StudentRoutes");
const studentPerformanceRoutes = require("./Routes/StudentPerformanceRoutes");
const announcementRoutes = require("./Routes/AnnouncementRoutes");
const mitraAttendanceRoutes = require("./Routes/MitraAttendanceRoutes");
const studentAttendanceRoutes = require("./Routes/StudentAttendanceRoutes");
const equipmentRoutes = require("./Routes/EquipmentRoutes");
const scheduleRoutes = require("./Routes/ScheduleRoutes");
const timetableRoutes = require("./Routes/TimetableRoutes");
const leaveRequestRoutes = require("./Routes/LeaveRequestRoutes");
const supportQueryRoutes = require("./Routes/SupportQueryRoutes");
const testMarksRoutes = require("./Routes/TestMarksRoutes");

const app = express();

app.use(
  cors({
    origin: [
      "https://hcl-sathee.vercel.app",
      /\.vercel\.app$/,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  })
);
// Allow SVG timetable dataUrls / large schedule payloads
app.use(express.json({ limit: "3mb" }));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "SATHEE Backend is running...",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/students/performance", studentPerformanceRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/mitra-attendance", mitraAttendanceRoutes);
app.use("/api/student-attendance", studentAttendanceRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);
app.use("/api/support-queries", supportQueryRoutes);
app.use("/api/test-marks", testMarksRoutes);

try {
  initFirebase();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
} catch (err) {
  console.error("❌ Firebase Connection Failed");
  console.error(err.message);
  process.exit(1);
}
