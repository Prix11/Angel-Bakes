require("dotenv").config();

const express = require("express");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const { getAdminPassword } = require("./lib/config");
const { createAdminToken, requireAdmin } = require("./lib/auth");
const { readOrders, writeOrders } = require("./lib/orders-store");

const app = express();
const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

app.use(express.json({ limit: "100kb" }));

// Serve static files (HTML, CSS, JS, images)
app.use(
  express.static(ROOT, {
    index: ["index.html"],
    extensions: ["html", "css", "js", "jpg", "png", "ico", "svg"],
  })
);

function sendPublicFile(res, filePath) {
  const full = path.join(ROOT, filePath);
  if (fs.existsSync(full)) {
    return res.sendFile(full);
  }
  return res.status(404).send("Not found");
}

// Explicit routes so JS/CSS always load on cloud hosts
app.get("/nav.js", (req, res) => sendPublicFile(res, "nav.js"));
app.get("/order.js", (req, res) => sendPublicFile(res, "order.js"));
app.get("/main.js", (req, res) => sendPublicFile(res, "main.js"));
app.get("/admin.js", (req, res) => sendPublicFile(res, "admin.js"));
app.get("/styles.css", (req, res) => sendPublicFile(res, "styles.css"));

app.get("/api/health", async (req, res) => {
  const { useKv, readOrders } = require("./lib/orders-store");
  const payload = {
    ok: true,
    service: "angel-bakes",
    storage: useKv() ? "upstash-kv" : "local-file",
  };

  if (useKv()) {
    try {
      await readOrders();
      payload.database = "connected";
    } catch (err) {
      payload.database = "error";
      payload.databaseError = err.message;
    }
  }

  res.json(payload);
});

app.post("/api/orders", async (req, res) => {
  try {
    const { customer, items, total } = req.body;

    if (!customer?.name || !customer?.contact || !customer?.pickupDate || !items?.length) {
      return res.status(400).json({ error: "Missing order details" });
    }

    const order = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "new",
      customer: {
        name: String(customer.name).trim(),
        contact: String(customer.contact).trim(),
        pickupDate: String(customer.pickupDate).trim(),
        notes: customer.notes ? String(customer.notes).trim() : "",
      },
      items,
      total: Number(total) || 0,
    };

    const orders = await readOrders();
    orders.unshift(order);
    await writeOrders(orders);

    res.status(201).json({ ok: true, id: order.id });
  } catch (err) {
    console.error("POST /api/orders", err);
    res.status(500).json({ error: "Could not save order" });
  }
});

app.post("/api/admin/login", async (req, res) => {
  const password = String(req.body?.password || "").trim();
  const adminPassword = await getAdminPassword();

  if (password !== adminPassword) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const token = await createAdminToken();
  res.json({ token });
});

app.get("/api/orders", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  try {
    res.json(await readOrders());
  } catch (err) {
    console.error("GET /api/orders", err);
    res.status(500).json({
      error: err.message || "Could not load orders",
    });
  }
});

app.patch("/api/orders/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  try {
    const { status } = req.body;
    if (!["new", "done"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const orders = await readOrders();
    const index = orders.findIndex((o) => o.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Order not found" });

    orders[index].status = status;
    orders[index].updatedAt = new Date().toISOString();
    await writeOrders(orders);
    res.json(orders[index]);
  } catch (err) {
    console.error("PATCH /api/orders", err);
    res.status(500).json({ error: "Could not update order" });
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  try {
    const orders = await readOrders();
    const next = orders.filter((o) => o.id !== req.params.id);
    if (next.length === orders.length) {
      return res.status(404).json({ error: "Order not found" });
    }
    await writeOrders(next);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/orders", err);
    res.status(500).json({ error: "Could not delete order" });
  }
});

getAdminPassword().then((password) => {
  app.listen(PORT, () => {
    console.log(`Angel Bakes running at http://localhost:${PORT}`);
    console.log(`Admin: http://localhost:${PORT}/admin.html`);
    console.log(`Admin password: ${password}`);
    console.log(`Local orders file: data/orders.json`);
  });
});
