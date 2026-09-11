import { getCanonicalCentreKey } from "./portalMapping";

/**
 * Hardcoded numeric centre IDs for the 3 default centres — a placeholder
 * until centres get a real ID field on the backend. Update this map (and swap
 * it for a real lookup) once that lands. Custom centres have no ID yet.
 */
const CENTRE_ID_BY_KEY = {
  HCLRAJASTHAN: 1,
  HCLJHARKHAND: 2,
  HCLMADHYAPRADESH: 3,
};

/** Accepts a centre name or a portal title (e.g. "HCL SATHEE RAJASTHAN"). */
export const getCentreId = (centreNameOrPortalName = "") => {
  const key = getCanonicalCentreKey(centreNameOrPortalName);
  return CENTRE_ID_BY_KEY[key] ?? null;
};
