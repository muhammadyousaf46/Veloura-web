// ==========================================================================
// VELOURA — Menu Page Controller
// Category filtering (Starters, Main Course, Fast Food, Desserts, Beverages),
// live search, dietary filters, price sorting, and cart actions.
// ==========================================================================

let ALL_ITEMS = [];
let ALL_CATEGORIES = [];
let activeCat = "all";
let activeDiet = "all";
let activeSortOrder = "default";
let searchWord = "";

document.addEventListener("DOMContentLoaded", initMenuPage);

function initMenuPage() {
  ALL_CATEGORIES = window.VelouraData?.getCategories ? window.VelouraData.getCategories() : [];
  ALL_ITEMS = window.VelouraData?.getMenuItems ? window.VelouraData.getMenuItems() : [];

  renderCategoryChips();
  renderMenuGrid();
  setupFilterListeners();
}

function renderCategoryChips() {
  const chipWrap = document.querySelector("#category-chips");
  if (!chipWrap) return;

  const categories = [{ id: "all", name: "All Dishes" }, ...ALL_CATEGORIES];

  chipWrap.innerHTML = categories
    .map((c) => {
      const isSelected = (c.id === "all" && activeCat === "all") || c.name.toLowerCase() === activeCat.toLowerCase();
      const count =
        c.id === "all"
          ? ALL_ITEMS.length
          : ALL_ITEMS.filter((i) => (i.category_name || "").toLowerCase() === c.name.toLowerCase()).length;

      return `
      <button class="chip ${isSelected ? "active" : ""}" data-cat="${c.id === "all" ? "all" : c.name}">
        <span>${c.name} (${count})</span>
      </button>
    `;
    })
    .join("");

  chipWrap.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCat = btn.dataset.cat;
      renderCategoryChips();
      renderMenuGrid();
    });
  });
}

function renderMenuGrid() {
  const container = document.querySelector("#menu-categories");
  const emptyEl = document.querySelector("#menu-empty");
  if (!container) return;

  let items = [...ALL_ITEMS];

  // 1. Category Filter
  if (activeCat !== "all") {
    items = items.filter((i) => (i.category_name || "").toLowerCase() === activeCat.toLowerCase());
  }

  // 2. Search filter
  if (searchWord) {
    items = items.filter((i) => {
      const n = (i.name || "").toLowerCase();
      const d = (i.description || "").toLowerCase();
      const c = (i.category_name || "").toLowerCase();
      return n.includes(searchWord) || d.includes(searchWord) || c.includes(searchWord);
    });
  }

  // 3. Dietary Filter
  if (activeDiet === "veg") {
    items = items.filter((i) => i.is_vegetarian);
  } else if (activeDiet === "popular") {
    items = items.filter((i) => i.is_popular);
  }

  // 4. Sort
  if (activeSortOrder === "price-asc") items.sort((a, b) => Number(a.price) - Number(b.price));
  if (activeSortOrder === "price-desc") items.sort((a, b) => Number(b.price) - Number(a.price));
  if (activeSortOrder === "popular") items.sort((a, b) => Number(b.is_popular || 0) - Number(a.is_popular || 0));

  if (items.length === 0) {
    container.style.display = "none";
    if (emptyEl) emptyEl.style.display = "block";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";
  container.style.display = "grid";

  container.innerHTML = items
    .map((item) => {
      const isAvailable = item.is_available !== false;
      const safeName = item.name.replace(/'/g, "\\'").replace(/"/g, "&quot;");
      const safeImg = (item.image_url || "").replace(/'/g, "\\'");
      const stars = "★".repeat(Math.floor(item.rating || 5)) + "☆".repeat(5 - Math.floor(item.rating || 5));

      return `
      <article class="dish-card ${isAvailable ? "" : "out-of-stock"}">
        <div class="dish-image-wrap">
          <img src="${item.image_url}" alt="${item.name}" loading="lazy" />
          
          <div class="card-badges">
            ${item.is_popular ? `<span class="badge badge-chef"><i data-lucide="sparkles" style="width:11px;height:11px;"></i> Popular</span>` : ""}
            ${item.is_vegetarian ? `<span class="badge badge-veg"><i data-lucide="leaf" style="width:11px;height:11px;"></i> Veg</span>` : ""}
          </div>

          ${item.category_name ? `<span class="badge-category">${item.category_name}</span>` : ""}
          ${!isAvailable ? `<div class="out-of-stock-overlay">Out of Stock</div>` : ""}
        </div>

        <div class="dish-body">
          <div>
            <div class="dish-header-row">
              <h3 class="dish-name">${item.name}</h3>
            </div>
            
            <div class="dish-rating-row">
              <span class="dish-rating-stars">${stars}</span>
              <span>${item.rating || 4.9}</span>
              <span class="dish-reviews-count">(${item.reviews_count || 120})</span>
            </div>

            <p class="dish-desc">${item.description}</p>
          </div>

          <div class="dish-footer">
            <span class="dish-price">Rs ${Number(item.price).toLocaleString()}</span>
            
            <button 
              class="add-btn" 
              onclick="addToCartFromMenu(this, '${item.id}', '${safeName}', ${item.price}, '${safeImg}')"
              ${!isAvailable ? "disabled" : ""}
            >
              <i data-lucide="plus" style="width:14px;height:14px;"></i>
              <span>${isAvailable ? "Add" : "Sold Out"}</span>
            </button>
          </div>
        </div>
      </article>
    `;
    })
    .join("");

  if (window.lucide) window.lucide.createIcons();
}

function setupFilterListeners() {
  const searchInput = document.querySelector("#menu-search");
  const dietSelect = document.querySelector("#dietary-select");
  const sortSelect = document.querySelector("#menu-sort");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchWord = e.target.value.trim().toLowerCase();
      renderMenuGrid();
    });
  }

  if (dietSelect) {
    dietSelect.addEventListener("change", (e) => {
      activeDiet = e.target.value;
      renderMenuGrid();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      activeSortOrder = e.target.value;
      renderMenuGrid();
    });
  }
}

window.resetMenuFilters = function () {
  activeCat = "all";
  activeDiet = "all";
  activeSortOrder = "default";
  searchWord = "";

  const searchInput = document.querySelector("#menu-search");
  const dietSelect = document.querySelector("#dietary-select");
  const sortSelect = document.querySelector("#menu-sort");

  if (searchInput) searchInput.value = "";
  if (dietSelect) dietSelect.value = "all";
  if (sortSelect) sortSelect.value = "default";

  renderCategoryChips();
  renderMenuGrid();
};

window.addToCartFromMenu = function (btn, id, name, price, img) {
  if (typeof window.handleAddToCart === "function") {
    window.handleAddToCart(btn, id, name, price, img);
  } else {
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem("veloura_cart") || "[]");
    } catch (e) {
      cart = [];
    }
    const existing = cart.find((i) => String(i.id) === String(id));
    if (existing) existing.quantity = (existing.quantity || 1) + 1;
    else cart.push({ id, name, price, quantity: 1, image: img });

    localStorage.setItem("veloura_cart", JSON.stringify(cart));
    if (typeof initCartBadge === "function") initCartBadge();
    if (window.showToast) window.showToast(`Added ${name} to cart`);
  }
};
