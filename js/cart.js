// ==========================================================================
// VELOURA — Cart page
// ==========================================================================

const DELIVERY_FEE = 250;

document.addEventListener("DOMContentLoaded", renderCartPage);

function renderCartPage() {
  const list = document.querySelector("#cart-list");
  const emptyState = document.querySelector("#cart-empty");
  if (!list) return;

  const cart = getCart();

  if (cart.length === 0) {
    list.innerHTML = "";
    emptyState.style.display = "block";
    updateSummary(cart);
    return;
  }

  emptyState.style.display = "none";
  list.innerHTML = cart.map(cartLineTemplate).join("");
  attachCartLineHandlers();
  updateSummary(cart);
}

function cartLineTemplate(item) {
  const image = item.image
    ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;" />`
    : "";
  return `
    <div class="cart-line" data-id="${item.id}">
      <div class="cart-line-thumb">${image}</div>
      <div>
        <p class="cart-line-name">${item.name}</p>
        <p class="cart-line-price">Rs ${item.price.toLocaleString()} each</p>
      </div>
      <div class="qty-control">
        <button class="qty-minus" aria-label="Decrease quantity">&minus;</button>
        <span>${item.quantity}</span>
        <button class="qty-plus" aria-label="Increase quantity">+</button>
      </div>
      <div style="text-align:right;">
        <p class="dish-price">Rs ${(item.price * item.quantity).toLocaleString()}</p>
        <button class="remove-line" data-id="${item.id}">Remove</button>
      </div>
    </div>`;
}

function attachCartLineHandlers() {
  document.querySelectorAll(".cart-line").forEach((line) => {
    const id = line.dataset.id;
    line.querySelector(".qty-plus").addEventListener("click", () => changeQuantity(id, 1));
    line.querySelector(".qty-minus").addEventListener("click", () => changeQuantity(id, -1));
    line.querySelector(".remove-line").addEventListener("click", () => removeFromCart(id));
  });

  const clearBtn = document.querySelector("#clear-cart");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      localStorage.setItem("veloura_cart", "[]");
      renderCartPage();
      initCartBadge();
    });
  }
}

function changeQuantity(id, delta) {
  const cart = getCart();
  const item = cart.find((c) => c.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    const filtered = cart.filter((c) => c.id !== id);
    localStorage.setItem("veloura_cart", JSON.stringify(filtered));
  } else {
    localStorage.setItem("veloura_cart", JSON.stringify(cart));
  }
  renderCartPage();
  initCartBadge();
}

function removeFromCart(id) {
  const cart = getCart().filter((c) => c.id !== id);
  localStorage.setItem("veloura_cart", JSON.stringify(cart));
  renderCartPage();
  initCartBadge();
}

function updateSummary(cart) {
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const delivery = cart.length > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + delivery;

  const subtotalEl = document.querySelector("#summary-subtotal");
  const deliveryEl = document.querySelector("#summary-delivery");
  const totalEl = document.querySelector("#summary-total");
  const checkoutBtn = document.querySelector("#go-to-checkout");

  if (subtotalEl) subtotalEl.textContent = `Rs ${subtotal.toLocaleString()}`;
  if (deliveryEl) deliveryEl.textContent = `Rs ${delivery.toLocaleString()}`;
  if (totalEl) totalEl.textContent = `Rs ${total.toLocaleString()}`;
  if (checkoutBtn) checkoutBtn.classList.toggle("btn-disabled", cart.length === 0);
}
