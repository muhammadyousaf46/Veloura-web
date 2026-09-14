// ==========================================================================
// VELOURA — Checkout page
// ==========================================================================

const CHECKOUT_DELIVERY_FEE = 250;
let selectedOrderType = "delivery";
let selectedPayment = "cod";

document.addEventListener("DOMContentLoaded", initCheckout);

async function initCheckout() {
  const form = document.querySelector("#checkout-form");
  if (!form) return;

  const cart = getCart();
  if (cart.length === 0) {
    document.querySelector("#checkout-content").style.display = "none";
    document.querySelector("#checkout-empty").style.display = "block";
    return;
  }

  renderOrderReview(cart);
  prefillFromUser();

  document.querySelectorAll(".order-type-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedOrderType = btn.dataset.type;
      document.querySelectorAll(".order-type-toggle button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelector("#address-field").style.display = selectedOrderType === "delivery" ? "flex" : "none";
      renderOrderReview(getCart());
    });
  });

  document.querySelectorAll(".payment-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      selectedPayment = opt.dataset.method;
      document.querySelectorAll(".payment-option").forEach((o) => o.classList.remove("selected"));
      opt.classList.add("selected");
    });
  });

  form.addEventListener("submit", handleOrderSubmit);
}

async function prefillFromUser() {
  const user = await getCurrentUser();
  if (!user) return;
  const profile = await getProfile(user.id);
  if (!profile) return;
  const nameField = document.querySelector("#full_name");
  const phoneField = document.querySelector("#phone");
  const emailField = document.querySelector("#email");
  const addressField = document.querySelector("#address");
  if (nameField && profile.full_name) nameField.value = profile.full_name;
  if (phoneField && profile.phone) phoneField.value = profile.phone;
  if (emailField && profile.email) emailField.value = profile.email;
  if (addressField && profile.address) addressField.value = profile.address;
}

function renderOrderReview(cart) {
  const list = document.querySelector("#checkout-items");
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const delivery = selectedOrderType === "delivery" ? CHECKOUT_DELIVERY_FEE : 0;
  const total = subtotal + delivery;

  list.innerHTML = cart
    .map(
      (i) => `
      <div class="cart-line" style="grid-template-columns:1fr auto;">
        <span>${i.name} &times; ${i.quantity}</span>
        <span>Rs ${(i.price * i.quantity).toLocaleString()}</span>
      </div>`
    )
    .join("");

  document.querySelector("#checkout-subtotal").textContent = `Rs ${subtotal.toLocaleString()}`;
  document.querySelector("#checkout-delivery").textContent = `Rs ${delivery.toLocaleString()}`;
  document.querySelector("#checkout-total").textContent = `Rs ${total.toLocaleString()}`;
}

async function handleOrderSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector("button[type='submit']");

  const fields = {
    customer_name: form.full_name.value.trim(),
    phone: form.phone.value.trim(),
    email: form.email.value.trim(),
    address: selectedOrderType === "delivery" ? form.address.value.trim() : null,
    city: selectedOrderType === "delivery" ? form.city.value.trim() : null,
    notes: form.notes.value.trim(),
  };

  if (!validateCheckoutFields(fields)) return;

  const cart = getCart();
  if (cart.length === 0) return;

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const delivery = selectedOrderType === "delivery" ? CHECKOUT_DELIVERY_FEE : 0;
  const total = subtotal + delivery;

  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.innerHTML = `<span class="loader"></span>`;

  try {
    const user = await getCurrentUser();

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user ? user.id : null,
        customer_name: fields.customer_name,
        phone: fields.phone,
        address: fields.address,
        city: fields.city,
        order_type: selectedOrderType,
        payment_method: selectedPayment,
        payment_status: selectedPayment === "cod" ? "cod" : "pending",
        subtotal,
        delivery_fee: delivery,
        total,
        notes: fields.notes,
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    const orderItems = cart.map((item) => ({
      order_id: order.id,
      menu_item_id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) throw itemsErr;

    localStorage.setItem("veloura_cart", "[]");
    initCartBadge();
    showOrderConfirmation(order, cart, total);
  } catch (err) {
    console.error("Order placement failed:", err);
    showToast("Failed to place order. Please try again.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

function validateCheckoutFields(fields) {
  if (!fields.customer_name) return alertField("full_name", "Name is required.");
  if (!/^[0-9+\-\s]{7,15}$/.test(fields.phone)) return alertField("phone", "Enter a valid phone number.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return alertField("email", "Enter a valid email.");
  if (selectedOrderType === "delivery" && !fields.address) return alertField("address", "Delivery address is required.");
  if (selectedOrderType === "delivery" && !fields.city) return alertField("city", "City is required.");
  return true;
}

function alertField(name, message) {
  const errorEl = document.querySelector(`#${name}-error`);
  if (errorEl) errorEl.textContent = message;
  document.querySelector(`#${name}`)?.focus();
  return false;
}

function showOrderConfirmation(order, cart, total) {
  document.querySelector("#checkout-content").style.display = "none";
  const confirmation = document.querySelector("#order-confirmation");
  confirmation.style.display = "block";

  document.querySelector("#confirm-order-number").textContent = order.id.slice(0, 8).toUpperCase();
  document.querySelector("#confirm-total").textContent = `Rs ${total.toLocaleString()}`;
  document.querySelector("#confirm-payment").textContent = paymentLabel(selectedPayment);
  document.querySelector("#confirm-status").innerHTML = `<span class="status-pill ${order.payment_status}">${order.payment_status}</span>`;

  document.querySelector("#confirm-items").innerHTML = cart
    .map(
      (i) => `
      <div class="cart-line" style="grid-template-columns:1fr auto;">
        <span>${i.name} &times; ${i.quantity}</span>
        <span>Rs ${(i.price * i.quantity).toLocaleString()}</span>
      </div>`
    )
    .join("");
}

function paymentLabel(method) {
  return { cod: "Cash on Delivery", jazzcash: "JazzCash", easypaisa: "Easypaisa" }[method] || method;
}
