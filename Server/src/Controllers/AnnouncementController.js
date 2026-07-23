const Announcement = require("../Models/Announcement");

exports.getAnnouncements = async (_req, res) => {
  try {
    const announcements = await Announcement.findAll();
    res.status(200).json({ success: true, announcements });
  } catch (error) {
    console.error("Get Announcements Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch announcements" });
  }
};

exports.addAnnouncement = async (req, res) => {
  try {
    const { title, description, category, priority, postedBy, centre, attachmentName } =
      req.body;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      description: description.trim(),
      category: category?.trim() || "General",
      priority: priority || "Medium",
      postedBy: postedBy?.trim() || "Admin",
      centre: centre?.trim() || null,
      attachmentName: attachmentName?.trim() || null,
    });

    res.status(201).json({ success: true, announcement });
  } catch (error) {
    console.error("Add Announcement Error:", error);
    res.status(500).json({ success: false, message: "Failed to create announcement" });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority, attachmentName, centre } = req.body;

    const existing = await Announcement.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const announcement = await Announcement.update(id, {
      title: title.trim(),
      description: description.trim(),
      category: category?.trim() || existing.category,
      priority: priority || existing.priority,
      centre: centre === undefined ? existing.centre : centre?.trim() || null,
      attachmentName:
        attachmentName === undefined
          ? existing.attachmentName
          : attachmentName?.trim() || null,
    });

    res.status(200).json({ success: true, announcement });
  } catch (error) {
    console.error("Update Announcement Error:", error);
    res.status(500).json({ success: false, message: "Failed to update announcement" });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const deleted = await Announcement.destroy(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    res.status(200).json({ success: true, message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Delete Announcement Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete announcement" });
  }
};
