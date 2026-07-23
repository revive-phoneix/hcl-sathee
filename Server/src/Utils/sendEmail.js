const { google } = require('googleapis');
const { createPasswordLink } = require('./createPasswordLink');

const oauth2Client = new google.auth.OAuth2(
  process.env.EMAIL_CLIENT_ID,
  process.env.EMAIL_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.EMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({
  version: 'v1',
  auth: oauth2Client,
});

function createMessage(from, to, subject, text, html) {
  const boundary = '0000000000000000000000000000000000000000';
  const message = [
    `From: SATHEE Admin <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: multipart/alternative; boundary="' + boundary + '"',
    'MIME-Version: 1.0',
    `Date: ${new Date().toUTCString()}`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    '',
    `--${boundary}--`,
  ].join('\r\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sendWelcomeEmail(to, name, role) {
  const link = createPasswordLink(name, to);
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

          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">If the button doesn’t work, use this link:</p>
          <p style="margin: 0 0 24px; font-size: 13px; word-break: break-all; color: #2563eb;"><a href="${link}" style="color: #2563eb; text-decoration: none;">${link}</a></p>

          <p style="margin: 0 0 16px;">Thank you for joining HCL SATHEE. We’re excited to have you onboard.</p>

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

  const raw = createMessage(
    process.env.EMAIL_USER,
    to,
    'Welcome to HCL SATHEE — Create Your Password',
    text,
    html
  );

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw,
    },
  });

  console.log('Email Sent Successfully', res.data.id, res.data.labelIds);
  return res.data;
}

module.exports = {
  sendWelcomeEmail,
};
