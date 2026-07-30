const jwt = require("jsonwebtoken");
const {
  isAdminRole,
  isPortalViewerRole,
  isSatheeMitraRole,
} = require("../Utils/centreMatch");

const authenticate = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({
        success: false,
        message: "Server auth configuration error",
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      centre: payload.centre ?? null,
    };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * ADMIN, HCL PARTNER, and SATHEE MITRA may access (typically GET / view).
 * Kept name requireAdminOrPartner for existing route imports.
 */
const requireAdminOrPartner = (req, res, next) => {
  const role = req.user?.role;
  if (isPortalViewerRole(role)) return next();
  return res.status(403).json({
    success: false,
    message: "Access denied for this role",
    role: role || null,
  });
};

/** Only ADMIN may mutate data or manage users. */
const requireAdmin = (req, res, next) => {
  if (isAdminRole(req.user?.role)) return next();
  return res.status(403).json({
    success: false,
    message: "Admin access required",
  });
};

/** ADMIN or SATHEE MITRA may add/edit students (not HCL Partner). */
const requireAdminOrMitra = (req, res, next) => {
  const role = req.user?.role;
  if (isAdminRole(role) || isSatheeMitraRole(role)) return next();
  return res.status(403).json({
    success: false,
    message: "Admin or Sathee Mitra access required",
  });
};

/** Only SATHEE MITRA may upload their own attendance photos. */
const requireSatheeMitra = (req, res, next) => {
  if (isSatheeMitraRole(req.user?.role)) return next();
  return res.status(403).json({
    success: false,
    message: "Sathee Mitra access required to upload attendance photos",
  });
};

module.exports = {
  authenticate,
  requireAdminOrPartner,
  requireAdmin,
  requireAdminOrMitra,
  requireSatheeMitra,
};
