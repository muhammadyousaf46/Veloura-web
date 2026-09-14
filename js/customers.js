// ==========================================================================
// VELOURA — Admin: Customer Management
// ==========================================================================

document.addEventListener("admin-authorized", loadCustomers);

async function loadCustomers() {
  const tbody = document.querySelector("#customers-table-body");
  tbody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

  try {
    const [{ data: profiles, error: profErr }, { data: orders, error: orderErr }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, phone, created_at").eq("role", "customer"),
      supabase.from("orders").select("user_id"),
    ]);

    if (profErr) throw profErr;
    if (orderErr) throw orderErr;

    const orderCounts = {};
    (orders || []).forEach((o) => {
      if (!o.user_id) return;
      orderCounts[o.user_id] = (orderCounts[o.user_id] || 0) + 1;
    });

    if (!profiles || profiles.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No registered customers yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = profiles
      .map(
        (p) => `
      <tr>
        <td>${p.full_name || "—"}</td>
        <td>${p.email || "—"}</td>
        <td>${p.phone || "—"}</td>
        <td>${orderCounts[p.id] || 0}</td>
        <td>${new Date(p.created_at).toLocaleDateString()}</td>
      </tr>`
      )
      .join("");
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5">Failed to load customers.</td></tr>`;
  }
}
