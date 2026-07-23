const MitraAttendance = require("../Models/MitraAttendance");

const VALID_TYPES = new Set(["arrival", "departure"]);

exports.getMitraAttendance = async (req, res) => {
  try {
    const date = (req.query.date || "").trim();
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "date query param is required (YYYY-MM-DD)",
      });
    }

    const records = await MitraAttendance.findByDate(date);
    res.status(200).json({ success: true, records });
  } catch (error) {
    console.error("Get Mitra Attendance Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Sathee Mitra attendance",
    });
  }
};

exports.uploadMitraPhoto = async (req, res) => {
  try {
    const { userId, name, centre, centreId, date, type } = req.body;

    if (!userId || !date || !type) {
      return res.status(400).json({
        success: false,
        message: "userId, date and type are required",
      });
    }

    if (!VALID_TYPES.has(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be arrival or departure",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Photo file is required",
      });
    }

    const record = await MitraAttendance.upsertCheckIn({
      userId,
      name,
      centre,
      centreId: centreId || null,
      date,
      type,
      file: req.file,
    });

    res.status(200).json({
      success: true,
      message: `${type} photo uploaded successfully`,
      record,
    });
  } catch (error) {
    console.error("Upload Mitra Photo Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload photo",
    });
  }
};
