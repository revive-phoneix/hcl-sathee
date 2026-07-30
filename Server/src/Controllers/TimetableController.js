const Timetable = require("../Models/Timetable");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const {
  getCanonicalCentreKey,
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

exports.getTimetable = wrap(
  async (req, res) => {
    const centre = resolveCentre(req);
    if (!centre) return fail(res, 400, "centre query param is required");
    if (!assertCanAccessCentre(req, centre)) {
      return fail(res, 403, "Access denied for this centre");
    }

    const timetable = await Timetable.findByCentreKey(centre);
    return ok(res, { timetable: timetable || null });
  },
  { label: "Get Timetable Error", message: "Failed to fetch timetable" }
);

exports.saveTimetable = wrap(
  async (req, res) => {
    const centre = (req.body?.centre || req.body?.portal || "").trim();
    const kind = req.body?.kind;

    if (!centre) return fail(res, 400, "centre is required");
    const key = getCanonicalCentreKey(centre);
    if (!key || !key.startsWith("HCL")) {
      return fail(res, 400, "Invalid centre");
    }
    if (!assertCanAccessCentre(req, centre)) {
      return fail(res, 403, "Access denied for this centre");
    }
    if (kind !== "grid" && kind !== "svg") {
      return fail(res, 400, "kind must be grid or svg");
    }
    if (kind === "grid" && !Array.isArray(req.body?.slots)) {
      return fail(res, 400, "grid timetable requires slots");
    }
    if (kind === "svg" && !req.body?.dataUrl) {
      return fail(res, 400, "svg timetable requires dataUrl");
    }

    const timetable = await Timetable.upsert({
      centre,
      centreKey: centre,
      kind,
      name: req.body?.name || null,
      title: req.body?.title || null,
      days: req.body?.days || null,
      slots: req.body?.slots || null,
      dataUrl: req.body?.dataUrl || null,
      updatedBy: req.user?.id || req.user?.email || null,
    });

    return ok(res, { message: "Timetable saved", timetable });
  },
  {
    label: "Save Timetable Error",
    message: "Failed to save timetable",
    useErrorMessage: true,
  }
);

exports.deleteTimetable = wrap(
  async (req, res) => {
    const centre = resolveCentre(req);
    if (!centre) return fail(res, 400, "centre is required");
    if (!assertCanAccessCentre(req, centre)) {
      return fail(res, 403, "Access denied for this centre");
    }

    await Timetable.remove(centre);
    return ok(res, { message: "Timetable deleted", timetable: null });
  },
  { label: "Delete Timetable Error", message: "Failed to delete timetable" }
);
