// ==========================================================================
// VELOURA — Cart Logic & Promo Calculation Engine
// Handles multi-item quantities, promo codes, tax, delivery, and totals.
// ==========================================================================

const DELIVERY_FEE = 250;
const TAX_RATE = 0.05; // 5% GST

let appliedPromo = null;

document.addEventListener("DOMContentLoaded", () => {
  // Load any previously applied promo from session
  try {
    const savedPromo = sessionStorage.getItem("veloura_applied_promo");
    if (savedPromo) appliedPromo = JSON.parse(savedPromo);
  } catch (e) {
    appliedPromo = null;
  }

  renderCartPage();
  setupPromoHandler();
});

function renderCartPage() {
  const list = document.querySelector("#cart-list");
  const emptyState = document.querySelector("#cart-empty");
  const clearBtn = document.querySelector("#clear-cart");
  const tableHeader = document.querySelector("#cart-table-header");
  if (!list) return;

  const cart = getCart();

  if (cart.length === 0) {
    list.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    if (clearBtn) clearBtn.style.display = "none";
    if (tableHeader) tableHeader.style.display = "none";
    updateSummary(cart);
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (clearBtn) clearBtn.style.display = "inline-flex";
  if (tableHeader) tableHeader.style.display = "grid";

  list.innerHTML = cart.map(cartLineTemplate).join("");
  attachCartLineHandlers();
  updateSummary(cart);

  if (window.lucide) window.lucide.createIcons();
}

function cartLineTemplate(item) {
  const defaultImg = "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=300&q=80";
  const imageSrc = item.image || item.image_url || defaultImg;
  const lineTotal = item.price * item.quantity;

  return `
    <div class="cart-line" data-id="${item.id}">
      <div class="cart-line-thumb">
        <img src="${imageSrc}" alt="${item.name}" onerror="this.src='${defaultImg}';" loading="lazy" />
      </div>
      
      <div class="cart-line-details">
        <h4 class="cart-line-name">${item.name}</h4>
        <p class="cart-line-price">Rs ${Number(item.price).toLocaleString()} each</p>
      </div>

      <div class="cart-line-actions">
        <div class="qty-control">
          <button class="qty-minus" aria-label="Decrease quantity" data-id="${item.id}">&minus;</button>
          <span>${item.quantity}</span>
          <button class="qty-plus" aria-label="Increase quantity" data-id="${item.id}">+</button>
        </div>

        <div class="cart-line-pricing">
          <p class="cart-line-total">Rs ${lineTotal.toLocaleString()}</p>
          <button class="remove-line" data-id="${item.id}" title="Remove dish">Remove</button>
        </div>
      </div>
    </div>
  `;
}

function attachCartLineHandlers() {
  document.querySelectorAll(".cart-line").forEach((line) => {
    const id = line.dataset.id;
    const plusBtn = line.querySelector(".qty-plus");
    const minusBtn = line.querySelector(".qty-minus");
    const removeBtn = line.querySelector(".remove-line");

    if (plusBtn) plusBtn.addEventListener("click", () => changeQuantity(id, 1));
    if (minusBtn) minusBtn.addEventListener("click", () => changeQuantity(id, -1));
    if (removeBtn) removeBtn.addEventListener("click", () => removeFromCart(id));
  });

  const clearBtn = document.querySelector("#clear-cart");
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (confirm("Are you sure you want to clear your cart?")) {
        localStorage.setItem("veloura_cart", "[]");
        renderCartPage();
        if (typeof initCartBadge === "function") initCartBadge();
        if (window.showToast) window.showToast("Your cart has been cleared");
      }
    };
  }
}

function changeQuantity(id, delta) {
  const cart = getCart();
  const item = cart.find((c) => String(c.id) === String(id));
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    const filtered = cart.filter((c) => String(c.id) !== String(id));
    localStorage.setItem("veloura_cart", JSON.stringify(filtered));
  } else {
    localStorage.setItem("veloura_cart", JSON.stringify(cart));
  }

  renderCartPage();
  if (typeof initCartBadge === "function") initCartBadge();
}

