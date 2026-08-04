const { generateInviteToken } = require("./inviteToken");

const createPasswordLink = (name, email, role) => {
  const token = generateInviteToken({ name, email, role });
  const baseUrl = (process.env.CLIENT_URL || "https://hcl-sathee.vercel.app").replace(/\/$/, "");
  return `${baseUrl}/create-password?token=${encodeURIComponent(token)}`;
};

module.exports = { createPasswordLink };