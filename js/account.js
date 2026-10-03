// ==========================================================================
// VELOURA — Patron Account & Loyalty Rewards Logic
// Manages point balances, tier progression, saved addresses, and order history.
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  renderAccountData();
});

function renderAccountData() {
  const profile = window.VelouraData?.getUserProfile
    ? window.VelouraData.getUserProfile()
    : {
        name: "Muhammad Yousaf",
        email: "shahyousaf2004@gmail.com",
        loyaltyPoints: 520,
        tier: "Gold Epicurean",
        addresses: [],
        orderHistory: []
      };

  const pointsValEl = document.querySelector("#user-points-val");
  const greetingEl = document.querySelector("#user-greeting-name");
  const tierEl = document.querySelector("#user-tier-badge");

  if (pointsValEl) pointsValEl.textContent = profile.loyaltyPoints || 0;
  if (greetingEl) greetingEl.textContent = profile.name || "Patron";
  if (tierEl) tierEl.textContent = profile.tier || "Gold Epicurean Member";

  renderAddresses(profile.addresses || []);
  renderOrderHistory();
}

function renderAddresses(addresses) {
  const container = document.querySelector("#addresses-list");
  if (!container) return;

  if (addresses.length === 0) {
    container.innerHTML = `<p style="font-size:0.85rem;color:var(--text-muted);">No saved addresses yet.</p>`;
    return;
  }

  container.innerHTML = addresses
    .map(
      (addr, index) => `
    <div style="background:var(--bg-surface);border:1px solid ${addr.isDefault ? "var(--border-gold)" : "var(--border-subtle)"};border-radius:var(--radius-sm);padding:0.85rem 1rem;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-weight:700;font-size:0.85rem;color:var(--text-primary);display:flex;align-items:center;gap:0.4rem;">
          <span>${addr.label}</span>
          ${addr.isDefault ? `<span style="font-size:0.65rem;background:var(--gold-primary);color:var(--bg-dark);padding:1px 6px;border-radius:999px;font-weight:800;">DEFAULT</span>` : ""}
        </div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.2rem;">${addr.address}</div>
      </div>
      <div>
        ${
          !addr.isDefault
            ? `<button class="btn btn-outline" style="font-size:0.68rem;padding:0.25rem 0.6rem;" onclick="setDefaultAddress(${index})">Set Default</button>`
            : ""
        }
      </div>
    </div>
  `
    )
    .join("");
}

function renderOrderHistory() {
  const container = document.querySelector("#order-history-list");
  if (!container) return;

  const orders = window.VelouraData?.getOrders ? window.VelouraData.getOrders() : [];

  if (orders.length === 0) {
    container.innerHTML = `<p style="font-size:0.85rem;color:var(--text-muted);">No past orders found.</p>`;
    return;
  }

  container.innerHTML = orders
    .map((order) => {
      const isDelivered = (order.order_status || "").toLowerCase() === "delivered";
      const statusColor = isDelivered ? "#34d399" : "#f59e0b";
      const itemsText = (order.items || []).map((i) => `${i.name} (${i.quantity}x)`).join(", ") || "Signature Dining Selection";

      return `
      <div style="background:var(--bg-surface);border:1px solid var(--border-gold);border-radius:var(--radius-sm);padding:1.25rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.6rem;">
          <div>
            <span style="font-family:var(--font-body);font-weight:800;color:var(--gold-primary);font-size:0.95rem;">Order #${order.id}</span>
            <span style="font-size:0.75rem;color:var(--text-dim);margin-left:0.5rem;">${new Date(order.created_at || Date.now()).toLocaleDateString()}</span>
          </div>
          <span style="font-size:0.72rem;font-weight:800;text-transform:uppercase;color:${statusColor};background:rgba(0,0,0,0.4);border:1px solid ${statusColor};padding:2px 8px;border-radius:999px;">
            ${(order.order_status || "Pending").toUpperCase()}
          </span>
        </div>

        <p style="font-size:0.84rem;color:var(--text-cream);margin-bottom:0.75rem;">${itemsText}</p>

        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-subtle);padding-top:0.6rem;font-size:0.82rem;">
          <span style="font-weight:700;color:var(--gold-light);">Total: Rs ${Number(order.total || 0).toLocaleString()}</span>
          <a href="order-tracker.html?id=${order.id}" class="btn btn-outline" style="font-size:0.7rem;padding:0.35rem 0.75rem;">
            Track Order &rarr;
          </a>
        </div>
      </div>
    `;
    })
    .join("");
}

window.addNewAddress = function (e) {
  e.preventDefault();
  const label = document.querySelector("#new-addr-label")?.value.trim();
  const address = document.querySelector("#new-addr-text")?.value.trim();

  if (!label || !address) return;

  const profile = window.VelouraData.getUserProfile();
  profile.addresses = profile.addresses || [];
  profile.addresses.push({
    id: `addr-${Date.now()}`,
    label,
    address,
    isDefault: profile.addresses.length === 0
  });

  window.VelouraData.saveUserProfile(profile);
  renderAccountData();

  document.querySelector("#new-addr-label").value = "";
  document.querySelector("#new-addr-text").value = "";

  if (window.showToast) window.showToast("Address saved successfully");
};

window.setDefaultAddress = function (index) {
  const profile = window.VelouraData.getUserProfile();
  if (profile.addresses) {
    profile.addresses.forEach((a, i) => (a.isDefault = i === index));
    window.VelouraData.saveUserProfile(profile);
    renderAccountData();
    if (window.showToast) window.showToast("Default address updated");
  }
};

window.redeemPerk = function (perkName, cost) {
  const profile = window.VelouraData.getUserProfile();
  if ((profile.loyaltyPoints || 0) < cost) {
    alert(`You need ${cost} points for this perk. Current balance: ${profile.loyaltyPoints} points.`);
    return;
  }

  if (confirm(`Redeem ${perkName} for ${cost} points?`)) {
    profile.loyaltyPoints -= cost;
    window.VelouraData.saveUserProfile(profile);
    renderAccountData();
    if (window.showToast) {
      window.showToast(`Redeemed ${perkName}! Voucher code: VEL-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }
};

window.setRoleAndReload = function (role) {
  window.VelouraData.setCurrentRole(role);
  if (role === "admin") {
    window.location.href = "admin/index.html";
  } else {
    renderAccountData();
    if (window.showToast) window.showToast(`Switched role to: ${role.toUpperCase()}`);
  }
};
