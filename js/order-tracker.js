// ==========================================================================
// VELOURA — Dynamic Order Tracker Engine
// Renders live status progression, countdown ETA, and updates from storage/admin.
// ==========================================================================

let activeOrder = null;
let currentStepIndex = 1;

const STAGES = [
  {
    key: "pending",
    title: "Order Received & Verified",
    desc: "Your order ticket has been transmitted to our head chef. Artisanal ingredients are being prepped in our Ramtali kitchen.",
    eta: "38 mins",
    progress: "15%"
  },
  {
    key: "preparing",
    title: "Master Chef Cooking",
    desc: "Your dishes are being hand-crafted over binchotan charcoals with fine seasoning and master plating.",
    eta: "24 mins",
    progress: "50%"
  },
  {
    key: "out_for_delivery",
    title: "Courier En Route",
    desc: "Your gourmet packaging has been entrusted to our temperature-controlled delivery rider heading towards your location in Gujrat.",
    eta: "10 mins",
    progress: "80%"
  },
  {
    key: "delivered",
    title: "Delivered & Ready to Savor",
    desc: "Your order has arrived! We wish you a magnificent dining experience. Please let us know your feedback.",
    eta: "Arrived",
    progress: "100%"
  }
];

document.addEventListener("DOMContentLoaded", () => {
  loadActiveOrder();

  // Listen to cross-tab updates (e.g. from Admin order status toggle)
  window.addEventListener("veloura-order-updated", (e) => {
    if (activeOrder && e.detail.orderId === activeOrder.id) {
      updateTrackerUI(e.detail.newStatus);
    }
  });
});

function loadActiveOrder() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramOrderId = urlParams.get("id");
  const storedOrderId = sessionStorage.getItem("veloura_active_order_id");
  const targetId = paramOrderId || storedOrderId;

  const orders = window.VelouraData?.getOrders ? window.VelouraData.getOrders() : [];

  if (targetId) {
    activeOrder = orders.find((o) => o.id === targetId);
  }

  // Fallback to most recent order if not matched
  if (!activeOrder && orders.length > 0) {
    activeOrder = orders[0];
  }

  if (!activeOrder) {
    // Demo fallback order
    activeOrder = {
      id: "VEL-94218",
      customer_name: "Valued Patron",
      phone: "+92 300 0000000",
      address: "House 14, Model Town, Gujrat",
      order_status: "preparing",
      payment_method: "Cash on Delivery",
      total: 6850,
      items: [{ name: "Prime Wagyu Ribeye Steak (A5)", quantity: 1, price: 6850 }]
    };
  }

  renderOrderDetails(activeOrder);
  updateTrackerUI(activeOrder.order_status || "pending");
}

function renderOrderDetails(order) {
  const orderIdEl = document.querySelector("#track-order-id");
  const recipientEl = document.querySelector("#tracker-recipient");
  const addressEl = document.querySelector("#tracker-address");
  const paymentEl = document.querySelector("#tracker-payment");
  const totalEl = document.querySelector("#tracker-total");
  const itemsContainer = document.querySelector("#tracker-items-list");

  if (orderIdEl) orderIdEl.textContent = `Order #${order.id}`;
  if (recipientEl) recipientEl.textContent = `${order.customer_name} (${order.phone})`;
  if (addressEl) addressEl.textContent = order.address || "Gujrat, Punjab";
  if (paymentEl) paymentEl.textContent = (order.payment_method || "COD").toUpperCase();
  if (totalEl) totalEl.textContent = `Rs ${Number(order.total || 0).toLocaleString()}`;

  if (itemsContainer && order.items) {
    itemsContainer.innerHTML = order.items
      .map(
        (i) => `
        <div style="display:flex;justify-content:space-between;padding:0.4rem 0;font-size:0.85rem;color:var(--text-cream);">
          <span>${i.name} &times; ${i.quantity}</span>
          <span style="color:var(--gold-primary);font-weight:700;">Rs ${(i.price * i.quantity).toLocaleString()}</span>
        </div>
      `
      )
      .join("");
  }
}

function updateTrackerUI(statusKey) {
  const normKey = (statusKey || "pending").toLowerCase();
  let stageIdx = STAGES.findIndex((s) => s.key === normKey);
  if (stageIdx === -1) {
    // Map common Supabase equivalents
    if (normKey === "confirmed") stageIdx = 0;
    else if (normKey === "ready") stageIdx = 1;
    else stageIdx = 0;
  }

  const currentStage = STAGES[stageIdx];

  // Update progress line
  const progressFill = document.querySelector("#stepper-progress-fill");
  if (progressFill) progressFill.style.width = currentStage.progress;

  // Update ETA & Status text
  const etaEl = document.querySelector("#track-eta");
  const statusPill = document.querySelector("#track-status-pill");
  const titleEl = document.querySelector("#status-title");
  const descEl = document.querySelector("#status-desc");

  if (etaEl) etaEl.textContent = currentStage.eta;
  if (statusPill) statusPill.textContent = currentStage.title;
  if (titleEl) titleEl.textContent = currentStage.title;
  if (descEl) descEl.textContent = currentStage.desc;

  // Update stepper nodes
  const steps = ["step-pending", "step-preparing", "step-out_for_delivery", "step-delivered"];
  steps.forEach((stepId, index) => {
    const el = document.querySelector(`#${stepId}`);
    if (!el) return;

    el.classList.remove("completed", "active");
    if (index < stageIdx) {
      el.classList.add("completed");
    } else if (index === stageIdx) {
      el.classList.add("active");
    }
  });

  if (window.lucide) window.lucide.createIcons();
}

// Global simulation function
window.simulateOrderStatus = function (statusKey) {
  if (activeOrder && window.VelouraData?.updateOrderStatus) {
    window.VelouraData.updateOrderStatus(activeOrder.id, statusKey);
  }
  updateTrackerUI(statusKey);
  if (window.showToast) {
    window.showToast(`Order status updated to: ${statusKey.replace(/_/g, " ").toUpperCase()}`);
  }
};
