const TOKEN_KEY = "angelBakesAdminToken";

const loginSection = document.getElementById("admin-login");
const dashboard = document.getElementById("admin-dashboard");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");
const ordersList = document.getElementById("admin-orders");
const ordersSummary = document.getElementById("orders-summary");
const adminEmpty = document.getElementById("admin-empty");
const statusFilter = document.getElementById("status-filter");
const refreshBtn = document.getElementById("refresh-btn");

let pollTimer = null;

function formatPHP(amount) {
  return `₱${Number(amount).toLocaleString("en-PH")}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

function fetchWithTimeout(url, options = {}, ms = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body) headers["Content-Type"] = "application/json";

  return fetchWithTimeout(path, { ...options, headers }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      signOut();
      throw new Error("Session expired — please sign in again.");
    }
    if (!res.ok) {
      throw new Error(data.error || data.databaseError || `Request failed (${res.status})`);
    }
    return data;
  });
}

function showDashboard() {
  loginSection.classList.add("hidden");
  dashboard.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
}

function showLogin() {
  loginSection.classList.remove("hidden");
  dashboard.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function signOut() {
  setToken(null);
  showLogin();
}

function showOrdersError(message) {
  ordersSummary.textContent = "Could not load orders";
  ordersList.innerHTML = "";
  adminEmpty.textContent = message;
  adminEmpty.classList.remove("hidden");
}

function renderOrders(orders) {
  const filter = statusFilter.value;
  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const newCount = orders.filter((o) => o.status === "new").length;
  ordersSummary.textContent =
    newCount > 0
      ? `${newCount} new order${newCount === 1 ? "" : "s"} · ${orders.length} total`
      : `${orders.length} order${orders.length === 1 ? "" : "s"} total`;

  if (filtered.length === 0) {
    ordersList.innerHTML = "";
    adminEmpty.textContent =
      "No orders yet. New orders will appear here when customers submit from the order page.";
    adminEmpty.classList.remove("hidden");
    return;
  }

  adminEmpty.classList.add("hidden");
  ordersList.innerHTML = filtered
    .map(
      (order) => `
    <li class="admin-order-card ${order.status === "new" ? "is-new" : ""}" data-id="${order.id}">
      <div class="admin-order-top">
        <div>
          <span class="admin-order-badge">${order.status === "new" ? "New" : "Done"}</span>
          <h2>${escapeHtml(order.customer.name)}</h2>
          <p class="admin-order-meta">${formatDate(order.createdAt)} · Pickup ${escapeHtml(order.customer.pickupDate)}</p>
        </div>
        <p class="admin-order-total">${formatPHP(order.total)}</p>
      </div>
      <ul class="admin-order-items">
        ${order.items
          .map(
            (item) =>
              `<li>${item.qty} ${item.qty === 1 ? "pc" : "pcs"} ${escapeHtml(item.name)} — ${formatPHP(item.subtotal)}</li>`
          )
          .join("")}
      </ul>
      <dl class="admin-order-contact">
        <div><dt>Contact</dt><dd>${escapeHtml(order.customer.contact)}</dd></div>
        ${
          order.customer.notes
            ? `<div><dt>Notes</dt><dd>${escapeHtml(order.customer.notes)}</dd></div>`
            : ""
        }
      </dl>
      <div class="admin-order-actions">
        ${
          order.status === "new"
            ? `<button type="button" class="btn btn-primary btn-small" data-action="done" data-id="${order.id}">Mark done</button>`
            : `<button type="button" class="btn btn-ghost btn-small" data-action="reopen" data-id="${order.id}">Mark as new</button>`
        }
        <button type="button" class="btn btn-ghost btn-small admin-delete" data-action="delete" data-id="${order.id}">Delete</button>
      </div>
    </li>
  `
    )
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function loadOrders() {
  ordersSummary.textContent = "Loading orders…";

  try {
    const orders = await api("/api/orders");
    if (!Array.isArray(orders)) {
      throw new Error("Server returned invalid data.");
    }
    renderOrders(orders);
    return orders;
  } catch (err) {
    const msg =
      err.name === "AbortError"
        ? "Request timed out. Check Upstash keys on Render and redeploy."
        : err.message ||
          "Could not load orders. Check KV_REST_API_URL and KV_REST_API_TOKEN on Render.";
    showOrdersError(msg);
    throw err;
  }
}

function showLoginError(message) {
  loginError.textContent = message;
  loginError.classList.remove("hidden");
}

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.classList.add("hidden");

  const password = String(new FormData(loginForm).get("password") || "").trim();

  if (window.location.protocol === "file:") {
    showLoginError(
      "Open admin at https://angel-bakes.onrender.com/admin.html (not from a file on your PC)."
    );
    return;
  }

  try {
    const health = await fetchWithTimeout("/api/health/db").then((r) => r.json());
    if (!health.ok) throw new Error("Server not ready");

    if (health.storage === "upstash-kv" && health.database === "error") {
      throw new Error(
        health.databaseError ||
          "Order database not connected. Fix KV_REST_API_URL and KV_REST_API_TOKEN on Render."
      );
    }

    const res = await fetchWithTimeout("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      showLoginError("Wrong password. Use the ADMIN_PASSWORD you set on Render.");
      return;
    }

    if (!res.ok) throw new Error(data.error || "Login failed");

    setToken(data.token);
    showDashboard();

    try {
      await loadOrders();
      pollTimer = setInterval(() => {
        loadOrders().catch(() => {});
      }, 15000);
    } catch {
      showLoginError(
        "Signed in but orders could not load. Check Upstash keys on Render, redeploy, then try again."
      );
    }
  } catch (err) {
    showLoginError(
      err.message ||
        "Cannot reach the shop server. Make sure Render deployed successfully."
    );
  }
});

logoutBtn?.addEventListener("click", signOut);

refreshBtn?.addEventListener("click", () => {
  loadOrders().catch(() => {});
});

statusFilter?.addEventListener("change", () => {
  loadOrders().catch(() => {});
});

ordersList?.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const { action, id } = btn.dataset;

  try {
    if (action === "done") {
      await api(`/api/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "done" }),
      });
    } else if (action === "reopen") {
      await api(`/api/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "new" }),
      });
    } else if (action === "delete") {
      if (!confirm("Delete this order permanently?")) return;
      await api(`/api/orders/${id}`, { method: "DELETE" });
    }
    await loadOrders();
  } catch (err) {
    alert(err.message || "Something went wrong");
  }
});

if (getToken()) {
  showDashboard();
  loadOrders()
    .then(() => {
      pollTimer = setInterval(() => {
        loadOrders().catch(() => {});
      }, 15000);
    })
    .catch(() => {});
} else {
  showLogin();
}
