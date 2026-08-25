const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { initFirebase } = require("./config/firebase");
const authRoutes = require("./Routes/AuthRoutes");
const userRoutes = require("./Routes/UserRoutes");
const studentRoutes = require("./Routes/StudentRoutes");
const studentPerformanceRoutes = require("./Routes/StudentPerformanceRoutes");
const announcementRoutes = require("./Routes/AnnouncementRoutes");
const mitraAttendanceRoutes = require("./Routes/MitraAttendanceRoutes");
const equipmentRoutes = require("./Routes/EquipmentRoutes");
const scheduleRoutes = require("./Routes/ScheduleRoutes");
const timetableRoutes = require("./Routes/TimetableRoutes");
const leaveRequestRoutes = require("./Routes/LeaveRequestRoutes");
const supportQueryRoutes = require("./Routes/SupportQueryRoutes");
const testMarksRoutes = require("./Routes/TestMarksRoutes");
const vishistAttendanceRoutes = require("./Routes/VishistAttendanceRoutes");

const app = express();

const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const { fail } = require("./Utils/httpResponse");
    return fail(res, 429, "Too many requests, please try again later");
  },
});

const mutationRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const { fail } = require("./Utils/httpResponse");
    return fail(res, 429, "Too many requests, please try again later");
  },
});

app.use(helmet());
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
// 3mb limit for timetable and schedule PUT endpoints with large SVG dataUrls/rows
app.use(["/api/timetables", "/api/schedules"], express.json({ limit: "3mb" }));
// Default 1mb limit for all other routes
app.use(express.json({ limit: "1mb" }));

app.use("/api/students/performance/attendance-range", apiRateLimiter);
app.use("/api/students/performance/attendance-summary", apiRateLimiter);
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return mutationRateLimiter(req, res, next);
  }
  return next();
});

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
app.use("/api/vishist-attendance", vishistAttendanceRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);
app.use("/api/support-queries", supportQueryRoutes);
app.use("/api/test-marks", testMarksRoutes);

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

app.use((err, _req, res, _next) => {
  const isPayloadTooLarge = err?.type === "entity.too.large";
  const message =
    err instanceof require("multer").MulterError || isPayloadTooLarge
      ? err.message || "Request payload is too large"
      : err?.message || "Internal server error";
  const status = isPayloadTooLarge ? 413 : err?.status || err?.statusCode || 500;
  res.status(status).json({ success: false, message });
});

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
