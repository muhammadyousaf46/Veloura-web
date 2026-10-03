// ==========================================================================
// VELOURA — Checkout Logic & Live Order Placement
// Handles validation, pickup/delivery toggle, WhatsApp notification modal,
// and redirects to Dynamic Order Tracker.
// ==========================================================================

const DEFAULT_DELIVERY_FEE = 250;
const TAX_PERCENT = 0.05;

let orderType = "delivery";
let paymentMethod = "cod";
let appliedDiscount = 0;
let promoCode = null;

document.addEventListener("DOMContentLoaded", () => {
  initCheckoutPage();
  setupOrderTypeToggle();
  setupPaymentMethodSelector();
  setupFormSubmission();
});

function initCheckoutPage() {
  const cart = getCart();
  const emptyState = document.querySelector("#checkout-empty");
  const checkoutContent = document.querySelector("#checkout-content");

  if (!cart || cart.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    if (checkoutContent) checkoutContent.style.display = "none";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (checkoutContent) checkoutContent.style.display = "grid";

  // Pre-fill user profile if logged in or registered role active
  const profile = window.VelouraData?.getUserProfile();
  if (profile) {
    const nameInput = document.querySelector("#full_name");
    const phoneInput = document.querySelector("#phone");
    const emailInput = document.querySelector("#email");
    const addressInput = document.querySelector("#address");

    if (nameInput && !nameInput.value) nameInput.value = profile.name || "";
    if (phoneInput && !phoneInput.value) phoneInput.value = profile.phone || "";
    if (emailInput && !emailInput.value) emailInput.value = profile.email || "";
    if (addressInput && !addressInput.value && profile.addresses?.length) {
      addressInput.value = profile.addresses[0].address || "";
    }
  }

  // Load promo discount from session storage if applied in cart
  try {
    const savedPricing = sessionStorage.getItem("veloura_order_pricing");
    if (savedPricing) {
      const parsed = JSON.parse(savedPricing);
      appliedDiscount = parsed.discount || 0;
      promoCode = parsed.promoCode || null;
    }
  } catch (e) {
    appliedDiscount = 0;
  }

  renderCheckoutItems(cart);
  calculateCheckoutTotals();
}

function renderCheckoutItems(cart) {
  const container = document.querySelector("#checkout-items");
  if (!container) return;

  container.innerHTML = cart
    .map(
      (item) => `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.86rem;">
        <div style="min-width:0;flex:1;">
          <span style="font-weight:600;color:var(--text-primary);display:block;line-height:1.25;">${item.name}</span>
          <span style="color:var(--text-muted);font-size:0.75rem;">&times; ${item.quantity}</span>
        </div>
        <span style="font-weight:700;color:var(--gold-primary);white-space:nowrap;flex-shrink:0;">Rs ${(item.price * item.quantity).toLocaleString()}</span>
      </div>
    `
    )
    .join("");
}

function setupOrderTypeToggle() {
  const deliveryBtn = document.querySelector("#type-delivery-btn");
  const pickupBtn = document.querySelector("#type-pickup-btn");
  const addressField = document.querySelector("#address-field");
  const cityField = document.querySelector("#city-field");

  if (!deliveryBtn || !pickupBtn) return;

  deliveryBtn.addEventListener("click", () => {
    orderType = "delivery";
    deliveryBtn.classList.add("active");
    pickupBtn.classList.remove("active");
    if (addressField) addressField.style.display = "flex";
    if (cityField) cityField.style.display = "flex";
    calculateCheckoutTotals();
  });

  pickupBtn.addEventListener("click", () => {
    orderType = "pickup";
    pickupBtn.classList.add("active");
    deliveryBtn.classList.remove("active");
    if (addressField) addressField.style.display = "none";
    if (cityField) cityField.style.display = "none";
    calculateCheckoutTotals();
  });
}

function setupPaymentMethodSelector() {
  const options = document.querySelectorAll(".payment-option");
  options.forEach((opt) => {
    opt.addEventListener("click", () => {
      options.forEach((o) => o.classList.remove("selected"));
      opt.classList.add("selected");
      const radio = opt.querySelector("input[type='radio']");
      if (radio) radio.checked = true;
      paymentMethod = opt.dataset.method || "cod";
    });
  });
}

function calculateCheckoutTotals() {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const deliveryFee = orderType === "delivery" ? DEFAULT_DELIVERY_FEE : 0;
  const discountedSubtotal = Math.max(0, subtotal - appliedDiscount);
  const tax = Math.round(discountedSubtotal * TAX_PERCENT);
  const total = discountedSubtotal + tax + deliveryFee;
  const loyaltyPointsEarn = Math.floor(total / 100) * 10;

  const subtotalEl = document.querySelector("#checkout-subtotal");
  const discountRow = document.querySelector("#checkout-discount-row");
  const discountEl = document.querySelector("#checkout-discount");
  const taxEl = document.querySelector("#checkout-tax");
  const deliveryEl = document.querySelector("#checkout-delivery");
  const totalEl = document.querySelector("#checkout-total");
  const pointsEl = document.querySelector("#checkout-loyalty-earn");

  if (subtotalEl) subtotalEl.textContent = `Rs ${subtotal.toLocaleString()}`;

  if (discountRow && discountEl) {
    if (appliedDiscount > 0) {
      discountRow.style.display = "flex";
      discountEl.textContent = `-Rs ${appliedDiscount.toLocaleString()}`;
      const label = discountRow.querySelector(".label-text");
      if (label && promoCode) label.textContent = `Promo Discount (${promoCode}):`;
    } else {
      discountRow.style.display = "none";
    }
  }

  if (taxEl) taxEl.textContent = `Rs ${tax.toLocaleString()}`;
  if (deliveryEl) deliveryEl.textContent = `Rs ${deliveryFee.toLocaleString()}`;
  if (totalEl) totalEl.textContent = `Rs ${total.toLocaleString()}`;
  if (pointsEl) pointsEl.textContent = `${loyaltyPointsEarn}`;

  return { subtotal, appliedDiscount, tax, deliveryFee, total, loyaltyPointsEarn };
}

function setupFormSubmission() {
  const form = document.querySelector("#checkout-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Reset errors
    document.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));

    const fullName = form.full_name?.value.trim() || "";
    const phone = form.phone?.value.trim() || "";
    const email = form.email?.value.trim() || "";
    const address = form.address?.value.trim() || "";
    const city = form.city?.value.trim() || "Gujrat";
    const notes = form.notes?.value.trim() || "";

    let hasError = false;

    if (!fullName) {
      showError("full_name", "Please enter your full name.");
      hasError = true;
    }

    if (!phone || phone.length < 10) {
      showError("phone", "Please enter a valid phone number (e.g. +92 300 0000000).");
      hasError = true;
    }

    if (!email || !email.includes("@")) {
      showError("email", "Please enter a valid email address.");
      hasError = true;
    }

    if (orderType === "delivery" && !address) {
      showError("address", "Please provide a delivery address in Gujrat.");
      hasError = true;
    }

    if (hasError) {
      window.scrollTo({ top: 300, behavior: "smooth" });
      return;
    }

    const submitBtn = document.querySelector("#submit-order-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="loader" style="width:16px;height:16px;margin-right:8px;"></span> Processing Order...`;
    }

    const totals = calculateCheckoutTotals();
    const cart = getCart();

    const orderData = {
      customer_name: fullName,
      phone: phone,
      email: email,
      address: orderType === "delivery" ? address : "Restaurant Pickup - Veloura Ramtali Gujrat",
      city: city,
      order_type: orderType,
      payment_method: paymentMethod,
      subtotal: totals.subtotal,
      discount: totals.appliedDiscount,
      tax: totals.tax,
      delivery_fee: totals.deliveryFee,
      total: totals.total,
      notes: notes,
      items: cart
    };

    // Create in data store
    const createdOrder = window.VelouraData?.createOrder
      ? window.VelouraData.createOrder(orderData)
      : { id: `VEL-${Math.floor(10000 + Math.random() * 90000)}`, ...orderData };

    // Clear cart & session promo
    localStorage.setItem("veloura_cart", "[]");
    sessionStorage.removeItem("veloura_applied_promo");
    sessionStorage.removeItem("veloura_order_pricing");
    if (typeof initCartBadge === "function") initCartBadge();

    // Save active order ID for live tracking
    sessionStorage.setItem("veloura_active_order_id", createdOrder.id);

    // Show Mock WhatsApp & Confirmation Modal
    showOrderConfirmationModal(createdOrder);
  });
}

