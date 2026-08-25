const { google } = require("googleapis");
const { createPasswordLink } = require("./createPasswordLink");

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

function createMessage(from, to, subject, text, html) {
  const boundary = "0000000000000000000000000000000000000000";
  const message = [
    `From: SATHEE Admin <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "MIME-Version: 1.0",
    `Date: ${new Date().toUTCString()}`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    html,
    "",
    `--${boundary}--`,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sendWelcomeEmail(to, name, role) {
  const from = String(process.env.EMAIL_USER || "").trim();
  const link = createPasswordLink(name, to, role);
  const text = `Hello ${name},\n\nYour account has been created as ${role}.\n\nPlease set your password using the link below:\n${link}\n\nIf the button does not work, copy and paste this URL into your browser.\n\nWelcome to HCL SATHEE.`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height:1.6;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #2563eb 100%); padding: 32px; color: white; text-align: center;">
          <h1 style="margin:0; font-size: 28px;">Welcome to HCL SATHEE</h1>
          <p style="margin: 8px 0 0; opacity: 0.85;">Your portal for students, teachers, and administration.</p>
        </div>

        <div style="padding: 32px; background: white;">
          <p style="margin: 0 0 16px; font-size: 16px;">Hi <strong>${name}</strong>,</p>
          <p style="margin: 0 0 16px;">Your account has been successfully created with the role of <strong>${role}</strong>.</p>
          <p style="margin: 0 0 24px;">Click the button below to set your password and complete your account setup.</p>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${link}" style="display: inline-block; padding: 14px 26px; background: #2563eb; color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">Create Your Password</a>
          </div>

          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">If the button doesn't work, use this link:</p>
          <p style="margin: 0 0 24px; font-size: 13px; word-break: break-all; color: #2563eb;"><a href="${link}" style="color: #2563eb; text-decoration: none;">${link}</a></p>

          <p style="margin: 0 0 16px;">Thank you for joining HCL SATHEE. We're excited to have you onboard.</p>

          <div style="padding: 20px; background: #f8fafc; border-radius: 12px;">
            <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Need help?</strong> Reply to this email and our support team will assist you.</p>
          </div>
        </div>

        <div style="padding: 16px 32px; background: #f8fafc; color: #64748b; text-align: center; font-size: 13px;">
          <p style="margin: 0;">HCL SATHEE Portal • Powered by HCL</p>
        </div>
      </div>
    </div>
  `;

  const subject = "Welcome to HCL SATHEE - Create Your Password";
  const gmail = await getGmailClient();
  const raw = createMessage(from, to, subject, text, html);

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  console.log("Email Sent Successfully", res.data.id, res.data.labelIds);
  return res.data;
}

async function sendSupportQueryEmail(to, { partnerName, title, description }) {
  const from = String(process.env.EMAIL_USER || "").trim();
  const subject = "New partner query submitted";
  const text = [
    "Hello Admin,",
    "",
    `A new query has been submitted by ${partnerName}.`,
    "",
    `Title: ${title}`,
    "",
    `Description: ${description}`,
    "",
    "Please log in to the admin panel to view and reply to the query.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #2563eb 100%); padding: 28px; color: white;">
          <h2 style="margin:0; font-size: 24px;">New Partner Query</h2>
        </div>
        <div style="padding: 28px; background: white;">
          <p style="margin: 0 0 12px;"><strong>Submitted by:</strong> ${partnerName}</p>
          <p style="margin: 0 0 12px;"><strong>Title:</strong> ${title}</p>
          <p style="margin: 0 0 18px;"><strong>Description:</strong></p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; white-space: pre-wrap;">${description}</div>
          <p style="margin: 20px 0 0;">Please log in to the admin portal to review and reply.</p>
        </div>
      </div>
    </div>
  `;

  const gmail = await getGmailClient();
  const raw = createMessage(from, to, subject, text, html);
  await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
}

async function sendPasswordResetOtpEmail(to, name, otp) {
  const from = String(process.env.EMAIL_USER || "").trim();
  const subject = "Your SATHEE password reset code";
  const text = `Hello ${name},\n\nYour password reset code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this password reset, please ignore this email.\n\nBest regards,\nHCL SATHEE Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #2563eb 100%); padding: 28px; color: white; text-align: center;">
          <h2 style="margin:0; font-size: 24px;">Password Reset Code</h2>
        </div>
        <div style="padding: 28px; background: white;">
          <p style="margin: 0 0 16px;">Hi <strong>${name}</strong>,</p>
          <p style="margin: 0 0 20px;">We received a request to reset your SATHEE account password. Use the code below to proceed.</p>
          
          <div style="background: #f3f4f6; border: 2px solid #2563eb; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Your verification code:</p>
            <p style="margin: 8px 0 0; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #2563eb; font-family: 'Courier New', monospace;">${otp}</p>
          </div>
          
          <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">This code will expire in <strong>10 minutes</strong>.</p>
          
          <div style="padding: 16px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Security tip:</strong> If you didn't request a password reset, please ignore this email. Your account is secure.</p>
          </div>
          
          <p style="margin: 20px 0 0;">Best regards,<br><strong>HCL SATHEE Team</strong></p>
        </div>
        
        <div style="padding: 16px 28px; background: #f8fafc; color: #64748b; text-align: center; font-size: 13px;">
          <p style="margin: 0;">HCL SATHEE Portal • Powered by HCL</p>
        </div>
      </div>
    </div>
  `;

  const gmail = await getGmailClient();
  const raw = createMessage(from, to, subject, text, html);
  await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
}

module.exports = {
  sendWelcomeEmail,
  sendSupportQueryEmail,
  sendPasswordResetOtpEmail,
};
