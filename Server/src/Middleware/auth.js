const jwt = require("jsonwebtoken");
const { isAdminRole, isHclPartnerRole } = require("../Utils/centreMatch");

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

/** ADMIN and HCL PARTNER may access (typically GET / view). */
const requireAdminOrPartner = (req, res, next) => {
  const role = req.user?.role;
  if (isAdminRole(role) || isHclPartnerRole(role)) return next();
  return res.status(403).json({
    success: false,
    message: "Access denied for this role",
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

module.exports = {
  authenticate,
  requireAdminOrPartner,
  requireAdmin,
};
