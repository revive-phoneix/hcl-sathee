const crypto = require("crypto");
const { google } = require("googleapis");
const { createPasswordLink } = require("./createPasswordLink");

const FROM_NAME = "SATHEE Admin";

const requiredEmailEnv = () => {
  const missing = [
    "EMAIL_USER",
    "EMAIL_CLIENT_ID",
    "EMAIL_CLIENT_SECRET",
    "EMAIL_REFRESH_TOKEN",
  ].filter((key) => !String(process.env[key] || "").trim());

  if (missing.length) {
    throw new Error(
      `Email is not configured. Missing env: ${missing.join(", ")}`
    );
  }
};

const getGmailClient = async () => {
  requiredEmailEnv();

  const oauth2Client = new google.auth.OAuth2(
    process.env.EMAIL_CLIENT_ID,
    process.env.EMAIL_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.EMAIL_REFRESH_TOKEN,
  });

  // Force refresh so auth failures surface before send.
  await oauth2Client.getAccessToken();

  return google.gmail({
    version: "v1",
    auth: oauth2Client,
  });
};

const getPortalUrl = () =>
  (process.env.CLIENT_URL || "https://hcl-sathee.vercel.app").replace(/\/$/, "");

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const stripLineBreaks = (value) => String(value ?? "").replace(/[\r\n]+/g, " ").trim();

// RFC 2047: header text outside printable ASCII must be sent as encoded-words,
// each at most 75 characters, so long non-ASCII subjects are split by bytes.
const encodeHeader = (value) => {
  const clean = stripLineBreaks(value);
  if (/^[\x20-\x7E]*$/.test(clean)) return clean;

  const words = [];
  let chunk = "";
  for (const char of clean) {
    if (Buffer.byteLength(chunk + char, "utf8") > 42) {
      words.push(chunk);
      chunk = "";
    }
    chunk += char;
  }
  if (chunk) words.push(chunk);

  return words
    .map((word) => `=?UTF-8?B?${Buffer.from(word, "utf8").toString("base64")}?=`)
    .join("\r\n ");
};

const encodeBody = (value) =>
  Buffer.from(String(value ?? ""), "utf8")
    .toString("base64")
    .replace(/(.{76})/g, "$1\r\n");

