const fs = require("fs").promises;
const path = require("path");

let cachedPassword = null;

async function getAdminPassword() {
  if (cachedPassword) return cachedPassword;

  if (process.env.ADMIN_PASSWORD) {
    cachedPassword = process.env.ADMIN_PASSWORD;
    return cachedPassword;
  }

  try {
    const configPath = path.join(process.cwd(), "config.json");
    const raw = await fs.readFile(configPath, "utf8");
    const config = JSON.parse(raw);
    if (config.adminPassword) {
      cachedPassword = String(config.adminPassword);
      return cachedPassword;
    }
  } catch (err) {
    if (err.code !== "ENOENT") console.warn("config.json:", err.message);
  }

  cachedPassword = "angelbakes";
  return cachedPassword;
}

module.exports = { getAdminPassword };
