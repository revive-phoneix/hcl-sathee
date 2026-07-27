const Announcement = require("../Models/Announcement");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const { filterByUserCentre } = require("../Utils/centreMatch");

exports.getAnnouncements = wrap(
  async (req, res) => {
    const announcements = filterByUserCentre(
      await Announcement.findAll(),
      req.user
    );
    return ok(res, { announcements });
  },
  { label: "Get Announcements Error", message: "Failed to fetch announcements" }
);

exports.addAnnouncement = wrap(
  async (req, res) => {
    const { title, description, category, priority, postedBy, centre, attachmentName } =
      req.body;

    if (!title?.trim() || !description?.trim()) {
      return fail(res, 400, "Title and description are required");
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

    return ok(res, 201, { announcement });
  },
  { label: "Add Announcement Error", message: "Failed to create announcement" }
);

exports.updateAnnouncement = wrap(
  async (req, res) => {
    const { id } = req.params;
    const { title, description, category, priority, attachmentName, centre } = req.body;

    const existing = await Announcement.findById(id);
    if (!existing) {
      return fail(res, 404, "Announcement not found");
    }
    if (!title?.trim() || !description?.trim()) {
      return fail(res, 400, "Title and description are required");
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

    return ok(res, { announcement });
  },
  { label: "Update Announcement Error", message: "Failed to update announcement" }
);

exports.deleteAnnouncement = wrap(
  async (req, res) => {
    if (!(await Announcement.destroy(req.params.id))) {
      return fail(res, 404, "Announcement not found");
    }
    return ok(res, { message: "Announcement deleted successfully" });
  },
  { label: "Delete Announcement Error", message: "Failed to delete announcement" }
);
