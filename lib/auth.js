const crypto = require("crypto");
const { getAdminPassword } = require("./config");

async function createAdminToken() {
  const secret = await getAdminPassword();
  const payload = JSON.stringify({ exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

async function verifyAdminToken(token) {
  if (!token) return false;

  const secret = await getAdminPassword();
  const [dataB64, sig] = token.split(".");
  if (!dataB64 || !sig) return false;

  try {
    const payload = Buffer.from(dataB64, "base64url").toString("utf8");
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    if (sig !== expected) return false;

    const { exp } = JSON.parse(payload);
    return exp > Date.now();
  } catch {
    return false;
  }
}

function getBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  return header?.replace(/^Bearer\s+/i, "") || "";
}

async function requireAdmin(req, res) {
  const token = getBearerToken(req);
  const ok = await verifyAdminToken(token);
  if (!ok) {
    if (res.status) res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

module.exports = {
  createAdminToken,
  verifyAdminToken,
  getBearerToken,
  requireAdmin,
};
