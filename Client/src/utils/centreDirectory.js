import { getCanonicalCentreKey } from "./portalMapping";

/**
 * Hardcoded per-centre directory info for the 3 default centres — a
 * placeholder until centres get real ID/address fields on the backend.
 * Update this map (and swap it for a real lookup) once that lands. Custom
 * centres have none of this yet.
 */
const CENTRE_DIRECTORY_BY_KEY = {
  HCLRAJASTHAN: {
    id: 1,
    place: "Jaipur, Rajasthan",
    address: "HCL SATHEE Learning Centre, Jaipur, Rajasthan – 302001",
  },
  HCLJHARKHAND: {
    id: 2,
    place: "Ranchi, Jharkhand",
    address: "HCL SATHEE Learning Centre, Ranchi, Jharkhand – 834001",
  },
  HCLMADHYAPRADESH: {
    id: 3,
    place: "Bhopal, Madhya Pradesh",
    address: "HCL SATHEE Learning Centre, Bhopal, Madhya Pradesh – 462001",
  },
};

/** Accepts a centre name or a portal title (e.g. "HCL SATHEE RAJASTHAN"). */
export const getCentreDirectoryEntry = (centreNameOrPortalName = "") => {
  const key = getCanonicalCentreKey(centreNameOrPortalName);
  return CENTRE_DIRECTORY_BY_KEY[key] ?? null;
};

export const getCentreId = (centreNameOrPortalName = "") =>
  getCentreDirectoryEntry(centreNameOrPortalName)?.id ?? null;

export const getCentrePlace = (centreNameOrPortalName = "") =>
  getCentreDirectoryEntry(centreNameOrPortalName)?.place ?? null;

export const getCentreAddress = (centreNameOrPortalName = "") =>
  getCentreDirectoryEntry(centreNameOrPortalName)?.address ?? null;
