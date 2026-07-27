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
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ success: true, message: "SATHEE Backend is running..." });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/students/performance", studentPerformanceRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/mitra-attendance", mitraAttendanceRoutes);
app.use("/api/student-attendance", studentAttendanceRoutes);
app.use("/api/equipments", equipmentRoutes);

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
