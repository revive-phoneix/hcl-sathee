const { getCanonicalCentreKey } = require("./centreMatch");

/**
 * Hardcoded per-centre Kendra IDs for the 3 default centres — mirrors
 * Client/src/utils/centreDirectory.js. Used server-side to prefix
 * auto-generated student IDs with the student's centre's Kendra ID.
 * Custom centres (beyond the 3 defaults) have no Kendra ID yet.
 */
const CENTRE_DIRECTORY_BY_KEY = {
  HCLRAJASTHAN: "RJ-JU-01",
  HCLJHARKHAND: "JH-EM-01",
  HCLMADHYAPRADESH: "MP-BT-01",
};

/** Accepts a centre name or a portal title (e.g. "HCL SATHEE RAJASTHAN"). */
const getCentreId = (centreNameOrPortalName = "") => {
  const key = getCanonicalCentreKey(centreNameOrPortalName);
  return CENTRE_DIRECTORY_BY_KEY[key] ?? null;
};

/**
 * Strips the trailing "-NN" location-sequence segment off a Kendra ID, e.g.
 * "RJ-JU-01" -> "RJ-JU". Used as the prefix for sequential student IDs
 * (RJ-JU-001, RJ-JU-002, ...), which count students, not Kendra locations.
 */
const getStudentIdPrefix = (centreNameOrPortalName = "") => {
  const kendraId = getCentreId(centreNameOrPortalName);
  return kendraId ? kendraId.replace(/-\d+$/, "") : null;
};

module.exports = { getCentreId, getStudentIdPrefix };
