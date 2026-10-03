// ==========================================================================
// VELOURA — Home Page Engine: Chef's Specials, Dynamic Menu, Reviews & Roles
// ==========================================================================

let activeCategory = "ALL";
let searchQuery = "";
let dietaryFilter = "all";
let sortOrder = "default";
let currentSpecialIndex = 0;
let specialsTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initRoleBadge();
  initSpecialsCarousel();
  initCategoriesAndDishes();
  initSearchAndFilters();
  initCustomerReviews();
  initGooglePlacesSimulation();

  // Listen to menu or role updates
  window.addEventListener("veloura-menu-updated", () => {
    renderDishes();
  });

  window.addEventListener("veloura-role-changed", (e) => {
    initRoleBadge();
  });
});

// ==========================================================================
// 1. MOBILE NAVIGATION
// ==========================================================================
function initMobileNav() {
  const toggleBtn = document.querySelector("#mobile-nav-toggle");
  const drawer = document.querySelector("#mobile-nav-drawer");
  if (!toggleBtn || !drawer) return;

  toggleBtn.addEventListener("click", () => {
    const isOpen = drawer.classList.toggle("open");
    toggleBtn.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  drawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      drawer.classList.remove("open");
      document.body.style.overflow = "";
    });
  });
}

// ==========================================================================
// 2. ROLE SWITCHER & BADGE
// ==========================================================================
function initRoleBadge() {
  const roleText = document.querySelector("#role-display-text");
  const currentRole = window.VelouraData?.getCurrentRole() || "registered";

  if (roleText) {
    if (currentRole === "admin") {
      roleText.textContent = "Role: Admin";
      roleText.parentElement.style.borderColor = "var(--gold-primary)";
    } else if (currentRole === "registered") {
      roleText.textContent = "Role: Patron (Muhammad)";
    } else {
      roleText.textContent = "Role: Guest";
    }
  }
}

window.openRoleModal = function () {
  const modal = document.querySelector("#role-modal");
  if (modal) modal.classList.add("show");
};

window.closeRoleModal = function () {
  const modal = document.querySelector("#role-modal");
  if (modal) modal.classList.remove("show");
};

window.switchRole = function (role) {
  window.VelouraData?.setCurrentRole(role);
  closeRoleModal();
  initRoleBadge();

  if (role === "admin") {
    if (window.showToast) window.showToast("Switched to Administrator Mode. Accessing Admin Panel...");
    setTimeout(() => {
      window.location.href = "admin/index.html";
    }, 600);
  } else if (role === "registered") {
    if (window.showToast) window.showToast("Logged in as Registered Patron (Muhammad Yousaf)");
  } else {
    if (window.showToast) window.showToast("Browsing as Guest Diner");
  }
};

// ==========================================================================
// 3. CHEF'S DAILY SPECIALS CAROUSEL
// ==========================================================================
function initSpecialsCarousel() {
  const specials = window.VelouraData?.CHEF_SPECIALS || [];
  if (!specials.length) return;

  const dotsContainer = document.querySelector("#special-dots");
  if (dotsContainer) {
    dotsContainer.innerHTML = specials
      .map(
        (_, idx) => `
        <button class="carousel-dot ${idx === 0 ? "active" : ""}" onclick="goToSpecial(${idx})" aria-label="Special dish ${idx + 1}"></button>
      `
      )
      .join("");
  }

  updateSpecialView();
  startSpecialsTimer();
}

