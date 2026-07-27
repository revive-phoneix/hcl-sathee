const CENTRE_RULES = [
  { patterns: ["RAJASTHAN", "RAJATHAN"], key: "HCLRAJASTHAN", label: "HCL RAJASTHAN" },
  { patterns: ["JHARKHAND"], key: "HCLJHARKHAND", label: "HCL JHARKHAND" },
  { patterns: ["MADHYAPRADESH"], key: "HCLMADHYAPRADESH", label: "HCL MADHYA PRADESH" },
];

const normalizeCentreValue = (value = "") =>
  value
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

const matchCentreRule = (normalized) =>
  CENTRE_RULES.find((rule) => rule.patterns.some((pattern) => normalized.includes(pattern)));

const getCanonicalCentreKey = (value = "") => {
  const normalized = normalizeCentreValue(value);
  return matchCentreRule(normalized)?.key ?? normalized;
};

export const getCentreValueFromPortal = (portalName = "") =>
  matchCentreRule(normalizeCentreValue(portalName))?.label ?? null;

export const matchesPortalCentre = (centreValue, portalName = "") => {
  const targetCentre = getCentreValueFromPortal(portalName);
  if (!targetCentre) return true;
  return getCanonicalCentreKey(centreValue) === getCanonicalCentreKey(targetCentre);
};

export const canAccessPortal = (userCentre, portalName = "", userRole = "") => {
  const role = String(userRole || "").trim().toUpperCase();
  if (role === "ADMIN") return true;
  if (!userCentre) return false;
  return matchesPortalCentre(userCentre, portalName);
};

export const isAdminRole = (userRole = "") =>
  String(userRole || "").trim().toUpperCase() === "ADMIN";

export const isHclPartnerRole = (userRole = "") =>
  String(userRole || "").trim().toUpperCase() === "HCL PARTNER";

export const isSatheeMitraRole = (userRole = "") =>
  String(userRole || "").trim().toUpperCase() === "SATHEE MITRA";

/** Only ADMIN may enter the admin dashboard pages. */
export const canEnterAdminDashboard = (userRole = "") => isAdminRole(userRole);

/** HCL PARTNER may enter the partner (view-only) dashboard pages. */
export const canEnterPartnerDashboard = (userRole = "") => isHclPartnerRole(userRole);

export const PORTAL_OPTIONS = [
  { title: "HCL SATHEE RAJASTHAN", subtitle: "Rajasthan Learning Portal" },
  { title: "HCL SATHEE JHARKHAND", subtitle: "Jharkhand Learning Portal" },
  { title: "HCL SATHEE MADHYA PRADESH", subtitle: "Madhya Pradesh Learning Portal" },
];
