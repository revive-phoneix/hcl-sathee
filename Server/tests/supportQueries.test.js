const assert = require("assert");
const { buildSupportQueryNotificationPayload } = require("../src/Utils/supportQueries");

const payload = buildSupportQueryNotificationPayload({
  title: "Portal access issue",
  description: "Unable to view the dashboard",
  user: { id: 12, name: "Mina", email: "mina@example.com" },
});

assert.strictEqual(payload.title, "New Query from Partner Portal");
assert.match(payload.body, /Mina/);
assert.match(payload.body, /Portal access issue/);
assert.strictEqual(payload.data.type, "support-query");
assert.strictEqual(payload.data.queryTitle, "Portal access issue");

console.log("support query notification tests passed");
