const VALID_CENTRES = [
  "HCL RAJASTHAN",
  "HCL RAJATHAN",
  "HCL JHARKHAND",
  "HCL MADHYA PRADESH",
];

const normalizeCentreValue = (value = "") =>
  value
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

const getCanonicalCentreKey = (value = "") => {
  const normalized = normalizeCentreValue(value);

  if (normalized.includes("RAJASTHAN") || normalized.includes("RAJATHAN")) {
    return "HCLRAJASTHAN";
  }
  if (normalized.includes("JHARKHAND")) return "HCLJHARKHAND";
  if (normalized.includes("MADHYAPRADESH")) return "HCLMADHYAPRADESH";

  return normalized;
};

const matchesCentre = (itemCentre, userCentre) => {
  if (!userCentre) return false;
  return getCanonicalCentreKey(itemCentre) === getCanonicalCentreKey(userCentre);
};

const isAdminRole = (role = "") =>
  String(role || "").trim().toUpperCase() === "ADMIN";

const isHclPartnerRole = (role = "") =>
  String(role || "").trim().toUpperCase() === "HCL PARTNER";

const isSatheeMitraRole = (role = "") =>
  String(role || "").trim().toUpperCase() === "SATHEE MITRA";

/** Partners and Mitras only see their centre; admins see everything. */
const filterByUserCentre = (items, user, centreField = "centre") => {
  if (!user || isAdminRole(user.role)) return items;
  if (!isHclPartnerRole(user.role) && !isSatheeMitraRole(user.role)) return [];
  return items.filter((item) => matchesCentre(item?.[centreField], user.centre));
};

module.exports = {
  VALID_CENTRES,
  normalizeCentreValue,
  getCanonicalCentreKey,
  matchesCentre,
  isAdminRole,
  isHclPartnerRole,
  isSatheeMitraRole,
  filterByUserCentre,
};
