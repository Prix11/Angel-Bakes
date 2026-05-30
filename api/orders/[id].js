const { sendJson, readBody } = require("../../lib/api-helpers");
const { requireAdmin } = require("../../lib/auth");
const { readOrders, writeOrders } = require("../../lib/orders-store");

module.exports = async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  const { id } = req.query;

  if (req.method === "PATCH") {
    try {
      const { status } = readBody(req);
      if (!["new", "done"].includes(status)) {
        return sendJson(res, 400, { error: "Invalid status" });
      }

      const orders = await readOrders();
      const index = orders.findIndex((o) => o.id === id);
      if (index === -1) return sendJson(res, 404, { error: "Order not found" });

      orders[index].status = status;
      orders[index].updatedAt = new Date().toISOString();
      await writeOrders(orders);
      return sendJson(res, 200, orders[index]);
    } catch (err) {
      console.error("PATCH /api/orders", err);
      return sendJson(res, 500, { error: "Could not update order" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const orders = await readOrders();
      const next = orders.filter((o) => o.id !== id);
      if (next.length === orders.length) {
        return sendJson(res, 404, { error: "Order not found" });
      }
      await writeOrders(next);
      return sendJson(res, 200, { ok: true });
    } catch (err) {
      console.error("DELETE /api/orders", err);
      return sendJson(res, 500, { error: "Could not delete order" });
    }
  }

  sendJson(res, 405, { error: "Method not allowed" });
};
