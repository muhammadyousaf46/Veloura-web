// ==========================================================================
// VELOURA — Admin: Live Order Management Controller
// ==========================================================================

let ADMIN_ORDERS = [];
const ORDER_STATUSES = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "cod"];

document.addEventListener("admin-authorized", initOrdersPage);
document.addEventListener("DOMContentLoaded", () => {
  if (window.VelouraData?.getCurrentRole() === "admin") {
    initOrdersPage();
  }
});

async function initOrdersPage() {
  loadOrders();

  document.querySelector("#order-search")?.addEventListener("input", renderOrdersTable);
  document.querySelector("#order-status-filter")?.addEventListener("change", renderOrdersTable);
}

function loadOrders() {
  ADMIN_ORDERS = window.VelouraData?.getOrders ? window.VelouraData.getOrders() : [];
  renderOrdersTable();
}

function renderOrdersTable() {
  const tbody = document.querySelector("#orders-table-body");
  if (!tbody) return;

  const search = document.querySelector("#order-search")?.value.trim().toLowerCase() || "";
  const statusFilter = document.querySelector("#order-status-filter")?.value || "all";

  let orders = [...ADMIN_ORDERS];
  if (search) {
    orders = orders.filter(
      (o) => (o.customer_name || "").toLowerCase().includes(search) || (o.id || "").toLowerCase().includes(search)
    );
  }
  if (statusFilter !== "all") {
    orders = orders.filter((o) => o.order_status === statusFilter);
  }

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;">No orders match your filter criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders
    .map((o) => {
      const isDelivered = (o.order_status || "").toLowerCase() === "delivered";
      const statusColor = isDelivered ? "#34d399" : "#f59e0b";
      const itemsCount = (o.items || []).length;

      return `
      <tr>
        <td>
          <strong style="color:var(--gold-primary);">#${o.id}</strong>
        </td>
        <td>
          <strong>${o.customer_name}</strong><br>
          <span style="font-size:0.75rem;color:var(--text-muted);">${o.phone || ""}</span>
        </td>
        <td style="text-transform:uppercase;font-size:0.8rem;font-weight:700;">
          ${o.order_type || "Delivery"}
        </td>
        <td>
          <span style="font-weight:600;font-size:0.85rem;">${(o.payment_method || "COD").toUpperCase()}</span>
        </td>
        <td style="font-weight:800;color:var(--gold-primary);">
          Rs ${Number(o.total || 0).toLocaleString()}
        </td>
        <td>
          <!-- Live Status Dropdown -->
          <select 
            data-order-status="${o.id}" 
            style="background:var(--bg-card);border:1px solid ${statusColor};color:${statusColor};padding:0.35rem 0.65rem;border-radius:var(--radius-sm);font-weight:700;font-size:0.78rem;"
          >
            ${ORDER_STATUSES.map(
              (s) =>
                `<option value="${s}" ${s === (o.order_status || "pending") ? "selected" : ""}>${s.replace(/_/g, " ").toUpperCase()}</option>`
            ).join("")}
          </select>
        </td>
        <td style="font-size:0.8rem;color:var(--text-dim);">
          ${new Date(o.created_at || Date.now()).toLocaleDateString()}
        </td>
        <td>
          <button class="btn btn-outline" style="font-size:0.7rem;padding:0.3rem 0.75rem;" onclick="viewOrderDetails('${o.id}')">
            View Items (${itemsCount})
          </button>
        </td>
      </tr>`;
    })
    .join("");

  tbody.querySelectorAll("[data-order-status]").forEach((sel) =>
    sel.addEventListener("change", () => updateOrderStatusLive(sel.dataset.orderStatus, sel.value))
  );
}

function updateOrderStatusLive(orderId, newStatus) {
  if (window.VelouraData?.updateOrderStatus) {
    window.VelouraData.updateOrderStatus(orderId, newStatus);
  }
  const order = ADMIN_ORDERS.find((o) => o.id === orderId);
  if (order) order.order_status = newStatus;
  renderOrdersTable();

  if (window.showToast) {
    window.showToast(`Order #${orderId} updated to: ${newStatus.replace(/_/g, " ").toUpperCase()}`);
  }
}

window.viewOrderDetails = function (orderId) {
  const order = ADMIN_ORDERS.find((o) => o.id === orderId);
  if (!order) return;

  const itemsList = (order.items || [])
    .map((i) => `• ${i.name} (Qty: ${i.quantity}) — Rs ${(i.price * i.quantity).toLocaleString()}`)
    .join("\n");

  alert(
    `Order Details for #${order.id}:\n\n` +
      `Customer: ${order.customer_name}\n` +
      `Phone: ${order.phone}\n` +
      `Address: ${order.address || "Ramtali Gujrat"}\n` +
      `Total: Rs ${Number(order.total).toLocaleString()}\n` +
      `Payment: ${(order.payment_method || "").toUpperCase()}\n` +
      `Status: ${(order.order_status || "").toUpperCase()}\n\n` +
      `Items:\n${itemsList}`
  );
};
