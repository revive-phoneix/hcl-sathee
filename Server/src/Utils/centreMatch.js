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

/**
 * Dynamic centre validation. Checks the given name against the live centre list
 * (the 3 defaults plus any admin-added centres in Firestore) using the same
 * fuzzy canonical-key matching as everywhere else.
 *
 * Required lazily to avoid a require cycle with Models/Centre.
 */
const isValidCentre = async (name) => {
  const centres = await require("../Models/Centre").findAll();
  const key = getCanonicalCentreKey(name);
  return centres.some((c) => getCanonicalCentreKey(c.name) === key);
};

const matchesCentre = (itemCentre, userCentre) => {
  if (!userCentre) return false;
  return getCanonicalCentreKey(itemCentre) === getCanonicalCentreKey(userCentre);
};

const normalizeRole = (role = "") =>
  String(role || "")
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const isAdminRole = (role = "") => normalizeRole(role) === "ADMIN";

const isHclPartnerRole = (role = "") => normalizeRole(role) === "HCL PARTNER";

const isSatheeMitraRole = (role = "") => {
  const normalized = normalizeRole(role);
  return (
    normalized === "SATHEE MITRA" ||
    normalized.replace(/\s/g, "") === "SATHEEMITRA"
  );
};

const isPortalViewerRole = (role = "") =>
  isAdminRole(role) || isHclPartnerRole(role) || isSatheeMitraRole(role);

const filterByUserCentre = (items, user, centreField = "centre") => {
  if (!user || isAdminRole(user.role)) return items;
  if (!isHclPartnerRole(user.role) && !isSatheeMitraRole(user.role)) return [];
  return items.filter((item) => matchesCentre(item?.[centreField], user.centre));
};

module.exports = {
  VALID_CENTRES,
  isValidCentre,
  normalizeCentreValue,
  getCanonicalCentreKey,
  matchesCentre,
  normalizeRole,
  isAdminRole,
  isHclPartnerRole,
  isSatheeMitraRole,
  isPortalViewerRole,
  filterByUserCentre,
};
