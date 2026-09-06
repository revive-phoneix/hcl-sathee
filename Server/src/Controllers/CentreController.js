const Centre = require("../Models/Centre");
const { fail, ok, wrap } = require("../Utils/httpResponse");

exports.getCentres = wrap(
  async (_req, res) => {
    const centres = await Centre.findAll();
    return ok(res, { centres });
  },
  { label: "Get Centres Error", message: "Failed to fetch centres" }
);

exports.createCentre = wrap(
  async (req, res) => {
    try {
      const centre = await Centre.create(req.body?.name, req.user?.id);
      return ok(res, 201, { message: "Centre created successfully", centre });
    } catch (error) {
      if (error.code === "INVALID_CENTRE" || error.code === "DUPLICATE_CENTRE") {
        return fail(res, 400, error.message);
      }
      throw error;
    }
  },
  { label: "Create Centre Error", message: "Failed to create centre" }
);

exports.updateCentre = wrap(
  async (req, res) => {
    try {
      const centre = await Centre.update(req.params.id, req.body?.name);
      return ok(res, { message: "Centre renamed", centre });
    } catch (err) {
      return fail(res, 400, err.message);
    }
  },
  { label: "Update Centre Error", message: "Failed to rename centre" }
);

exports.deleteCentre = wrap(
  async (req, res) => {
    try {
      await Centre.remove(req.params.id);
      return ok(res, { message: "Centre deleted" });
    } catch (err) {
      return fail(res, 400, err.message);
    }
  },
  { label: "Delete Centre Error", message: "Failed to delete centre" }
);
