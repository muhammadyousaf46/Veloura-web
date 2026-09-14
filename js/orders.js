// ==========================================================================
// VELOURA — Admin: Order Management
// ==========================================================================

let ADMIN_ORDERS = [];
const ORDER_STATUSES = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "cod"];

document.addEventListener("admin-authorized", initOrdersPage);

async function initOrdersPage() {
  await loadOrders();

  document.querySelector("#order-search").addEventListener("input", renderOrdersTable);
  document.querySelector("#order-status-filter").addEventListener("change", renderOrdersTable);
}

async function loadOrders() {
  const tbody = document.querySelector("#orders-table-body");
  tbody.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="8">Failed to load orders.</td></tr>`;
    return;
  }

  ADMIN_ORDERS = data || [];
  renderOrdersTable();
}

function renderOrdersTable() {
  const tbody = document.querySelector("#orders-table-body");
  const search = document.querySelector("#order-search").value.trim().toLowerCase();
  const statusFilter = document.querySelector("#order-status-filter").value;

  let orders = [...ADMIN_ORDERS];
  if (search) {
    orders = orders.filter(
      (o) => o.customer_name.toLowerCase().includes(search) || o.id.toLowerCase().includes(search)
    );
  }
  if (statusFilter !== "all") {
    orders = orders.filter((o) => o.order_status === statusFilter);
  }

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8">No orders match your search/filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders
    .map(
      (o) => `
    <tr>
      <td>#${o.id.slice(0, 8).toUpperCase()}</td>
      <td>${o.customer_name}<br><span style="color:var(--stone);font-size:0.8rem;">${o.phone}</span></td>
      <td style="text-transform:capitalize;">${o.order_type}</td>
      <td>
        ${paymentLabel(o.payment_method)}<br>
        <select data-payment-status="${o.id}" style="margin-top:4px;">
          ${PAYMENT_STATUSES.map((s) => `<option value="${s}" ${s === o.payment_status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </td>
      <td>Rs ${Number(o.total).toLocaleString()}</td>
      <td>
        <select data-order-status="${o.id}">
          ${ORDER_STATUSES.map((s) => `<option value="${s}" ${s === o.order_status ? "selected" : ""}>${s.replace(/_/g, " ")}</option>`).join("")}
        </select>
      </td>
      <td>${new Date(o.created_at).toLocaleDateString()}</td>
      <td class="admin-actions"><button data-view="${o.id}">View</button></td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-order-status]").forEach((sel) =>
    sel.addEventListener("change", () => updateOrderField(sel.dataset.orderStatus, "order_status", sel.value))
  );
  tbody.querySelectorAll("[data-payment-status]").forEach((sel) =>
    sel.addEventListener("change", () => updateOrderField(sel.dataset.paymentStatus, "payment_status", sel.value))
  );
  tbody.querySelectorAll("[data-view]").forEach((btn) =>
    btn.addEventListener("click", () => viewOrderDetails(btn.dataset.view))
  );
}

async function updateOrderField(orderId, field, value) {
  try {
    const { error } = await supabase.from("orders").update({ [field]: value }).eq("id", orderId);
    if (error) throw error;
    showToast("Order updated");
    const order = ADMIN_ORDERS.find((o) => o.id === orderId);
    if (order) order[field] = value;
  } catch (err) {
    console.error(err);
    showToast(friendlyError(err), "error");
  }
}

async function viewOrderDetails(orderId) {
  const { data: items, error } = await supabase.from("order_items").select("*").eq("order_id", orderId);
  if (error) {
    showToast("Failed to load order items", "error");
    return;
  }
  const order = ADMIN_ORDERS.find((o) => o.id === orderId);
  const lines = items.map((i) => `${i.item_name} x${i.quantity} — Rs ${Number(i.subtotal).toLocaleString()}`).join("\n");
  alert(`Order #${orderId.slice(0, 8).toUpperCase()}\nCustomer: ${order.customer_name}\nAddress: ${order.address || "Pickup"}\nNotes: ${order.notes || "—"}\n\nItems:\n${lines}`);
}

function paymentLabel(method) {
  return { cod: "Cash on Delivery", jazzcash: "JazzCash", easypaisa: "Easypaisa" }[method] || method;
}
