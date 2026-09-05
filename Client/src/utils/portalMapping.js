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

export const getCanonicalCentreKey = (value = "") => {
  const normalized = normalizeCentreValue(value);
  return matchCentreRule(normalized)?.key ?? normalized;
};

export const getCentreValueFromPortal = (portalName = "") => {
  const rule = matchCentreRule(normalizeCentreValue(portalName));
  if (rule) return rule.label;
  // Dynamically-added centres have no rule — the portal name is already the
  // centre value (e.g. "HCL UTTAR PRADESH").
  const trimmed = portalName.toString().trim();
  return trimmed || null;
};

export const matchesPortalCentre = (centreValue, portalName = "") => {
  const portalKey = getCanonicalCentreKey(portalName);
  if (!portalKey) return true;
  return getCanonicalCentreKey(centreValue) === portalKey;
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

export const canEnterAdminDashboard = (userRole = "") => isAdminRole(userRole);

export const canEnterPartnerDashboard = (userRole = "") => isHclPartnerRole(userRole);

export const canEnterSatheeMitraDashboard = (userRole = "") => isSatheeMitraRole(userRole);

export const PORTAL_OPTIONS = [
  { title: "HCL SATHEE RAJASTHAN", subtitle: "Rajasthan Learning Portal" },
  { title: "HCL SATHEE JHARKHAND", subtitle: "Jharkhand Learning Portal" },
  { title: "HCL SATHEE MADHYA PRADESH", subtitle: "Madhya Pradesh Learning Portal" },
];
