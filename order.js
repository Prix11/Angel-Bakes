const PRICE_PER_PIECE = 35;
const PRICE_FOR_THREE = 100;
const PACK_SIZE = 3;

const items = document.querySelectorAll(".order-item");
const cartLines = document.getElementById("cart-lines");
const cartTotalEl = document.getElementById("cart-total");
const submitBtn = document.getElementById("submit-btn");
const form = document.getElementById("checkout-form");
const successDialog = document.getElementById("order-success");
const successMessage = document.getElementById("success-message");
const successClose = document.getElementById("success-close");

const cart = new Map();

function formatPHP(amount) {
  return `₱${amount.toLocaleString("en-PH")}`;
}

function calculatePiecesPrice(qty) {
  const packs = Math.floor(qty / PACK_SIZE);
  const singles = qty % PACK_SIZE;
  return packs * PRICE_FOR_THREE + singles * PRICE_PER_PIECE;
}

function getCartTotal() {
  let total = 0;
  cart.forEach(({ qty }) => {
    total += calculatePiecesPrice(qty);
  });
  return total;
}

function renderCart() {
  if (cart.size === 0) {
    cartLines.innerHTML = '<li class="cart-empty">Add cookies to see your total</li>';
    cartTotalEl.textContent = "₱0";
    submitBtn.disabled = true;
    return;
  }

  cartLines.innerHTML = "";
  cart.forEach(({ name, qty }) => {
    const li = document.createElement("li");
    const pieceLabel = qty === 1 ? "pc" : "pcs";
    li.innerHTML = `<span>${qty} ${pieceLabel} ${name}</span><span>${formatPHP(calculatePiecesPrice(qty))}</span>`;
    cartLines.appendChild(li);
  });

  cartTotalEl.textContent = formatPHP(getCartTotal());
  submitBtn.disabled = false;
}

function setQty(itemEl, qty) {
  const id = itemEl.dataset.id;
  const name = itemEl.dataset.name;
  const input = itemEl.querySelector(".qty-input");

  qty = Math.max(0, Math.min(99, qty));
  input.value = qty;

  if (qty === 0) {
    cart.delete(id);
  } else {
    cart.set(id, { name, qty });
  }

  renderCart();
}

items.forEach((item) => {
  const input = item.querySelector(".qty-input");

  item.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const current = parseInt(input.value, 10) || 0;
      const delta = btn.dataset.action === "increase" ? 1 : -1;
      setQty(item, current + delta);
    });
  });

  input.addEventListener("change", () => {
    setQty(item, parseInt(input.value, 10) || 0);
  });
});

const pickupInput = form?.querySelector('[name="pickup-date"]');
if (pickupInput) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  pickupInput.min = tomorrow.toISOString().split("T")[0];
}

function buildOrderPayload(formData) {
  const items = [];
  cart.forEach(({ name, qty }) => {
    items.push({
      name,
      qty,
      subtotal: calculatePiecesPrice(qty),
    });
  });

  return {
    customer: {
      name: formData.get("name"),
      contact: formData.get("contact"),
      pickupDate: formData.get("pickup-date"),
      notes: formData.get("notes") || "",
    },
    items,
    total: getCartTotal(),
  };
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (cart.size === 0) return;

  const data = new FormData(form);
  const payload = buildOrderPayload(data);

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Could not submit order");
    }

    successMessage.textContent = `Thanks, ${data.get("name")}! We'll reach you at ${data.get("contact")} to confirm pickup on ${data.get("pickup-date")}.`;
    successDialog.showModal();
  } catch (err) {
    alert(
      err.message ||
        "Could not send your order. Make sure the shop server is running, then try again."
    );
  } finally {
    submitBtn.disabled = cart.size === 0;
    submitBtn.textContent = "Submit Order";
  }
});

successClose?.addEventListener("click", () => {
  successDialog.close();
  form.reset();
  cart.clear();
  items.forEach((item) => {
    item.querySelector(".qty-input").value = 0;
  });
  renderCart();
});

renderCart();
