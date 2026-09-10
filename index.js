// ==========================================================================
// VELOURA — Home page: Signature Creations (featured dishes from Supabase)
// ==========================================================================

document.addEventListener("DOMContentLoaded", loadFeaturedDishes);

async function loadFeaturedDishes() {
  const grid = document.querySelector("#featured-dish-grid");
  if (!grid) return;

  renderDishSkeletons(grid, 6);

  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, name, description, price, image_url, is_available")
      .eq("is_popular", true)
      .eq("is_available", true)
      .limit(6);

    if (error) throw error;

    if (!data || data.length === 0) {
      grid.innerHTML = `<div class="empty-state">Our signature dishes are being plated. Check back shortly.</div>`;
      return;
    }

    grid.innerHTML = data.map(dishCardTemplate).join("");
    attachAddToCartHandlers(grid);
  } catch (err) {
    console.error("Failed to load menu:", err);
    grid.innerHTML = `<div class="empty-state">Failed to load menu. Please refresh the page.</div>`;
  }
}

function renderDishSkeletons(grid, count) {
  grid.innerHTML = Array.from({ length: count })
    .map(
      () => `
      <div class="dish-card">
        <div class="dish-image skeleton"></div>
        <div class="dish-info">
          <div class="skeleton" style="height:20px;width:60%;"></div>
          <div class="skeleton" style="height:20px;width:20%;"></div>
        </div>
      </div>`
    )
    .join("");
}

function dishCardTemplate(item) {
  // IMAGE PLACEHOLDER: item.image_url comes from Supabase storage/menu_items table.
  // Falls back to a neutral placeholder block if no image is set yet.
  const image = item.image_url
    ? `<img src="${item.image_url}" alt="${item.name}" loading="lazy" />`
    : `<div class="skeleton" style="width:100%;height:100%;"></div>`;

  return `
    <article class="dish-card reveal is-visible">
      <div class="dish-image">
        ${image}
        <button class="dish-add" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" aria-label="Add ${item.name} to cart">+</button>
      </div>
      <div class="dish-info">
        <h3>${item.name}</h3>
        <span class="dish-price">Rs ${Number(item.price).toLocaleString()}</span>
      </div>
      <p class="dish-desc">${item.description ?? ""}</p>
    </article>
  `;
}

function attachAddToCartHandlers(grid) {
  grid.querySelectorAll(".dish-add").forEach((btn) => {
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