function updateSpecialView() {
  const specials = window.VelouraData?.CHEF_SPECIALS || [];
  if (!specials.length) return;

  const current = specials[currentSpecialIndex];
  const imgEl = document.querySelector("#special-image");
  const taglineEl = document.querySelector("#special-tagline");
  const titleEl = document.querySelector("#special-title");
  const descEl = document.querySelector("#special-desc");
  const pairingEl = document.querySelector("#special-pairing");
  const priceEl = document.querySelector("#special-price");

  if (imgEl) {
    imgEl.style.opacity = "0.4";
    setTimeout(() => {
      imgEl.src = current.image;
      imgEl.alt = current.name;
      imgEl.style.opacity = "1";
    }, 150);
  }

  if (taglineEl) taglineEl.textContent = current.tagline;
  if (titleEl) titleEl.textContent = current.name;
  if (descEl) descEl.textContent = current.description;
  if (pairingEl) pairingEl.textContent = current.pairing;
  if (priceEl) priceEl.textContent = `Rs ${Number(current.price).toLocaleString()}`;

  // Update dots
  document.querySelectorAll(".carousel-dot").forEach((dot, idx) => {
    dot.classList.toggle("active", idx === currentSpecialIndex);
  });

  if (window.lucide) window.lucide.createIcons();
}

function startSpecialsTimer() {
  clearInterval(specialsTimer);
  specialsTimer = setInterval(() => {
    nextSpecial();
  }, 7000);
}

window.nextSpecial = function () {
  const specials = window.VelouraData?.CHEF_SPECIALS || [];
  currentSpecialIndex = (currentSpecialIndex + 1) % specials.length;
  updateSpecialView();
  startSpecialsTimer();
};

window.prevSpecial = function () {
  const specials = window.VelouraData?.CHEF_SPECIALS || [];
  currentSpecialIndex = (currentSpecialIndex - 1 + specials.length) % specials.length;
  updateSpecialView();
  startSpecialsTimer();
};

window.goToSpecial = function (idx) {
  currentSpecialIndex = idx;
  updateSpecialView();
  startSpecialsTimer();
};

window.addCurrentSpecialToCart = function () {
  const specials = window.VelouraData?.CHEF_SPECIALS || [];
  const current = specials[currentSpecialIndex];
  if (!current) return;

  window.handleAddToCart(null, current.dishId || current.id, current.name, current.price, current.image);
};

// ==========================================================================
// 4. DYNAMIC MENU, 5 CATEGORIES, & DISH CARDS
// ==========================================================================
function initCategoriesAndDishes() {
  renderCategoryChips();
  renderDishes();
}

function renderCategoryChips() {
  const container = document.querySelector("#categories-bar");
  if (!container) return;

  const categories = window.VelouraData?.getCategories ? window.VelouraData.getCategories() : [];
  const allItems = window.VelouraData?.getMenuItems ? window.VelouraData.getMenuItems() : [];

  let html = `
    <button class="chip ${activeCategory === "ALL" ? "active" : ""}" onclick="selectCategory('ALL')">
      <i data-lucide="sparkles" style="width:14px;height:14px;"></i>
      <span>All Dishes (${allItems.length})</span>
    </button>
  `;

  categories.forEach((cat) => {
    const count = allItems.filter(
      (item) => item.category_id === cat.id || item.category_name?.toLowerCase() === cat.name.toLowerCase()
    ).length;

    html += `
      <button class="chip ${activeCategory === cat.name ? "active" : ""}" onclick="selectCategory('${cat.name}')">
        <span>${cat.name} (${count})</span>
      </button>
    `;
  });

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
}

window.selectCategory = function (categoryName) {
  activeCategory = categoryName;
  renderCategoryChips();
  renderDishes();
};