function showError(fieldId, message) {
  const errEl = document.querySelector(`#${fieldId}-error`);
  if (errEl) errEl.textContent = message;
}

function showOrderConfirmationModal(order) {
  const modal = document.querySelector("#order-notification-modal");
  const orderIdEl = document.querySelector("#modal-order-id");
  const trackBtn = document.querySelector("#modal-track-order-btn");
  const bubble = document.querySelector("#whatsapp-message-bubble");

  if (!modal) return;

  if (orderIdEl) orderIdEl.textContent = `#${order.id}`;
  if (trackBtn) trackBtn.href = `order-tracker.html?id=${order.id}`;

  if (bubble) {
    const itemsSummary = (order.items || []).map((i) => `• ${i.name} (${i.quantity}x)`).join("<br>");
    bubble.innerHTML = `
      <p style="margin-bottom:0.4rem;"><strong>✨ VELOURA LUXURY DINING ✨</strong></p>
      <p style="margin-bottom:0.4rem;">Hi <strong>${order.customer_name}</strong>, your order has been received by our culinary kitchen!</p>
      <p style="margin-bottom:0.4rem;font-size:0.8rem;background:rgba(0,0,0,0.2);padding:0.4rem;border-radius:4px;">
        <strong>Order:</strong> #${order.id}<br>
        <strong>Items:</strong><br>${itemsSummary}<br>
        <strong>Total Amount:</strong> Rs ${order.total.toLocaleString()}<br>
        <strong>Payment:</strong> ${order.payment_method.toUpperCase()} (${order.order_type === "delivery" ? "Delivery" : "Pickup"})
      </p>
      <p style="font-size:0.75rem;margin-top:0.4rem;">Estimated Time: <strong>35-45 minutes</strong>.<br>For special requests, reply to this concierge or call <strong>+92 300 0000000</strong>.</p>
      <div style="text-align:right;font-size:0.65rem;color:#8696a0;margin-top:0.25rem;">Just now &bull; &#10003;&#10003;</div>
    `;
  }

  modal.classList.add("show");
  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove("show");
  };
  const closeBtn = modal.querySelector(".modal-close-icon");
  if (closeBtn) {
    closeBtn.onclick = () => modal.classList.remove("show");
  }
  if (window.lucide) window.lucide.createIcons();
}
