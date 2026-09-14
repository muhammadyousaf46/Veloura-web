// ==========================================================================
// VELOURA — Admin: Overview stats
// ==========================================================================

document.addEventListener("admin-authorized", loadOverviewStats);

async function loadOverviewStats() {
  const grid = document.querySelector("#stat-grid");
  if (!grid) return;

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [ordersRes, todayOrdersRes, customersRes, pendingOrdersRes, pendingResRes] = await Promise.all([
      supabase.from("orders").select("total", { count: "exact" }),
      supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("order_status", "pending"),
      supabase.from("reservations").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);

    const totalOrders = ordersRes.count ?? 0;
    const totalRevenue = (ordersRes.data || []).reduce((sum, o) => sum + Number(o.total || 0), 0);
    const todayOrders = todayOrdersRes.count ?? 0;
    const totalCustomers = customersRes.count ?? 0;
    const pendingOrders = pendingOrdersRes.count ?? 0;
    const pendingReservations = pendingResRes.count ?? 0;

    const values = [totalOrders, todayOrders, totalCustomers, `Rs ${totalRevenue.toLocaleString()}`, pendingOrders, pendingReservations];
    grid.querySelectorAll(".stat-value").forEach((el, i) => {
      el.classList.remove("skeleton");
      el.style.height = "";
      el.style.width = "";
      el.textContent = values[i];
    });
  } catch (err) {
    console.error("Failed to load stats:", err);
    grid.innerHTML = `<div class="empty-state">Failed to load dashboard statistics.</div>`;
  }
}
