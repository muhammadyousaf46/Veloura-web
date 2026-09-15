// ==========================================================================
// VELOURA — Admin: Reservation Management
// ==========================================================================

document.addEventListener("admin-authorized", loadReservations);

async function loadReservations() {
  const tbody = document.querySelector("#reservations-table-body");
  tbody.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .order("reservation_date", { ascending: true });

  if (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="8">Failed to load reservations.</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8">No reservations yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (r) => `
    <tr>
      <td>${r.name}</td>
      <td>${r.phone}</td>
      <td>${r.reservation_date}</td>
      <td>${r.reservation_time}</td>
      <td>${r.guests}</td>
      <td>${r.special_request || "—"}</td>
      <td><span class="status-pill ${r.status}">${r.status}</span></td>
      <td class="admin-actions">
        ${r.status !== "approved" ? `<button data-action="approved" data-id="${r.id}">Approve</button>` : ""}
        ${r.status !== "rejected" ? `<button data-action="rejected" data-id="${r.id}">Reject</button>` : ""}
        ${r.status !== "completed" ? `<button data-action="completed" data-id="${r.id}">Complete</button>` : ""}
      </td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-action]").forEach((btn) =>
    btn.addEventListener("click", () => updateReservationStatus(btn.dataset.id, btn.dataset.action))
  );
}

async function updateReservationStatus(id, status) {
  try {
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
    if (error) throw error;
    showToast("Reservation updated");
    loadReservations();
  } catch (err) {
    console.error(err);
    showToast(friendlyError(err), "error");
  }
}
