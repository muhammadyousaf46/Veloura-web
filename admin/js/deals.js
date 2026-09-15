// ==========================================================================
// VELOURA — Admin: Deals (create / modify / delete special offers)
// ==========================================================================

let ADMIN_DEALS = [];
let ADMIN_MENU_ITEMS_FOR_DEALS = [];

document.addEventListener("admin-authorized", initDealsPage);

async function initDealsPage() {
  await loadMenuItemsForDeals();
  await loadDeals();

  document.querySelector("#add-deal-btn").addEventListener("click", () => openDealModal());
  document.querySelector("#deal-modal-cancel").addEventListener("click", closeDealModal);
  document.querySelector("#deal-modal").addEventListener("click", (e) => {
    if (e.target.id === "deal-modal") closeDealModal();
  });
  document.querySelector("#deal-form").addEventListener("submit", saveDeal);
  document.querySelector("#deal-image-file").addEventListener("change", uploadDealImage);
}

async function loadMenuItemsForDeals() {
  const { data, error } = await supabase.from("menu_items").select("id, name").order("name");
  if (error) { console.error(error); return; }
  ADMIN_MENU_ITEMS_FOR_DEALS = data || [];
  const select = document.querySelector("#deal-item");
  select.innerHTML =
    `<option value="">None</option>` +
    ADMIN_MENU_ITEMS_FOR_DEALS.map((i) => `<option value="${i.id}">${i.name}</option>`).join("");
}

async function loadDeals() {
  const tbody = document.querySelector("#deals-table-body");
  tbody.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;

  const { data, error } = await supabase
    .from("deals")
    .select("*, menu_items(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="6">Failed to load deals.</td></tr>`;
    return;
  }

  ADMIN_DEALS = data || [];
  renderDealsTable();
}

function renderDealsTable() {
  const tbody = document.querySelector("#deals-table-body");
  if (ADMIN_DEALS.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No deals yet — create your first one.</td></tr>`;
    return;
  }

  tbody.innerHTML = ADMIN_DEALS.map(
    (d) => `
    <tr>
      <td>${d.title}</td>
      <td>${d.menu_items?.name ?? "—"}</td>
      <td>${d.discount_percent ? d.discount_percent + "%" : "—"}</td>
      <td>${d.start_date || "—"} to ${d.end_date || "—"}</td>
      <td><span class="status-pill ${d.is_active ? "approved" : "cancelled"}">${d.is_active ? "Active" : "Inactive"}</span></td>
      <td class="admin-actions">
        <button data-edit="${d.id}">Edit</button>
        <button data-delete="${d.id}">Delete</button>
      </td>
    </tr>`
  ).join("");

  tbody.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => openDealModal(btn.dataset.edit))
  );
  tbody.querySelectorAll("[data-delete]").forEach((btn) =>
    btn.addEventListener("click", () => deleteDeal(btn.dataset.delete))
  );
}

function openDealModal(id) {
  const form = document.querySelector("#deal-form");
  form.reset();
  document.querySelector("#deal-image-url").value = "";

  if (id) {
    const deal = ADMIN_DEALS.find((d) => d.id === id);
    document.querySelector("#deal-modal-title").textContent = "Edit Deal";
    document.querySelector("#deal-id").value = deal.id;
    document.querySelector("#deal-title").value = deal.title;
    document.querySelector("#deal-description").value = deal.description || "";
    document.querySelector("#deal-item").value = deal.menu_item_id || "";
    document.querySelector("#deal-discount").value = deal.discount_percent || "";
    document.querySelector("#deal-start").value = deal.start_date || "";
    document.querySelector("#deal-end").value = deal.end_date || "";
    document.querySelector("#deal-image-url").value = deal.image_url || "";
    document.querySelector("#deal-active").checked = deal.is_active;
  } else {
    document.querySelector("#deal-modal-title").textContent = "Create Deal";
    document.querySelector("#deal-id").value = "";
    document.querySelector("#deal-active").checked = true;
  }

  document.querySelector("#deal-modal").classList.add("open");
}

function closeDealModal() {
  document.querySelector("#deal-modal").classList.remove("open");
}

async function uploadDealImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const url = await uploadToVelouraStorage(file, "deals");
    document.querySelector("#deal-image-url").value = url;
    showToast("Image uploaded");
  } catch (err) {
    console.error(err);
    showToast("Image upload failed", "error");
  }
}

async function saveDeal(e) {
  e.preventDefault();
  const id = document.querySelector("#deal-id").value;
  const payload = {
    title: document.querySelector("#deal-title").value.trim(),
    description: document.querySelector("#deal-description").value.trim(),
    menu_item_id: document.querySelector("#deal-item").value || null,
    discount_percent: document.querySelector("#deal-discount").value
      ? Number(document.querySelector("#deal-discount").value)
      : null,
    start_date: document.querySelector("#deal-start").value || null,
    end_date: document.querySelector("#deal-end").value || null,
    image_url: document.querySelector("#deal-image-url").value || null,
    is_active: document.querySelector("#deal-active").checked,
  };

  try {
    if (id) {
      const { error } = await supabase.from("deals").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("deals").insert(payload);
      if (error) throw error;
    }
    showToast("Deal saved");
    closeDealModal();
    await loadDeals();
  } catch (err) {
    console.error(err);
    showToast(friendlyError(err), "error");
  }
}

async function deleteDeal(id) {
  if (!confirm("Delete this deal?")) return;
  try {
    const { error } = await supabase.from("deals").delete().eq("id", id);
    if (error) throw error;
    showToast("Deal deleted");
    await loadDeals();
  } catch (err) {
    console.error(err);
    showToast(friendlyError(err), "error");
  }
}
