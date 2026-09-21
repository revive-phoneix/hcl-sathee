const assert = require("assert");

process.env.JWT_SECRET = "test-secret";
process.env.CLIENT_URL = "https://portal.example.org";

const {
  buildMimeMessage,
  escapeHtml,
  encodeHeader,
  renderWelcomeEmail,
  renderSupportQueryEmail,
  renderSupportQueryReplyEmail,
  renderPasswordResetOtpEmail,
} = require("../src/Utils/sendEmail");

const decodeRaw = (raw) => Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
const decodePart = (message, contentType) => {
  const [, afterHeader] = message.split(`Content-Type: ${contentType}; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n`);
  const body = afterHeader.split("\r\n--")[0];
  return Buffer.from(body.replace(/\r\n/g, ""), "base64").toString("utf8");
};

// --- escaping ---------------------------------------------------------
assert.strictEqual(
  escapeHtml(`<a href="x">&'</a>`),
  "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;"
);

// --- header encoding --------------------------------------------------
assert.strictEqual(encodeHeader("Plain subject"), "Plain subject");
assert.strictEqual(encodeHeader("Line1\r\nBcc: evil@example.com"), "Line1 Bcc: evil@example.com");
const hindi = encodeHeader("प्रश्न: परीक्षा की तारीख कब है और कौन सा पाठ्यक्रम शुरू होगा");
assert.ok(hindi.split("\r\n ").every((word) => /^=\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=$/.test(word) && word.length <= 75));

// --- MIME structure ---------------------------------------------------
const raw = buildMimeMessage({
  from: "sender@gmail.com",
  to: "user@example.com\r\nBcc: attacker@example.com",
  subject: "Re: प्रश्न",
  text: "Portal • Powered",
  html: "<p>Portal • Powered</p>",
});
const message = decodeRaw(raw);
const headerBlock = message.split("\r\n\r\n")[0];

assert.ok(/^From: SATHEE Admin <sender@gmail\.com>$/m.test(headerBlock));
assert.ok(/^To: user@example\.com Bcc: attacker@example\.com$/m.test(headerBlock), "recipient must not allow header injection");
assert.ok(!/^Bcc:/m.test(headerBlock));
assert.ok(/^Message-ID: <[0-9a-f-]+@gmail\.com>$/m.test(headerBlock));
assert.ok(/^Subject: =\?UTF-8\?B\?/m.test(headerBlock));
assert.ok(/^Auto-Submitted: auto-generated$/m.test(headerBlock));
assert.ok(!/7bit/i.test(message), "no 7bit declaration for UTF-8 content");
assert.ok(/^[\x00-\x7F]*$/.test(message), "wire format must be pure ASCII");
assert.strictEqual(decodePart(message, "text/plain"), "Portal • Powered");
assert.strictEqual(decodePart(message, "text/html"), "<p>Portal • Powered</p>");

// --- templates escape user input -------------------------------------
const evil = `<script>alert(1)</script><a href="https://evil.example">click</a>`;

const query = renderSupportQueryEmail({ partnerName: evil, title: evil, description: evil });
assert.ok(!query.html.includes("<script>") && !query.html.includes('<a href="https://evil.example"'));
assert.ok(query.html.includes("&lt;script&gt;"));

const reply = renderSupportQueryReplyEmail({ adminName: evil, title: "Q\r\nBcc: x@y.z", message: evil });
assert.ok(!reply.html.includes("<script>"));
assert.ok(!/[\r\n]/.test(reply.subject), "reply subject must be a single line");

const otp = renderPasswordResetOtpEmail({ name: evil, otp: 123456 });
assert.ok(!otp.html.includes("<script>"));
assert.ok(otp.text.includes("123456") && otp.html.includes("123456"));

// --- welcome email: one link, no phishing-style phrasing ---------------
const link = "https://portal.example.org/create-password?token=abc.def.ghi";
const welcome = renderWelcomeEmail({ name: "Asha", role: "HCL PARTNER", link });
assert.ok(welcome.text.includes(link), "plain-text part carries the setup link");
assert.strictEqual((welcome.html.match(/create-password\?token=/g) || []).length, 1, "HTML shows the setup link only once");
assert.ok(welcome.html.includes("https://portal.example.org"), "portal address is shown so the recipient can verify it");
assert.ok(!/linear-gradient/i.test(welcome.html), "no banner gradients");
assert.ok(!/password/i.test(welcome.subject) || !/create your password/i.test(welcome.subject), "subject avoids the phishing-style phrase");
assert.ok(!welcome.html.includes("•"), "no non-ASCII decoration in templates");

console.log("send email tests passed");
