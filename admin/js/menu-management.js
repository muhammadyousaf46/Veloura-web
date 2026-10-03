// ==========================================================================
// VELOURA — Admin: Menu Management (CRUD + Live Stock Toggle)
// ==========================================================================

let ADMIN_CATEGORIES = [];
let ADMIN_ITEMS = [];

document.addEventListener("admin-authorized", initMenuManagement);
document.addEventListener("DOMContentLoaded", () => {
  // If in demo admin mode
  if (window.VelouraData?.getCurrentRole() === "admin") {
    initMenuManagement();
  }
});

async function initMenuManagement() {
  loadCategories();
  loadItems();

  document.querySelector("#add-item-btn")?.addEventListener("click", () => openItemModal());
  document.querySelector("#modal-cancel")?.addEventListener("click", closeItemModal);
  document.querySelector("#item-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "item-modal") closeItemModal();
  });
  document.querySelector("#item-form")?.addEventListener("submit", saveItem);
}

function loadCategories() {
  ADMIN_CATEGORIES = window.VelouraData?.getCategories ? window.VelouraData.getCategories() : [];
  const select = document.querySelector("#item-category");
  if (select) {
    select.innerHTML = ADMIN_CATEGORIES.map((c) => `<option value="${c.id || c.name}">${c.name}</option>`).join("");
  }
}

function loadItems() {
  ADMIN_ITEMS = window.VelouraData?.getMenuItems ? window.VelouraData.getMenuItems() : [];
  renderItemsTable();
}

function renderItemsTable() {
  const tbody = document.querySelector("#menu-table-body");
  if (!tbody) return;

  if (ADMIN_ITEMS.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;">No menu items found.</td></tr>`;
    return;
  }

  tbody.innerHTML = ADMIN_ITEMS.map((item) => {
    const isAvailable = item.is_available !== false;
    const catName = item.category_name || item.categories?.name || "General";

    return `
    <tr>
      <td style="display:flex;align-items:center;gap:0.75rem;">
        <img src="${item.image_url || 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=100&q=80'}" style="width:40px;height:40px;border-radius:4px;object-fit:cover;" />
        <strong>${item.name}</strong>
      </td>
      <td><span class="badge badge-chef">${catName}</span></td>
      <td style="font-weight:700;color:var(--gold-primary);">Rs ${Number(item.price).toLocaleString()}</td>
      <td>${item.is_popular ? `<span style="color:#34d399;">Yes</span>` : `<span style="color:var(--text-dim);">No</span>`}</td>
      <td>${item.is_vegetarian ? `<span style="color:#34d399;">Veg</span>` : `<span style="color:var(--text-dim);">Non-Veg</span>`}</td>
      <td>
        <!-- Interactive In Stock / Out of Stock Toggle Button -->
        <button 
          class="stock-toggle-btn ${isAvailable ? "in-stock" : "out-of-stock"}" 
          onclick="handleStockToggle('${item.id}', ${!isAvailable})"
          title="Click to toggle availability"
        >
          ${isAvailable ? "In Stock" : "Out of Stock"}
        </button>
      </td>
      <td>
        <button class="btn btn-outline" style="font-size:0.68rem;padding:0.25rem 0.6rem;margin-right:0.35rem;" onclick="openItemModal('${item.id}')">Edit</button>
        <button class="btn btn-dark" style="font-size:0.68rem;padding:0.25rem 0.6rem;color:#f87171;border-color:#ef4444;" onclick="handleDeleteItem('${item.id}')">Delete</button>
      </td>
    </tr>`;
  }).join("");
}

window.handleStockToggle = function (id, newStatus) {
  if (window.VelouraData?.toggleItemStock) {
    ADMIN_ITEMS = window.VelouraData.toggleItemStock(id, newStatus);
    renderItemsTable();
    if (window.showToast) {
      window.showToast(`Item stock updated to: ${newStatus ? "IN STOCK" : "OUT OF STOCK"}`);
    }
  }
};

window.handleDeleteItem = function (id) {
  if (confirm("Are you sure you want to delete this menu dish?")) {
    if (window.VelouraData?.deleteMenuItem) {
      ADMIN_ITEMS = window.VelouraData.deleteMenuItem(id);
      renderItemsTable();
      if (window.showToast) window.showToast("Dish removed from menu");
    }
  }
};

window.openItemModal = function (id) {
  const modal = document.querySelector("#item-modal");
  const form = document.querySelector("#item-form");
  const title = document.querySelector("#modal-title");
  if (!modal || !form) return;

  form.reset();

  if (id) {
    const item = ADMIN_ITEMS.find((i) => i.id === id);
    if (!item) return;
    if (title) title.textContent = "Edit Menu Dish";
    form["item-id"].value = item.id;
    form["item-name"].value = item.name;
    form["item-description"].value = item.description || "";
    form["item-category"].value = item.category_id || item.category_name;
    form["item-price"].value = item.price;
    form["item-image-url"].value = item.image_url || "";
    form["item-popular"].checked = Boolean(item.is_popular);
    form["item-vegetarian"].checked = Boolean(item.is_vegetarian);
    form["item-available"].checked = item.is_available !== false;
  } else {
    if (title) title.textContent = "Add New Menu Dish";
    form["item-id"].value = "";
    form["item-available"].checked = true;
  }

  modal.classList.add("show");
};

window.closeItemModal = function () {
  const modal = document.querySelector("#item-modal");
  if (modal) modal.classList.remove("show");
};

async function saveItem(e) {
  e.preventDefault();
  const form = e.target;
  const id = form["item-id"]?.value || `dish-${Date.now()}`;
  const name = form["item-name"]?.value.trim();
  const description = form["item-description"]?.value.trim();
  const categoryVal = form["item-category"]?.value;
  const price = Number(form["item-price"]?.value || 0);
  const imageUrl = form["item-image-url"]?.value.trim() || "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80";
  const isPopular = form["item-popular"]?.checked;
  const isVegetarian = form["item-vegetarian"]?.checked;
  const isAvailable = form["item-available"]?.checked;

  const catObj = ADMIN_CATEGORIES.find((c) => c.id === categoryVal || c.name === categoryVal);
  const categoryName = catObj ? catObj.name : categoryVal;

  const itemPayload = {
    id,
    name,
    description,
    category_id: categoryVal,
    category_name: categoryName,
    price,
    image_url: imageUrl,
    is_popular: isPopular,
    is_vegetarian: isVegetarian,
    is_available: isAvailable,
    rating: 4.9,
    reviews_count: 50
  };

  if (window.VelouraData?.upsertMenuItem) {
    ADMIN_ITEMS = window.VelouraData.upsertMenuItem(itemPayload);
    renderItemsTable();
    closeItemModal();
    if (window.showToast) window.showToast(`Saved dish: ${name}`);
  }
}
