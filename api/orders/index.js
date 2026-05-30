const crypto = require("crypto");
const { sendJson, readBody } = require("../../lib/api-helpers");
const { requireAdmin } = require("../../lib/auth");
const { readOrders, writeOrders } = require("../../lib/orders-store");

module.exports = async (req, res) => {
  if (req.method === "GET") {
    if (!(await requireAdmin(req, res))) return;

    try {
      const orders = await readOrders();
      return sendJson(res, 200, orders);
    } catch (err) {
      console.error("GET /api/orders", err);
      return sendJson(res, 500, { error: "Could not load orders" });
    }
  }

  if (req.method === "POST") {
    try {
      const { customer, items, total } = readBody(req);

      if (!customer?.name || !customer?.contact || !customer?.pickupDate || !items?.length) {
        return sendJson(res, 400, { error: "Missing order details" });
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

      return sendJson(res, 201, { ok: true, id: order.id });
    } catch (err) {
      console.error("POST /api/orders", err);
      return sendJson(res, 500, { error: "Could not save order" });
    }
  }

  sendJson(res, 405, { error: "Method not allowed" });
};
