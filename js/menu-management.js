// ==========================================================================
// VELOURA — Admin: Menu Management (CRUD)
// ==========================================================================

let ADMIN_CATEGORIES = [];
let ADMIN_ITEMS = [];

document.addEventListener("admin-authorized", initMenuManagement);

async function initMenuManagement() {
  await loadCategories();
  await loadItems();

  document.querySelector("#add-item-btn").addEventListener("click", () => openItemModal());
  document.querySelector("#modal-cancel").addEventListener("click", closeItemModal);
  document.querySelector("#item-modal").addEventListener("click", (e) => {
    if (e.target.id === "item-modal") closeItemModal();
  });
  document.querySelector("#item-form").addEventListener("submit", saveItem);
}

async function loadCategories() {
  const { data, error } = await supabase.from("categories").select("id, name").order("name");
  if (error) { console.error(error); return; }
  ADMIN_CATEGORIES = data || [];
  const select = document.querySelector("#item-category");
  select.innerHTML = ADMIN_CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
}

async function loadItems() {
  const tbody = document.querySelector("#menu-table-body");
  tbody.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;

  const { data, error } = await supabase
    .from("menu_items")
    .select("*, categories(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="7">Failed to load menu items.</td></tr>`;
    return;
  }

  ADMIN_ITEMS = data || [];
  renderItemsTable();
}

function renderItemsTable() {
  const tbody = document.querySelector("#menu-table-body");
  if (ADMIN_ITEMS.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">No menu items yet — add your first one.</td></tr>`;
    return;
  }

  tbody.innerHTML = ADMIN_ITEMS.map(
    (item) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.categories?.name ?? "—"}</td>
      <td>Rs ${Number(item.price).toLocaleString()}</td>
      <td>${item.is_popular ? "Yes" : "No"}</td>
      <td>${item.is_vegetarian ? "Yes" : "No"}</td>
      <td>${item.is_available ? "Yes" : "No"}</td>
      <td class="admin-actions">
        <button data-edit="${item.id}">Edit</button>
        <button data-delete="${item.id}">Delete</button>
      </td>
    </tr>`
  ).join("");

  tbody.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => openItemModal(btn.dataset.edit))
  );
  tbody.querySelectorAll("[data-delete]").forEach((btn) =>
    btn.addEventListener("click", () => deleteItem(btn.dataset.delete))
  );
}

function openItemModal(id) {
  const modal = document.querySelector("#item-modal");
  const form = document.querySelector("#item-form");
  form.reset();

  if (id) {
    const item = ADMIN_ITEMS.find((i) => i.id === id);
    document.querySelector("#modal-title").textContent = "Edit Menu Item";
    document.querySelector("#item-id").value = item.id;
    document.querySelector("#item-name").value = item.name;
    document.querySelector("#item-description").value = item.description || "";
    document.querySelector("#item-category").value = item.category_id || "";
    document.querySelector("#item-price").value = item.price;
    document.querySelector("#item-image").value = item.image_url || "";
    document.querySelector("#item-popular").checked = item.is_popular;
    document.querySelector("#item-vegetarian").checked = item.is_vegetarian;
    document.querySelector("#item-available").checked = item.is_available;
  } else {
    document.querySelector("#modal-title").textContent = "Add Menu Item";
    document.querySelector("#item-id").value = "";
    document.querySelector("#item-available").checked = true;
  }

  modal.classList.add("open");
}

function closeItemModal() {
  document.querySelector("#item-modal").classList.remove("open");
}

async function saveItem(e) {
  e.preventDefault();
  const id = document.querySelector("#item-id").value;
  const payload = {
    name: document.querySelector("#item-name").value.trim(),
    description: document.querySelector("#item-description").value.trim(),
    category_id: document.querySelector("#item-category").value,
    price: Number(document.querySelector("#item-price").value),
    image_url: document.querySelector("#item-image").value.trim() || null,
    is_popular: document.querySelector("#item-popular").checked,
    is_vegetarian: document.querySelector("#item-vegetarian").checked,
    is_available: document.querySelector("#item-available").checked,
    updated_at: new Date().toISOString(),
  };

  try {
    if (id) {
      const { error } = await supabase.from("menu_items").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("menu_items").insert(payload);
      if (error) throw error;
    }
    showToast("Menu item saved");
    closeItemModal();
    await loadItems();
  } catch (err) {
    console.error(err);
    showToast(friendlyError(err), "error");
  }
}

async function deleteItem(id) {
  if (!confirm("Delete this menu item? This cannot be undone.")) return;
  try {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) throw error;
    showToast("Menu item deleted");
    await loadItems();
  } catch (err) {
    console.error(err);
    showToast(friendlyError(err), "error");
  }
}
