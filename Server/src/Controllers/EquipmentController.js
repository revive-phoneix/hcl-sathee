const Equipment = require("../Models/Equipment");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const { VALID_CENTRES, filterByUserCentre, isAdminRole } = require("../Utils/centreMatch");

exports.getEquipments = wrap(
  async (req, res) => {
    const equipments = filterByUserCentre(await Equipment.findAll(), req.user);
    return ok(res, { equipments });
  },
  { label: "Get Equipments Error", message: "Failed to fetch equipments" }
);

exports.addEquipment = wrap(
  async (req, res) => {
    const {
      name,
      description,
      quantity,
      serialNumber,
      warrantyStatus,
      expiryDate,
      centre,
    } = req.body;

    if (!name?.trim() || !description?.trim()) {
      return fail(res, 400, "Equipment name and description are required");
    }
    if (String(name).trim().length > 100) {
      return fail(res, 400, "Equipment name must be at most 100 characters");
    }
    if (String(description).trim().length > 250) {
      return fail(res, 400, "Equipment description must be at most 250 characters");
    }
    if (!warrantyStatus || !Equipment.WARRANTY_STATUSES.includes(warrantyStatus)) {
      return fail(res, 400, "Valid warranty status is required");
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      return fail(res, 400, "Quantity must be a positive number");
    }
    if (!expiryDate) {
      return fail(res, 400, "Date of expiry is required");
    }

    const normalizedCentre = centre?.trim() || null;
    if (!normalizedCentre || !VALID_CENTRES.includes(normalizedCentre)) {
      return fail(res, 400, "Valid centre is required");
    }
    if (!isAdminRole(req.user?.role)) {
      return fail(res, 403, "Only admins can add equipment");
    }

    const equipment = await Equipment.create({
      name: name.trim(),
      description: description.trim(),
      quantity: qty,
      serialNumber: serialNumber?.trim() || null,
      warrantyStatus,
      expiryDate,
      centre: normalizedCentre,
    });

    return ok(res, 201, {
      message: "Equipment added successfully",
      equipment,
    });
  },
  { label: "Add Equipment Error", message: "Failed to create equipment" }
);
