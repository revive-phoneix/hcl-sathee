const Equipment = require("../Models/Equipment");
const { filterByUserCentre, isAdminRole } = require("../Utils/centreMatch");

const VALID_CENTRES = [
  "HCL RAJASTHAN",
  "HCL RAJATHAN",
  "HCL JHARKHAND",
  "HCL MADHYA PRADESH",
];

exports.getEquipments = async (req, res) => {
  try {
    const equipments = filterByUserCentre(await Equipment.findAll(), req.user);
    res.status(200).json({ success: true, equipments });
  } catch (error) {
    console.error("Get Equipments Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch equipments",
    });
  }
};

exports.addEquipment = async (req, res) => {
  try {
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
      return res.status(400).json({
        success: false,
        message: "Equipment name and description are required",
      });
    }

    if (String(name).trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Equipment name must be at most 100 characters",
      });
    }

    if (String(description).trim().length > 250) {
      return res.status(400).json({
        success: false,
        message: "Equipment description must be at most 250 characters",
      });
    }

    if (!warrantyStatus || !Equipment.WARRANTY_STATUSES.includes(warrantyStatus)) {
      return res.status(400).json({
        success: false,
        message: "Valid warranty status is required",
      });
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number",
      });
    }

    if (!expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Date of expiry is required",
      });
    }

    const normalizedCentre = centre?.trim() || null;
    if (!normalizedCentre || !VALID_CENTRES.includes(normalizedCentre)) {
      return res.status(400).json({
        success: false,
        message: "Valid centre is required",
      });
    }

    if (!isAdminRole(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can add equipment",
      });
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

    res.status(201).json({
      success: true,
      message: "Equipment added successfully",
      equipment,
    });
  } catch (error) {
    console.error("Add Equipment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create equipment",
    });
  }
};
