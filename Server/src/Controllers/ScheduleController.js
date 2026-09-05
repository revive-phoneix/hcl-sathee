const Schedule = require("../Models/Schedule");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const {
  isValidCentre,
  matchesCentre,
  isAdminRole,
} = require("../Utils/centreMatch");

const resolveCentre = (req) => {
  const fromQuery = (req.query.centre || req.query.portal || "").trim();
  const fromBody = (req.body?.centre || req.body?.portal || "").trim();
  return fromQuery || fromBody || req.user?.centre || "";
};

const assertCanAccessCentre = (req, centre) => {
  if (isAdminRole(req.user?.role)) return true;
  return matchesCentre(centre, req.user?.centre);
};

exports.getSchedule = wrap(
  async (req, res) => {
    const centre = resolveCentre(req);
    if (!centre) return fail(res, 400, "centre query param is required");
    if (!assertCanAccessCentre(req, centre)) {
      return fail(res, 403, "Access denied for this centre");
    }

    const schedule = await Schedule.findByCentreKey(centre);
    return ok(res, { schedule: schedule || null });
  },
  { label: "Get Schedule Error", message: "Failed to fetch schedule" }
);

exports.saveSchedule = wrap(
  async (req, res) => {
    const centre = (req.body?.centre || req.body?.portal || "").trim();
    const rows = req.body?.rows;

    if (!centre) return fail(res, 400, "centre is required");
    if (!(await isValidCentre(centre))) {
      return fail(res, 400, "Invalid centre");
    }
    if (!assertCanAccessCentre(req, centre)) {
      return fail(res, 403, "Access denied for this centre");
    }
    if (!Array.isArray(rows)) {
      return fail(res, 400, "rows array is required");
    }

    const schedule = await Schedule.upsert({
      centre,
      centreKey: centre,
      rows,
      meta: {
        name: req.body?.name || null,
        lastFile: req.body?.lastFile || req.body?.name || null,
        monthCount: req.body?.monthCount ?? null,
        rowCount: req.body?.rowCount ?? rows.length,
      },
      updatedBy: req.user?.id || req.user?.email || null,
    });

    return ok(res, { message: "Schedule saved", schedule });
  },
  {
    label: "Save Schedule Error",
    message: "Failed to save schedule",
    useErrorMessage: true,
  }
);

exports.deleteSchedule = wrap(
  async (req, res) => {
    const centre = resolveCentre(req);
    if (!centre) return fail(res, 400, "centre is required");
    if (!assertCanAccessCentre(req, centre)) {
      return fail(res, 403, "Access denied for this centre");
    }

    await Schedule.remove(centre);
    return ok(res, { message: "Schedule deleted", schedule: null });
  },
  { label: "Delete Schedule Error", message: "Failed to delete schedule" }
);
