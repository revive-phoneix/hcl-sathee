const jwt = require("jsonwebtoken");

const generateInviteToken = ({ name, email, role }) =>
  jwt.sign({ name, email, role, purpose: "invite" }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

const verifyInviteToken = (token) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (payload.purpose !== "invite") throw new Error("Invalid token");
  return payload;
};

module.exports = { generateInviteToken, verifyInviteToken };