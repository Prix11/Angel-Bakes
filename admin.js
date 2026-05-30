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

function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body) headers["Content-Type"] = "application/json";

  return fetch(path, { ...options, headers }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      signOut();
      throw new Error("Session expired");
    }
    if (!res.ok) throw new Error(data.error || "Request failed");
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
  if (pollTimer) clearInterval(pollTimer);
}

function signOut() {
  setToken(null);
  showLogin();
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
  const orders = await api("/api/orders");
  renderOrders(orders);
  return orders;
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
      "Open admin through the server: http://localhost:8080/admin.html (run start-server.bat first)."
    );
    return;
  }

  try {
    const health = await fetch("/api/health");
    if (!health.ok) throw new Error("server");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      showLoginError("Wrong password. Use angelbakes or check config.json on your PC.");
      return;
    }

    if (!res.ok) throw new Error(data.error || "Login failed");

    setToken(data.token);
    showDashboard();
    await loadOrders();
    pollTimer = setInterval(loadOrders, 15000);
  } catch {
    showLoginError(
      "Cannot reach the shop server. Run start-server.bat, then open http://localhost:8080/admin.html"
    );
  }
});

logoutBtn?.addEventListener("click", signOut);

refreshBtn?.addEventListener("click", () => loadOrders().catch(() => {}));

statusFilter?.addEventListener("change", () => loadOrders().catch(() => {}));

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
      pollTimer = setInterval(loadOrders, 15000);
    })
    .catch(signOut);
} else {
  showLogin();
}
