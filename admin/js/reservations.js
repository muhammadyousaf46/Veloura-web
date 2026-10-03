// ==========================================================================
// VELOURA — Admin: Reservation Slots & Booking Management
// ==========================================================================

document.addEventListener("admin-authorized", loadReservations);
document.addEventListener("DOMContentLoaded", () => {
  if (window.VelouraData?.getCurrentRole() === "admin") {
    loadReservations();
  }
});

function loadReservations() {
  const tbody = document.querySelector("#reservations-table-body");
  if (!tbody) return;

  const data = window.VelouraData?.getReservations ? window.VelouraData.getReservations() : [];

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;">No reservation bookings currently recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((r) => {
      const isApproved = r.status === "approved";
      const statusColor = isApproved ? "#34d399" : r.status === "rejected" ? "#f87171" : "#f59e0b";

      return `
    <tr>
      <td><strong>${r.name}</strong></td>
      <td><span style="color:var(--text-muted);">${r.phone}</span></td>
      <td style="font-weight:700;">${r.reservation_date}</td>
      <td style="color:var(--gold-primary);font-weight:700;">${r.reservation_time}</td>
      <td><strong>${r.guests} Guests</strong></td>
      <td style="font-size:0.8rem;color:var(--text-dim);max-width:180px;white-space:normal;">
        ${r.special_request || "Standard Table"}
      </td>
      <td>
        <span style="color:${statusColor};border:1px solid ${statusColor};padding:2px 8px;border-radius:999px;font-size:0.75rem;font-weight:800;text-transform:uppercase;">
          ${r.status}
        </span>
      </td>
      <td>
        ${r.status !== "approved" ? `<button class="btn btn-outline" style="font-size:0.68rem;padding:0.25rem 0.5rem;margin-right:4px;" onclick="updateResStatus('${r.id}', 'approved')">Approve</button>` : ""}
        ${r.status !== "rejected" ? `<button class="btn btn-dark" style="font-size:0.68rem;padding:0.25rem 0.5rem;margin-right:4px;color:#f87171;border-color:#ef4444;" onclick="updateResStatus('${r.id}', 'rejected')">Reject</button>` : ""}
        ${r.status !== "completed" ? `<button class="btn btn-primary" style="font-size:0.68rem;padding:0.25rem 0.5rem;" onclick="updateResStatus('${r.id}', 'completed')">Complete</button>` : ""}
      </td>
    </tr>`;
    })
    .join("");
}

window.updateResStatus = function (id, status) {
  if (window.VelouraData?.updateReservationStatus) {
    window.VelouraData.updateReservationStatus(id, status);
  }
  loadReservations();
  if (window.showToast) {
    window.showToast(`Reservation #${id} marked as ${status.toUpperCase()}`);
  }
};
