const Announcement = require("../Models/Announcement");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const { filterByUserCentre } = require("../Utils/centreMatch");

const parseBody = (req) => {
  const body = req.body || {};
  return {
    title: body.title,
    description: body.description,
    category: body.category,
    priority: body.priority,
    postedBy: body.postedBy,
    centre: body.centre,
    attachmentName: body.attachmentName,
  };
};

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
    const { title, description, category, priority, postedBy, centre } =
      parseBody(req);

    if (!title?.trim() || !description?.trim()) {
      return fail(res, 400, "Title and description are required");
    }

    let attachment = {
      attachmentName: null,
      attachmentUrl: null,
      attachmentType: null,
      attachmentPath: null,
    };

    if (req.file) {
      attachment = await Announcement.uploadAttachment(req.file);
    } else if (req.body.attachmentUrl) {
      attachment = {
        attachmentName: req.body.attachmentName || null,
        attachmentUrl: req.body.attachmentUrl,
        attachmentType: req.body.attachmentType || null,
        attachmentPath: req.body.attachmentPath || null,
      };
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      description: description.trim(),
      category: category?.trim() || "General",
      priority: priority || "Medium",
      postedBy: postedBy?.trim() || "Admin",
      centre: centre?.trim() || null,
      ...attachment,
    });

    return ok(res, 201, { announcement });
  },
  { label: "Add Announcement Error", message: "Failed to create announcement" }
);

exports.updateAnnouncement = wrap(
  async (req, res) => {
    const { id } = req.params;
    const { title, description, category, priority, centre } = parseBody(req);

    const existing = await Announcement.findById(id);
    if (!existing) {
      return fail(res, 404, "Announcement not found");
    }
    if (!title?.trim() || !description?.trim()) {
      return fail(res, 400, "Title and description are required");
    }

    const patch = {
      title: title.trim(),
      description: description.trim(),
      category: category?.trim() || existing.category,
      priority: priority || existing.priority,
      centre: centre === undefined ? existing.centre : centre?.trim() || null,
    };

    if (req.file) {
      Object.assign(patch, await Announcement.uploadAttachment(req.file));
    }

    const announcement = await Announcement.update(id, patch);
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
