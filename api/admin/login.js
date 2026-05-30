const { sendJson, readBody } = require("../../lib/api-helpers");
const { getAdminPassword } = require("../../lib/config");
const { createAdminToken } = require("../../lib/auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const password = String(readBody(req).password || "").trim();
  const adminPassword = await getAdminPassword();

  if (password !== adminPassword) {
    return sendJson(res, 401, { error: "Invalid password" });
  }

  const token = await createAdminToken();
  sendJson(res, 200, { token });
};
