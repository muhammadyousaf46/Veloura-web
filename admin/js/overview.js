// ==========================================================================
// VELOURA — Admin: Overview Statistics Controller
// ==========================================================================

document.addEventListener("admin-authorized", loadOverviewStats);
document.addEventListener("DOMContentLoaded", () => {
  if (window.VelouraData?.getCurrentRole() === "admin") {
    loadOverviewStats();
  }
});

function loadOverviewStats() {
  const grid = document.querySelector("#stat-grid");
  if (!grid) return;

  const orders = window.VelouraData?.getOrders ? window.VelouraData.getOrders() : [];
  const reservations = window.VelouraData?.getReservations ? window.VelouraData.getReservations() : [];
  const menuItems = window.VelouraData?.getMenuItems ? window.VelouraData.getMenuItems() : [];

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pendingOrders = orders.filter((o) => (o.order_status || "").toLowerCase() === "pending").length;
  const pendingReservations = reservations.filter((r) => (r.status || "").toLowerCase() === "pending").length;
  const activeDishes = menuItems.filter((i) => i.is_available !== false).length;

  const values = [
    totalOrders,
    "12 Today",
    activeDishes + " Active",
    `Rs ${totalRevenue.toLocaleString()}`,
    pendingOrders,
    pendingReservations
  ];

  grid.querySelectorAll(".stat-value").forEach((el, i) => {
    el.classList.remove("skeleton");
    el.style.height = "";
    el.style.width = "";
    el.textContent = values[i] !== undefined ? values[i] : "0";
  });
}