function renderDishes() {
  const grid = document.querySelector("#dishes-grid");
  const noDishes = document.querySelector("#no-dishes-state");
  const noDishesText = document.querySelector("#no-dishes-text");
  if (!grid) return;

  let items = window.VelouraData?.getMenuItems ? window.VelouraData.getMenuItems() : [];

  // 1. Filter by category
  if (activeCategory !== "ALL") {
    items = items.filter((item) => {
      const cat = (item.category_name || "").toLowerCase();
      return cat === activeCategory.toLowerCase();
    });
  }

  // 2. Filter by search query
  if (searchQuery) {
    items = items.filter((item) => {
      const n = (item.name || "").toLowerCase();
      const d = (item.description || "").toLowerCase();
      const c = (item.category_name || "").toLowerCase();
      return n.includes(searchQuery) || d.includes(searchQuery) || c.includes(searchQuery);
    });
  }

  // 3. Filter by dietary preference
  if (dietaryFilter === "veg") {
    items = items.filter((item) => item.is_vegetarian);
  } else if (dietaryFilter === "popular") {
    items = items.filter((item) => item.is_popular);
  }

  // 4. Sort
  if (sortOrder === "low-to-high") {
    items.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortOrder === "high-to-low") {
    items.sort((a, b) => Number(b.price) - Number(a.price));
  }

  // Empty state
  if (items.length === 0) {
    grid.style.display = "none";
    if (noDishes) noDishes.style.display = "block";
    if (noDishesText) {
      noDishesText.textContent = searchQuery
        ? `No dishes found matching "${searchQuery}".`
        : `No items available under category "${activeCategory}".`;
    }
    return;
  }

  if (noDishes) noDishes.style.display = "none";
  grid.style.display = "grid";

  grid.innerHTML = items
    .map((dish) => {
      const isAvailable = dish.is_available !== false;
      const safeName = dish.name.replace(/'/g, "\\'").replace(/"/g, "&quot;");
      const safeImg = (dish.image_url || "").replace(/'/g, "\\'");
      const stars = "★".repeat(Math.floor(dish.rating || 5)) + "☆".repeat(5 - Math.floor(dish.rating || 5));

      return `
      <article class="dish-card ${isAvailable ? "" : "out-of-stock"}">
        <div class="dish-image-wrap">
          <img src="${dish.image_url}" alt="${dish.name}" loading="lazy" />
          
          <div class="card-badges">
            ${dish.is_popular ? `<span class="badge badge-chef"><i data-lucide="sparkles" style="width:11px;height:11px;"></i> Popular</span>` : ""}
            ${dish.is_vegetarian ? `<span class="badge badge-veg"><i data-lucide="leaf" style="width:11px;height:11px;"></i> Veg</span>` : ""}
          </div>

          ${dish.category_name ? `<span class="badge-category">${dish.category_name}</span>` : ""}

          ${!isAvailable ? `<div class="out-of-stock-overlay">Sold Out</div>` : ""}
        </div>

        <div class="dish-body">
          <div>
            <div class="dish-header-row">
              <h3 class="dish-name">${dish.name}</h3>
            </div>
            
            <div class="dish-rating-row">
              <span class="dish-rating-stars">${stars}</span>
              <span>${dish.rating || 4.9}</span>
              <span class="dish-reviews-count">(${dish.reviews_count || 120} reviews)</span>
            </div>

            <p class="dish-desc">${dish.description}</p>
          </div>

          <div class="dish-footer">
            <span class="dish-price">Rs ${Number(dish.price).toLocaleString()}</span>
            
            <button 
              class="add-btn" 
              onclick="window.handleAddToCart(this, '${dish.id}', '${safeName}', ${dish.price}, '${safeImg}')"
              ${!isAvailable ? "disabled" : ""}
              title="${isAvailable ? "Add to cart" : "Currently out of stock"}"
            >
              <i data-lucide="plus" style="width:14px;height:14px;"></i>
              <span>${isAvailable ? "Add" : "Unavailable"}</span>
            </button>
          </div>
        </div>
      </article>
    `;
    })
    .join("");

  if (window.lucide) window.lucide.createIcons();
}

function initSearchAndFilters() {
  const searchInput = document.querySelector("#dish-search");
  const dietSelect = document.querySelector("#dietary-filter");
  const sortSelect = document.querySelector("#price-sort");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderDishes();
    });
  }

  if (dietSelect) {
    dietSelect.addEventListener("change", (e) => {
      dietFilter = e.target.value;
      dietaryFilter = e.target.value;
      renderDishes();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      sortOrder = e.target.value;
      renderDishes();
    });
  }
}

window.resetFilters = function () {
  activeCategory = "ALL";
  searchQuery = "";
  dietaryFilter = "all";
  sortOrder = "default";

  const searchInput = document.querySelector("#dish-search");
  const dietSelect = document.querySelector("#dietary-filter");
  const sortSelect = document.querySelector("#price-sort");

  if (searchInput) searchInput.value = "";
  if (dietSelect) dietSelect.value = "all";
  if (sortSelect) sortSelect.value = "default";

  renderCategoryChips();
  renderDishes();
};

