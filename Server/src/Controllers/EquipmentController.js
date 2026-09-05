const Equipment = require("../Models/Equipment");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const { isValidCentre, filterByUserCentre, isAdminRole } = require("../Utils/centreMatch");

exports.getEquipments = wrap(
  async (req, res) => {
    const equipments = filterByUserCentre(await Equipment.findAll(), req.user);
    return ok(res, { equipments });
  },
  { label: "Get Equipments Error", message: "Failed to fetch equipments" }
);

exports.addEquipment = wrap(
  async (req, res) => {
    const { name, description, quantity, serialNumber, centre } = req.body;

    if (!name?.trim() || !description?.trim()) {
      return fail(res, 400, "Equipment name and description are required");
    }
    if (String(name).trim().length > 100) {
      return fail(res, 400, "Equipment name must be at most 100 characters");
    }
    if (String(description).trim().length > 250) {
      return fail(res, 400, "Equipment description must be at most 250 characters");
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      return fail(res, 400, "Quantity must be a positive number");
    }

    const normalizedCentre = centre?.trim() || null;
    if (!normalizedCentre || !(await isValidCentre(normalizedCentre))) {
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
      centre: normalizedCentre,
    });

    return ok(res, 201, {
      message: "Equipment added successfully",
      equipment,
    });
  },
  { label: "Add Equipment Error", message: "Failed to create equipment" }
);
