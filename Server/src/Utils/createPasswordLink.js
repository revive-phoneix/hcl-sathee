const createPasswordLink = (name, email) => {
  const encodedName = encodeURIComponent(name);
  const encodedEmail = encodeURIComponent(email);
  const baseUrl = (process.env.CLIENT_URL || "https://hcl-sathee.vercel.app").replace(/\/$/, "");
  return `${baseUrl}/create-password?name=${encodedName}&email=${encodedEmail}`;
};

module.exports = { createPasswordLink };