function removeFromCart(id) {
  const cart = getCart().filter((c) => String(c.id) !== String(id));
  localStorage.setItem("veloura_cart", JSON.stringify(cart));
  renderCartPage();
  if (typeof initCartBadge === "function") initCartBadge();
  if (window.showToast) window.showToast("Item removed from cart");
}

function setupPromoHandler() {
  const applyBtn = document.querySelector("#apply-promo-btn");
  const promoInput = document.querySelector("#promo-input");
  const msgEl = document.querySelector("#promo-message");
  if (!applyBtn || !promoInput) return;

  if (appliedPromo && promoInput) {
    promoInput.value = appliedPromo.code;
    if (msgEl) {
      msgEl.className = "promo-feedback success";
      msgEl.textContent = `Applied: ${appliedPromo.code} (${appliedPromo.discountPercent}% Off)`;
    }
  }

  applyBtn.addEventListener("click", () => {
    const code = promoInput.value.trim().toUpperCase();
    if (!code) {
      if (msgEl) {
        msgEl.className = "promo-feedback error";
        msgEl.textContent = "Please enter a promo code.";
      }
      return;
    }

    const promoData = window.VelouraData?.PROMO_CODES?.[code];
    if (promoData) {
      appliedPromo = promoData;
      sessionStorage.setItem("veloura_applied_promo", JSON.stringify(appliedPromo));
      if (msgEl) {
        msgEl.className = "promo-feedback success";
        msgEl.textContent = `Success! ${promoData.code} applied (${promoData.discountPercent}% off).`;
      }
      if (window.showToast) window.showToast(`Promo ${promoData.code} applied!`);
      updateSummary(getCart());
    } else {
      appliedPromo = null;
      sessionStorage.removeItem("veloura_applied_promo");
      if (msgEl) {
        msgEl.className = "promo-feedback error";
        msgEl.textContent = "Invalid code. Try VELOURA10 or CHEF20.";
      }
      updateSummary(getCart());
    }
  });
}

function updateSummary(cart) {
  const subtotal = cart.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);
  const totalItemsCount = cart.reduce((sum, i) => sum + Number(i.quantity), 0);

  // Discount calculation
  let discount = 0;
  if (appliedPromo && subtotal > 0) {
    discount = Math.round((subtotal * appliedPromo.discountPercent) / 100);
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const tax = cart.length > 0 ? Math.round(discountedSubtotal * TAX_RATE) : 0;
  const delivery = cart.length > 0 ? DELIVERY_FEE : 0;
  const total = discountedSubtotal + tax + delivery;

  // Cache calculations for checkout.js
  sessionStorage.setItem(
    "veloura_order_pricing",
    JSON.stringify({
      subtotal,
      discount,
      tax,
      delivery,
      total,
      promoCode: appliedPromo ? appliedPromo.code : null
    })
  );

  const itemsCountEl = document.querySelector("#summary-items-count");
  const subtotalEl = document.querySelector("#summary-subtotal");
  const discountRow = document.querySelector("#summary-discount-row");
  const discountEl = document.querySelector("#summary-discount");
  const taxEl = document.querySelector("#summary-tax");
  const deliveryEl = document.querySelector("#summary-delivery");
  const totalEl = document.querySelector("#summary-total");
  const checkoutBtn = document.querySelector("#go-to-checkout");

  if (itemsCountEl) itemsCountEl.textContent = `(${totalItemsCount} ${totalItemsCount === 1 ? "item" : "items"})`;
  if (subtotalEl) subtotalEl.textContent = `Rs ${subtotal.toLocaleString()}`;

  if (discountRow && discountEl) {
    if (discount > 0) {
      discountRow.style.display = "flex";
      discountEl.textContent = `-Rs ${discount.toLocaleString()}`;
    } else {
      discountRow.style.display = "none";
    }
  }

  if (taxEl) taxEl.textContent = `Rs ${tax.toLocaleString()}`;
  if (deliveryEl) deliveryEl.textContent = `Rs ${delivery.toLocaleString()}`;
  if (totalEl) totalEl.textContent = `Rs ${total.toLocaleString()}`;

  if (checkoutBtn) {
    if (cart.length === 0) {
      checkoutBtn.classList.add("btn-disabled");
    } else {
      checkoutBtn.classList.remove("btn-disabled");
    }
  }
}