const toBase64Url = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const buildMimeMessage = ({ from, to, subject, text, html }) => {
  const recipient = stripLineBreaks(to).replace(/[<>]/g, "");
  const domain = String(from).split("@")[1] || "localhost";
  const boundary = `sathee_${crypto.randomBytes(12).toString("hex")}`;

  const message = [
    `From: ${FROM_NAME} <${stripLineBreaks(from)}>`,
    `To: ${recipient}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    "Auto-Submitted: auto-generated",
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encodeBody(text),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encodeBody(html),
    `--${boundary}--`,
    "",
  ].join("\r\n");

  return toBase64Url(message);
};

async function deliver({ to, subject, text, html }) {
  const from = String(process.env.EMAIL_USER || "").trim();
  const gmail = await getGmailClient();
  const raw = buildMimeMessage({ from, to, subject, text, html });
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
  return res.data;
}

// Deliberately plain: no banner graphics, no gradients, and every value that
// came from a user is escaped before it reaches the HTML.
const layout = (bodyHtml) => `<!DOCTYPE html>
<html>
  <body style="margin:0; padding:24px; background:#ffffff;">
    <div style="font-family: Arial, Helvetica, sans-serif; font-size:15px; color:#1f2937; line-height:1.6; max-width:560px;">
${bodyHtml}
      <p style="margin:28px 0 0; padding-top:14px; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280;">HCL SATHEE Portal</p>
    </div>
  </body>
</html>`;

const boxStyle =
  "background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:12px; white-space:pre-wrap;";

const renderWelcomeEmail = ({ name, role, link }) => {
  const portalUrl = getPortalUrl();

  const text = [
    `Hello ${name},`,
    "",
    `An administrator has created an HCL SATHEE account for you (role: ${role}).`,
    "",
    "To finish setting it up, choose your password using the link below. The link is valid for 24 hours:",
    link,
    "",
    `You can also open the portal directly at ${portalUrl}. If the link has expired, ask your administrator to resend the invitation.`,
    "",
    "If you were not expecting this account, you can ignore this email.",
    "",
    "HCL SATHEE",
  ].join("\n");

  const html = layout(`
      <p style="margin:0 0 14px;">Hello ${escapeHtml(name)},</p>
      <p style="margin:0 0 14px;">An administrator has created an HCL SATHEE account for you (role: <strong>${escapeHtml(role)}</strong>).</p>
      <p style="margin:0 0 14px;">To finish setting it up, choose your password. The link is valid for 24 hours.</p>
      <p style="margin:20px 0;"><a href="${escapeHtml(link)}" style="display:inline-block; padding:10px 18px; background:#2563eb; color:#ffffff; text-decoration:none; border-radius:6px;">Set your password</a></p>
      <p style="margin:0 0 14px;">You can also open the portal directly at <a href="${escapeHtml(portalUrl)}" style="color:#2563eb;">${escapeHtml(portalUrl)}</a>. If the link has expired, ask your administrator to resend the invitation.</p>
      <p style="margin:0; color:#6b7280;">If you were not expecting this account, you can ignore this email.</p>`);

  return { subject: "Set up your HCL SATHEE account", text, html };
};

const renderSupportQueryEmail = ({ partnerName, title, description }) => {
  const text = [
    "Hello Admin,",
    "",
    `A new query has been submitted by ${partnerName}.`,
    "",
    `Title: ${title}`,
    "",
    `Description: ${description}`,
    "",
    "Please log in to the admin portal to review and reply.",
  ].join("\n");

  const html = layout(`
      <p style="margin:0 0 14px;">Hello Admin,</p>
      <p style="margin:0 0 14px;">A new query was submitted by <strong>${escapeHtml(partnerName)}</strong>.</p>
      <p style="margin:0 0 6px;"><strong>Title:</strong> ${escapeHtml(title)}</p>
      <p style="margin:0 0 6px;"><strong>Description:</strong></p>
      <div style="${boxStyle}">${escapeHtml(description)}</div>
      <p style="margin:14px 0 0;">Please log in to the admin portal to review and reply.</p>`);

  return { subject: "New partner query submitted", text, html };
};

const renderSupportQueryReplyEmail = ({ adminName, title, message }) => {
  const text = [
    "Hello,",
    "",
    `${adminName} replied to your query "${title}":`,
    "",
    message,
    "",
    "Log in to the portal to view the full conversation or reply.",
  ].join("\n");

  const html = layout(`
      <p style="margin:0 0 14px;">Hello,</p>
      <p style="margin:0 0 6px;"><strong>${escapeHtml(adminName)}</strong> replied to your query <strong>${escapeHtml(title)}</strong>:</p>
      <div style="${boxStyle}">${escapeHtml(message)}</div>
      <p style="margin:14px 0 0;">Log in to the portal to view the full conversation or reply.</p>`);

  return { subject: `Re: ${stripLineBreaks(title)}`, text, html };
};

const renderPasswordResetOtpEmail = ({ name, otp }) => {
  const code = String(otp);

  const text = [
    `Hello ${name},`,
    "",
    `Your HCL SATHEE password reset code is: ${code}`,
    "",
    "The code expires in 10 minutes.",
    "",
    "If you did not request a password reset, you can ignore this email; your password has not been changed.",
    "",
    "HCL SATHEE",
  ].join("\n");

  const html = layout(`
      <p style="margin:0 0 14px;">Hello ${escapeHtml(name)},</p>
      <p style="margin:0 0 14px;">Your HCL SATHEE password reset code is:</p>
      <p style="margin:0 0 14px; font-size:28px; font-weight:bold; letter-spacing:4px; font-family:'Courier New', monospace;">${escapeHtml(code)}</p>
      <p style="margin:0 0 14px;">The code expires in 10 minutes.</p>
      <p style="margin:0; color:#6b7280;">If you did not request a password reset, you can ignore this email; your password has not been changed.</p>`);

  return { subject: "Your HCL SATHEE verification code", text, html };
};

async function sendWelcomeEmail(to, name, role) {
  const link = createPasswordLink(name, to, role);
  return deliver({ to, ...renderWelcomeEmail({ name, role, link }) });
}

async function sendSupportQueryEmail(to, { partnerName, title, description }) {
  await deliver({ to, ...renderSupportQueryEmail({ partnerName, title, description }) });
}

async function sendSupportQueryReplyEmail(to, { adminName, title, message }) {
  await deliver({ to, ...renderSupportQueryReplyEmail({ adminName, title, message }) });
}

async function sendPasswordResetOtpEmail(to, name, otp) {
  await deliver({ to, ...renderPasswordResetOtpEmail({ name, otp }) });
}

module.exports = {
  sendWelcomeEmail,
  sendSupportQueryEmail,
  sendSupportQueryReplyEmail,
  sendPasswordResetOtpEmail,
  buildMimeMessage,
  escapeHtml,
  encodeHeader,
  renderWelcomeEmail,
  renderSupportQueryEmail,
  renderSupportQueryReplyEmail,
  renderPasswordResetOtpEmail,
};