// ==========================================================================
// 5. ADD TO CART & TOAST FEEDBACK
// ==========================================================================
window.handleAddToCart = function (btn, id, name, price, image) {
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem("veloura_cart") || "[]");
  } catch (e) {
    cart = [];
  }

  const existing = cart.find((i) => String(i.id) === String(id));
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({
      id: String(id),
      name: name,
      price: Number(price),
      quantity: 1,
      image: image
    });
  }

  localStorage.setItem("veloura_cart", JSON.stringify(cart));

  // Update badge count
  if (typeof initCartBadge === "function") initCartBadge();

  // Button micro-animation
  if (btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="check" style="width:14px;height:14px;"></i> <span>Added</span>`;
    btn.style.background = "#10b981";
    btn.style.borderColor = "#10b981";
    btn.style.color = "#ffffff";
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = "";
      btn.style.borderColor = "";
      btn.style.color = "";
      if (window.lucide) window.lucide.createIcons();
    }, 1200);
  }

  if (window.showToast) {
    window.showToast(`Added ${name} to your cart`);
  }
};

// ==========================================================================
// 6. CUSTOMER REVIEWS & MODAL
// ==========================================================================
function initCustomerReviews() {
  const container = document.querySelector("#customer-reviews-grid");
  if (!container) return;

  const reviews = window.VelouraData?.CUSTOMER_REVIEWS || [];
  container.innerHTML = reviews
    .map(
      (rev) => `
    <div class="review-card">
      <div>
        <div class="review-author">
          <img src="${rev.avatar}" alt="${rev.name}" class="review-avatar" />
          <div>
            <div class="review-name">${rev.name}</div>
            <div class="review-role">${rev.role}</div>
          </div>
        </div>
        <div style="color:var(--gold-primary);font-size:0.85rem;margin-bottom:0.5rem;letter-spacing:2px;">
          ${"★".repeat(rev.rating)}
        </div>
        <p class="review-text">"${rev.comment}"</p>
      </div>
      <div style="font-size:0.75rem;color:var(--text-dim);border-top:1px solid var(--border-subtle);padding-top:0.75rem;display:flex;justify-content:space-between;">
        <span>Favorite: <strong style="color:var(--gold-light);">${rev.dish}</strong></span>
        <span>${rev.date}</span>
      </div>
    </div>
  `
    )
    .join("");
}

window.openReviewModal = function () {
  const modal = document.querySelector("#review-modal");
  if (modal) modal.classList.add("show");
};

window.closeReviewModal = function () {
  const modal = document.querySelector("#review-modal");
  if (modal) modal.classList.remove("show");
};

window.submitCustomerReview = function (e) {
  e.preventDefault();
  const name = document.querySelector("#rev-name")?.value;
  const dish = document.querySelector("#rev-dish")?.value;
  const rating = Number(document.querySelector("#rev-rating")?.value || 5);
  const comment = document.querySelector("#rev-comment")?.value;

  if (name && comment && dish) {
    const newRev = {
      name,
      role: "Verified Diner",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      rating,
      date: "October 2026",
      dish,
      comment
    };

    window.VelouraData?.CUSTOMER_REVIEWS?.unshift(newRev);
    initCustomerReviews();
    closeReviewModal();
    if (window.showToast) window.showToast("Thank you for your review!");
  }
};

// ==========================================================================
// 7. SIMULATED GOOGLE PLACES SEARCH WIDGET
// ==========================================================================
function initGooglePlacesSimulation() {
  const searchInput = document.querySelector("#google-search-input");
  const clearBtn = document.querySelector("#google-search-clear");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    handleGoogleSearch(e.target.value);
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      handleGoogleSearch("");
      searchInput.focus();
    });
  }
}

window.setGoogleSearchQuery = function (query) {
  const searchInput = document.querySelector("#google-search-input");
  if (!searchInput) return;
  searchInput.value = query;

  // Update chip active states
  document.querySelectorAll(".google-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.textContent.trim().toLowerCase() === query.toLowerCase());
  });

  handleGoogleSearch(query);
};

function handleGoogleSearch(query) {
  const q = (query || "").trim().toLowerCase();
  const titleEl = document.querySelector("#google-result-title");
  const snippetEl = document.querySelector("#google-result-snippet");
  const organicCard = document.querySelector("#google-organic-card");
  const kpCard = document.querySelector("#google-knowledge-panel");

  if (!titleEl || !snippetEl) return;

  if (!q) {
    titleEl.textContent = "Google Search Results for Veloura";
    snippetEl.innerHTML = "Type a search query above such as 'Veloura', 'Veloura Gujrat', 'Operating Hours', 'Wagyu Steak', or 'Luxury Dining Ramtali'.";
    return;
  }

  // Visual pulse feedback on search
  if (organicCard) {
    organicCard.style.opacity = "0.7";
    setTimeout(() => (organicCard.style.opacity = "1"), 120);
  }

  if (q.includes("hour") || q.includes("timing") || q.includes("open") || q.includes("close")) {
    titleEl.textContent = "VELOURA — Operating Hours & Timings (10:00 AM – 12:00 AM Midnight)";
    snippetEl.innerHTML = "<strong>Veloura Opening Hours:</strong> Open 7 days a week, <strong>Monday to Sunday from 10:00 AM to 12:00 AM (Midnight)</strong>. Located in Ramtali, Gujrat, Punjab. Dine-in, Takeaway, and Contactless Delivery available.";
    if (kpCard) {
      kpCard.style.borderColor = "#34a853";
      setTimeout(() => (kpCard.style.borderColor = "var(--border-gold)"), 1500);
    }
  } else if (q.includes("steak") || q.includes("wagyu") || q.includes("meat") || q.includes("ribeye")) {
    titleEl.textContent = "Prime Wagyu A5 Ribeye & Charcoal Steaks at VELOURA | Gujrat";
    snippetEl.innerHTML = "Savor the crown jewel of Veloura: Charcoal-seared Australian Wagyu Ribeye A5, bone marrow jus, smoked garlic purée, and edible gold leaf. Served exclusively at Ramtali, Gujrat.";
  } else if (q.includes("map") || q.includes("location") || q.includes("direction") || q.includes("ramtali") || q.includes("address")) {
    titleEl.textContent = "VELOURA Location & Interactive Map | Ramtali, Gujrat, Punjab";
    snippetEl.innerHTML = "Find Veloura easily in Ramtali, Gujrat, Punjab, Pakistan. Pinpointed on Google Maps with ample valet parking, starlit terrace seating, and grand chandelier dining hall.";
  } else if (q.includes("menu") || q.includes("price") || q.includes("dish") || q.includes("food")) {
    titleEl.textContent = "VELOURA Signature Menu & Prices | Starters, Steaks, Fast Food & Desserts";
    snippetEl.innerHTML = "Explore 5 curated culinary categories: Starters, Main Course, Gourmet Fast Food, Desserts, and Botanical Mocktails. Real-time kitchen availability with online takeaway ordering.";
  } else if (q.includes("contact") || q.includes("phone") || q.includes("call") || q.includes("email")) {
    titleEl.textContent = "VELOURA Concierge & Reservations: +92 300 0000000";
    snippetEl.innerHTML = "Reach out to the Veloura host desk at <strong>+92 300 0000000</strong> or concierge email <strong>shahyousaf2004@gmail.com</strong>. Instant WhatsApp & email booking confirmation available.";
  } else {
    titleEl.textContent = `VELOURA — Luxury Dining & Cuisine | Ramtali, Gujrat ("${query}")`;
    snippetEl.innerHTML = `Showing local Google Places results for "<strong>${escapeHtml(query)}</strong>". Experience world-class culinary craftsmanship at Veloura in Ramtali, Gujrat. Rated 4.9/5 stars by over 850 verified diners.`;
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}

