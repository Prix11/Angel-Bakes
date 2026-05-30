const PACK_SIZE = 3;

const PRICES = {
  "choco-chip": { perPiece: 35, forThree: 100 },
  biscoff: { perPiece: 45, forThree: 130 },
};

const cart = new Map();

function formatPHP(amount) {
  return `₱${amount.toLocaleString("en-PH")}`;
}

function getPrices(itemId) {
  return PRICES[itemId] || PRICES["choco-chip"];
}

function calculatePiecesPrice(qty, prices) {
  const packs = Math.floor(qty / PACK_SIZE);
  const singles = qty % PACK_SIZE;
  return packs * prices.forThree + singles * prices.perPiece;
}

function getCartTotal() {
  let total = 0;
  cart.forEach(({ id, qty }) => {
    total += calculatePiecesPrice(qty, getPrices(id));
  });
  return total;
}

function initOrderPage() {
  const items = document.querySelectorAll(".order-item");
  const cartLines = document.getElementById("cart-lines");
  const cartTotalEl = document.getElementById("cart-total");
  const submitBtn = document.getElementById("submit-btn");
  const form = document.getElementById("checkout-form");
  const successDialog = document.getElementById("order-success");
  const successMessage = document.getElementById("success-message");
  const successClose = document.getElementById("success-close");

  if (!cartLines || !cartTotalEl || !submitBtn) {
    console.error("Order page: missing cart elements");
    return;
  }

  function renderCart() {
    if (cart.size === 0) {
      cartLines.innerHTML = '<li class="cart-empty">Add cookies to see your total</li>';
      cartTotalEl.textContent = "₱0";
      submitBtn.disabled = true;
      return;
    }

    cartLines.innerHTML = "";
    cart.forEach(({ id, name, qty }) => {
      const li = document.createElement("li");
      const pieceLabel = qty === 1 ? "pc" : "pcs";
      li.innerHTML = `<span>${qty} ${pieceLabel} ${name}</span><span>${formatPHP(calculatePiecesPrice(qty, getPrices(id)))}</span>`;
      cartLines.appendChild(li);
    });

    cartTotalEl.textContent = formatPHP(getCartTotal());
    submitBtn.disabled = false;
  }

  function setQty(itemEl, qty) {
    const id = itemEl.dataset.id;
    const name = itemEl.dataset.name;
    const input = itemEl.querySelector(".qty-input");
    if (!id || !name || !input) return;

    qty = Math.max(0, Math.min(99, Number(qty) || 0));
    input.value = qty;

    if (qty === 0) {
      cart.delete(id);
    } else {
      cart.set(id, { id, name, qty });
    }

    renderCart();
  }

  function readQtyFromInput(input) {
    return parseInt(input.value, 10) || 0;
  }

  items.forEach((item) => {
    const input = item.querySelector(".qty-input");
    if (!input) return;

    item.querySelectorAll(".qty-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const current = readQtyFromInput(input);
        const delta = btn.dataset.action === "increase" ? 1 : -1;
        setQty(item, current + delta);
      });
    });

    input.addEventListener("input", () => {
      setQty(item, readQtyFromInput(input));
    });

    input.addEventListener("change", () => {
      setQty(item, readQtyFromInput(input));
    });
  });

  const pickupInput = form?.querySelector('[name="pickup-date"]');
  if (pickupInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    pickupInput.min = tomorrow.toISOString().split("T")[0];
  }

  function buildOrderPayload(formData) {
    const orderItems = [];
    cart.forEach(({ id, name, qty }) => {
      orderItems.push({
        name,
        qty,
        subtotal: calculatePiecesPrice(qty, getPrices(id)),
      });
    });

    return {
      customer: {
        name: formData.get("name"),
        contact: formData.get("contact"),
        pickupDate: formData.get("pickup-date"),
        notes: formData.get("notes") || "",
      },
      items: orderItems,
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
      const input = item.querySelector(".qty-input");
      if (input) input.value = 0;
    });
    renderCart();
  });

  renderCart();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initOrderPage);
} else {
  initOrderPage();
}
