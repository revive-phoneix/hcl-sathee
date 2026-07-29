const Announcement = require("../Models/Announcement");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const {
  isAdminRole,
  isHclPartnerRole,
  isSatheeMitraRole,
  matchesCentre,
} = require("../Utils/centreMatch");

const parseOtherCentres = (raw) => {
  if (raw == null || raw === "") return null;
  let list = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      list = raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(list)) return null;
  const cleaned = [
    ...new Set(list.map((c) => String(c || "").trim()).filter(Boolean)),
  ];
  return cleaned.length ? cleaned : null;
};

const parseBody = (req) => {
  const body = req.body || {};
  return {
    title: body.title,
    description: body.description,
    category: body.category,
    priority: body.priority,
    postedBy: body.postedBy,
    centre: body.centre,
    otherCentres: parseOtherCentres(body.otherCentres ?? body["other-centres"]),
    attachmentName: body.attachmentName,
  };
};

/** Visible if centre matches, or user centre is listed in other-centres. */
const filterAnnouncementsForUser = (items, user) => {
  if (!user || isAdminRole(user.role)) return items;
  if (!isHclPartnerRole(user.role) && !isSatheeMitraRole(user.role)) return [];

  return items.filter((item) => {
    if (matchesCentre(item.centre, user.centre)) return true;
    const others = Array.isArray(item.otherCentres) ? item.otherCentres : [];
    return others.some((centre) => matchesCentre(centre, user.centre));
  });
};

exports.getAnnouncements = wrap(
  async (req, res) => {
    const announcements = filterAnnouncementsForUser(
      await Announcement.findAll(),
      req.user
    );
    return ok(res, { announcements });
  },
  { label: "Get Announcements Error", message: "Failed to fetch announcements" }
);

exports.addAnnouncement = wrap(
  async (req, res) => {
    const { title, description, category, priority, postedBy, centre, otherCentres } =
      parseBody(req);

    if (!String(title || "").trim() || !String(description || "").trim()) {
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
      title: String(title).trim(),
      description: String(description).trim(),
      category: String(category || "").trim() || "General",
      priority: priority || "Medium",
      postedBy: String(postedBy || "").trim() || "Admin",
      centre: String(centre || "").trim() || null,
      otherCentres,
      ...attachment,
    });

    return ok(res, 201, { announcement });
  },
  {
    label: "Add Announcement Error",
    message: "Failed to create announcement",
    useErrorMessage: true,
  }
);

exports.updateAnnouncement = wrap(
  async (req, res) => {
    const { id } = req.params;
    const { title, description, category, priority, centre, otherCentres } =
      parseBody(req);

    const existing = await Announcement.findById(id);
    if (!existing) {
      return fail(res, 404, "Announcement not found");
    }
    if (!String(title || "").trim() || !String(description || "").trim()) {
      return fail(res, 400, "Title and description are required");
    }

    const patch = {
      title: String(title).trim(),
      description: String(description).trim(),
      category: String(category || "").trim() || existing.category,
      priority: priority || existing.priority,
      centre:
        centre === undefined || centre === null
          ? existing.centre
          : String(centre).trim() || null,
      otherCentres:
        req.body.otherCentres !== undefined ||
        req.body["other-centres"] !== undefined
          ? otherCentres
          : existing.otherCentres,
    };

    if (req.file) {
      Object.assign(patch, await Announcement.uploadAttachment(req.file));
    }

    const announcement = await Announcement.update(id, patch);
    if (!announcement) {
      return fail(res, 404, "Announcement not found");
    }
    return ok(res, { announcement });
  },
  {
    label: "Update Announcement Error",
    message: "Failed to update announcement",
    useErrorMessage: true,
  }
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
