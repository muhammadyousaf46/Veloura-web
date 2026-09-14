// ==========================================================================
// VELOURA — Menu page: search, category filters, sort, Supabase data
// ==========================================================================

let ALL_ITEMS = [];
let ALL_CATEGORIES = [];
let activeCategory = "all";
let activeSort = "default";
let searchTerm = "";

document.addEventListener("DOMContentLoaded", initMenuPage);

async function initMenuPage() {
  const container = document.querySelector("#menu-categories");
  if (!container) return;

  renderMenuSkeleton(container);

  try {
    const [{ data: categories, error: catErr }, { data: items, error: itemErr }] = await Promise.all([
      supabase.from("categories").select("id, name").order("name"),
      supabase.from("menu_items").select("*"),
    ]);

    if (catErr) throw catErr;
    if (itemErr) throw itemErr;

    ALL_CATEGORIES = categories || [];
    ALL_ITEMS = items || [];

    renderFilterChips();
    renderMenu();
    handleHashScroll();
  } catch (err) {
    console.error("Failed to load menu:", err);
    container.innerHTML = `<div class="empty-state">Failed to load menu. Please refresh the page.</div>`;
  }

  document.querySelector("#menu-search")?.addEventListener("input", (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderMenu();
  });

  document.querySelector("#menu-sort")?.addEventListener("change", (e) => {
    activeSort = e.target.value;
    renderMenu();
  });
}

function renderMenuSkeleton(container) {
  container.innerHTML = `
    <div class="dish-grid">
      ${Array.from({ length: 6 })
        .map(
          () => `
        <div class="dish-card">
          <div class="dish-image skeleton"></div>
          <div class="dish-info"><div class="skeleton" style="height:20px;width:60%;"></div></div>
        </div>`
        )
        .join("")}
    </div>`;
}

function renderFilterChips() {
  const chipWrap = document.querySelector("#category-chips");
  if (!chipWrap) return;

  const chips = [{ id: "all", name: "All" }, ...ALL_CATEGORIES];
  chipWrap.innerHTML = chips
    .map(
      (c) =>
        `<button class="chip ${c.id === activeCategory ? "active" : ""}" data-cat="${c.id}">${c.name}</button>`
    )
    .join("");

  chipWrap.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      activeCategory = chip.dataset.cat;
      renderFilterChips();
      renderMenu();
    });
  });
}

function renderMenu() {
  const container = document.querySelector("#menu-categories");
  if (!container) return;

  let items = [...ALL_ITEMS];

  if (searchTerm) {
    items = items.filter(
      (i) =>
        i.name.toLowerCase().includes(searchTerm) ||
        (i.description || "").toLowerCase().includes(searchTerm)
    );
  }

  if (activeCategory !== "all") {
    items = items.filter((i) => i.category_id === activeCategory);
  }

  if (activeSort === "price-asc") items.sort((a, b) => a.price - b.price);
  if (activeSort === "price-desc") items.sort((a, b) => b.price - a.price);
  if (activeSort === "popular") items.sort((a, b) => Number(b.is_popular) - Number(a.is_popular));

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state">No dishes match your search or filters.</div>`;
    return;
  }

  const categoriesToShow =
    activeCategory === "all"
      ? ALL_CATEGORIES
      : ALL_CATEGORIES.filter((c) => c.id === activeCategory);

  container.innerHTML = categoriesToShow
    .map((cat) => {
      const catItems = items.filter((i) => i.category_id === cat.id);
      if (catItems.length === 0) return "";
      const slug = slugify(cat.name);
      return `
        <div class="menu-category-block" id="${slug}">
          <h2>${cat.name}</h2>
          <div class="dish-grid">
            ${catItems.map(menuItemTemplate).join("")}
          </div>
        </div>`;
    })
    .join("");

  attachAddToCartHandlers(container);
}

function menuItemTemplate(item) {
  const image = item.image_url
    ? `<img src="${item.image_url}" alt="${item.name}" loading="lazy" />`
    : `<div class="skeleton" style="width:100%;height:100%;"></div>`;

  return `
    <article class="dish-card reveal is-visible ${item.is_available ? "" : "unavailable"}">
      <div class="dish-image">
        ${image}
        ${item.is_available ? `<button class="dish-add" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" aria-label="Add ${item.name} to cart">+</button>` : ""}
      </div>
      <div class="dish-info">
        <h3>
          ${item.is_vegetarian ? '<span class="veg-badge" title="Vegetarian"></span>' : ""}
          ${item.name}
          ${item.is_popular ? '<span class="popular-badge">Popular</span>' : ""}
        </h3>
        <span class="dish-price">Rs ${Number(item.price).toLocaleString()}</span>
      </div>
      <p class="dish-desc">${item.description ?? ""}</p>
      ${!item.is_available ? '<p class="unavailable-badge">Currently unavailable</p>' : ""}
    </article>`;
}

function attachAddToCartHandlers(container) {
  container.querySelectorAll(".dish-add").forEach((btn) => {
    btn.addEventListener("click", () => {
      addToCart({
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: Number(btn.dataset.price),
        quantity: 1,
      });
      showToast(`${btn.dataset.name} added to cart`);
      initCartBadge();
    });
  });
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find((c) => c.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push(item);
  }
  localStorage.setItem("veloura_cart", JSON.stringify(cart));
}

function slugify(name) {
  return name.toLowerCase().replace(/&/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

function handleHashScroll() {
  if (!window.location.hash) return;
  const el = document.querySelector(window.location.hash);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}
