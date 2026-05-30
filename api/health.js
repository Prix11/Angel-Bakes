const { sendJson } = require("../lib/api-helpers");
const { useKv } = require("../lib/orders-store");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  sendJson(res, 200, {
    ok: true,
    service: "angel-bakes",
    storage: useKv() ? "vercel-kv" : "local-file",
  });
};
