// ==========================================================================
// VELOURA — Home Page Engine: Dynamic Supabase Menu, Realtime Sync & Mobile Nav
// ==========================================================================

(function () {
  let allMenuItems = [];
  let allCategories = [];
  let activeCategory = 'ALL';
  let searchQuery = '';
  let realtimeChannel = null;

  // Luxury Fallback SVG image for dishes without an uploaded image
  const LUXURY_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
      <defs>
        <radialGradient id="lux-grad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#2a2214"/>
          <stop offset="60%" stop-color="#14120e"/>
          <stop offset="100%" stop-color="#0a0907"/>
        </radialGradient>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F3E5AB"/>
          <stop offset="50%" stop-color="#D4AF37"/>
          <stop offset="100%" stop-color="#997A15"/>
        </linearGradient>
      </defs>
      <rect width="600" height="450" fill="url(#lux-grad)"/>
      <circle cx="300" cy="200" r="110" fill="none" stroke="url(#gold-grad)" stroke-width="1.5" stroke-dasharray="4 6" opacity="0.4"/>
      <circle cx="300" cy="200" r="85" fill="#181510" stroke="url(#gold-grad)" stroke-width="1.5" opacity="0.85"/>
      <!-- Cloche / Chef plate icon -->
      <path d="M 260 215 A 40 40 0 0 1 340 215 Z" fill="none" stroke="url(#gold-grad)" stroke-width="2.5"/>
      <line x1="250" y1="218" x2="350" y2="218" stroke="url(#gold-grad)" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="300" cy="172" r="4" fill="url(#gold-grad)"/>
      <text x="300" y="320" fill="url(#gold-grad)" font-family="serif" font-size="18" letter-spacing="6" text-anchor="middle" font-weight="600">VELOURA</text>
      <text x="300" y="342" fill="#8C7F68" font-family="sans-serif" font-size="10" letter-spacing="3" text-anchor="middle">CULINARY CREATION</text>
    </svg>
  `)}`;

  document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initSearchFilter();
    updateCartCounts();
    fetchMenuItems(true);
    setupRealtimeSubscription();

    // Re-check menu whenever tab regains focus (e.g. returning from Admin tab)
    window.addEventListener('focus', () => {
      fetchMenuItems(false);
    });
  });

  // ==========================================================================
  // 1. MOBILE NAVIGATION & HAMBURGER DRAWER
  // ==========================================================================
  function initMobileNav() {
    const toggleBtn = document.getElementById('mobile-nav-toggle');
    const drawer = document.getElementById('mobile-nav-drawer');
    const closeBtn = document.getElementById('mobile-nav-close');
    if (!toggleBtn || !drawer) return;

    function openNav() {
      drawer.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-full');
      drawer.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
      toggleBtn.setAttribute('aria-expanded', 'true');
      toggleBtn.classList.add('is-active');
      document.body.style.overflow = 'hidden';
      if (window.lucide) window.lucide.createIcons();
    }

    function closeNav() {
      drawer.classList.add('opacity-0', 'pointer-events-none', '-translate-y-full');
      drawer.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.classList.remove('is-active');
      document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeNav);
    }

    // Close when clicking any nav link in the mobile drawer
    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeNav);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggleBtn.getAttribute('aria-expanded') === 'true') {
        closeNav();
      }
    });
  }

  // ==========================================================================
  // 2. LIVE SEARCH INPUT
  // ==========================================================================
  function initSearchFilter() {
    const searchInput = document.getElementById('dish-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      searchQuery = (e.target.value || '').trim().toLowerCase();
      renderDishes();
    });

    // Quick clear on Escape inside search
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchQuery = '';
        renderDishes();
      }
    });
  }

  // ==========================================================================
  // 3. FETCH CATEGORIES & MENU ITEMS FROM SUPABASE
  // ==========================================================================
  async function fetchMenuItems(showLoader = true) {
    const loadingEl = document.getElementById('loading-state');
    const gridEl = document.getElementById('menu-grid');
    const emptyEl = document.getElementById('empty-state');
    const syncIndicator = document.getElementById('sync-indicator');

    if (showLoader && loadingEl && gridEl) {
      loadingEl.classList.remove('hidden');
      gridEl.classList.add('hidden');
      if (emptyEl) emptyEl.classList.add('hidden');
    }

    try {
      if (!window.supabase) {
        console.warn('Supabase client not yet initialized.');
        return;
      }

      // Indicate active sync
      if (syncIndicator) {
        syncIndicator.classList.add('animate-pulse');
      }

      // Fetch categories & available menu items in parallel
      const [catRes, itemRes] = await Promise.all([
        window.supabase
          .from('categories')
          .select('id, name, description')
          .order('name'),
        window.supabase
          .from('menu_items')
          .select('*, categories(name)')
          .eq('is_available', true)
          .order('created_at', { ascending: false })
      ]);

      if (catRes.error) throw catRes.error;
      if (itemRes.error) throw itemRes.error;

      allCategories = catRes.data || [];
      allMenuItems = itemRes.data || [];

      // Render categories bar and items grid
      renderCategoryButtons();
      renderDishes();

      // Show live badge updated
      if (syncIndicator) {
        syncIndicator.classList.remove('animate-pulse');
        const countSpan = document.getElementById('dishes-count-badge');
        if (countSpan) countSpan.textContent = `${allMenuItems.length} dishes live`;
      }
    } catch (err) {
      console.error('Error loading dishes from Supabase:', err);
      if (loadingEl) loadingEl.classList.add('hidden');
      if (emptyEl) {
        emptyEl.classList.remove('hidden');
        const msg = document.getElementById('empty-state-msg');
        if (msg) msg.textContent = 'Could not load menu items. Please check your network and refresh.';
      }
    } finally {
      if (loadingEl) loadingEl.classList.add('hidden');
    }
  }

  // Look up a category name from category_id or embedded categories
  function getCategoryName(item) {
    if (item.categories && item.categories.name) return item.categories.name;
    const cat = allCategories.find((c) => c.id === item.category_id);
    return cat ? cat.name : '';
  }

  // ==========================================================================
  // 4. RENDER CATEGORY BUTTONS
  // ==========================================================================
  function renderCategoryButtons() {
    const bar = document.getElementById('category-bar');
    if (!bar) return;

    // Retain or recreate the "All Dishes" button
    bar.innerHTML = '';

    const allBtn = document.createElement('button');
    const isAllActive = activeCategory === 'ALL';
    allBtn.className = isAllActive
      ? 'cat-btn bg-brand-gold text-brand-dark font-bold px-5 py-2.5 rounded-full text-xs tracking-wider uppercase whitespace-nowrap transition-all duration-300 shadow-lg shadow-brand-gold/20 scale-105'
      : 'cat-btn bg-brand-card/90 hover:bg-brand-card hover:border-brand-gold/60 text-brand-cream border border-brand-border px-5 py-2.5 rounded-full text-xs tracking-wider uppercase whitespace-nowrap transition-all duration-300';
    allBtn.setAttribute('data-cat', 'ALL');
    allBtn.innerHTML = `All Dishes <span class="ml-1 opacity-75 font-normal">(${allMenuItems.length})</span>`;
    allBtn.onclick = () => selectCategory('ALL');
    bar.appendChild(allBtn);

    // Render dynamic category pills
    allCategories.forEach((cat) => {
      const itemsInCat = allMenuItems.filter((item) => {
        return item.category_id === cat.id || (item.categories && item.categories.name === cat.name);
      });

      const btn = document.createElement('button');
      const isActive = activeCategory === cat.name;
      btn.className = isActive
        ? 'cat-btn bg-brand-gold text-brand-dark font-bold px-5 py-2.5 rounded-full text-xs tracking-wider uppercase whitespace-nowrap transition-all duration-300 shadow-lg shadow-brand-gold/20 scale-105'
        : 'cat-btn bg-brand-card/90 hover:bg-brand-card hover:border-brand-gold/60 text-brand-cream border border-brand-border px-5 py-2.5 rounded-full text-xs tracking-wider uppercase whitespace-nowrap transition-all duration-300';
      btn.setAttribute('data-cat', cat.name);
      btn.innerHTML = `${cat.name} <span class="ml-1 opacity-60 font-normal">(${itemsInCat.length})</span>`;
      btn.onclick = () => selectCategory(cat.name);
      bar.appendChild(btn);
    });
  }

  // ==========================================================================
  // 5. CATEGORY SELECTION HANDLER
  // ==========================================================================
  window.selectCategory = function (categoryName) {
    activeCategory = categoryName;
    renderCategoryButtons();
    renderDishes();
  };

  // ==========================================================================
  // 6. RENDER DISHES GRID
  // ==========================================================================
  function renderDishes() {
    const gridEl = document.getElementById('menu-grid');
    const emptyEl = document.getElementById('empty-state');
    const emptyMsg = document.getElementById('empty-state-msg');
    const loadingEl = document.getElementById('loading-state');
    if (!gridEl || !emptyEl) return;

    if (loadingEl) loadingEl.classList.add('hidden');

    // Filter by Category
    let filtered = allMenuItems;
    if (activeCategory !== 'ALL') {
      filtered = allMenuItems.filter((item) => {
        const catName = getCategoryName(item);
        return catName.trim().toLowerCase() === activeCategory.trim().toLowerCase();
      });
    }

    // Filter by Search Query
    if (searchQuery) {
      filtered = filtered.filter((item) => {
        const name = (item.name || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const cat = getCategoryName(item).toLowerCase();
        return name.includes(searchQuery) || desc.includes(searchQuery) || cat.includes(searchQuery);
      });
    }

    // Handle Empty State
    if (filtered.length === 0) {
      gridEl.classList.add('hidden');
      emptyEl.classList.remove('hidden');
      if (emptyMsg) {
        if (searchQuery) {
          emptyMsg.textContent = `No dishes found matching "${searchQuery}". Try a different keyword or category.`;
        } else if (activeCategory !== 'ALL') {
          emptyMsg.textContent = `No dishes found under "${activeCategory}". Check other categories or add dishes from the Admin panel.`;
        } else {
          emptyMsg.textContent = 'No menu items available right now. Please add dishes in the Admin panel.';
        }
      }
      return;
    }

    emptyEl.classList.add('hidden');
    gridEl.classList.remove('hidden');

    gridEl.innerHTML = filtered
      .map((item, index) => {
        // Image sanitization & fallback
        let imgSrc = item.image_url ? item.image_url.trim() : '';
        if (!imgSrc || (!imgSrc.startsWith('http') && !imgSrc.startsWith('data:'))) {
          imgSrc = LUXURY_PLACEHOLDER;
        }

        const priceText =
          typeof item.price === 'number'
            ? `Rs ${item.price.toLocaleString()}`
            : `Rs ${Number(item.price || 0).toLocaleString()}`;

        const categoryName = getCategoryName(item);
        const dishName = item.name || 'Unnamed Dish';
        const dishDesc =
          item.description ||
          'Prepared fresh with fine artisanal ingredients and master culinary technique.';

        // Safe escaped string for onclick
        const safeName = dishName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeImg = imgSrc.replace(/'/g, "\\'");

        // Staggered animation delay
        const animDelay = Math.min(index * 60, 400);

        return `
        <article class="group relative bg-brand-card/90 rounded-2xl border border-brand-border/80 hover:border-brand-gold/70 transition-all duration-500 overflow-hidden flex flex-col justify-between hover:-translate-y-2 hover:shadow-[0_20px_45px_-12px_rgba(212,175,55,0.22)] card-animate" style="animation-delay: ${animDelay}ms">
          <!-- CARD IMAGE BOX -->
          <div class="relative overflow-hidden aspect-[4/3] bg-gradient-to-br from-[#1c1813] to-[#0d0d0d]">
            <img 
              src="${imgSrc}" 
              alt="${dishName}" 
              loading="lazy" 
              onerror="this.onerror=null; this.src='${LUXURY_PLACEHOLDER}';" 
              class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
            
            <!-- Vignette bottom gradient -->
            <div class="absolute inset-0 bg-gradient-to-t from-brand-card via-transparent to-black/20 pointer-events-none"></div>

            <!-- BADGES -->
            <div class="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
              ${
                item.is_popular
                  ? `<span class="inline-flex items-center space-x-1 bg-gradient-to-r from-brand-gold to-brand-goldLight text-brand-dark font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full shadow-lg">
                      <i data-lucide="sparkles" class="w-3 h-3"></i>
                      <span>Chef's Choice</span>
                    </span>`
                  : ''
              }
              ${
                item.is_vegetarian
                  ? `<span class="inline-flex items-center space-x-1 bg-emerald-950/85 backdrop-blur-md text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full">
                      <i data-lucide="leaf" class="w-3 h-3 text-emerald-400"></i>
                      <span>Veg</span>
                    </span>`
                  : ''
              }
            </div>

            ${
              categoryName
                ? `<span class="absolute bottom-3 left-3 bg-brand-dark/90 backdrop-blur-md text-brand-gold text-[10px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full border border-brand-gold/30 shadow-md z-10">
                    ${categoryName}
                  </span>`
                : ''
            }
          </div>

          <!-- CARD BODY -->
          <div class="p-6 flex-grow flex flex-col justify-between">
            <div>
              <h3 class="font-serif text-2xl text-brand-cream group-hover:text-brand-gold transition duration-300 font-medium mb-2 leading-tight tracking-tight line-clamp-1">
                ${dishName}
              </h3>
              <p class="text-brand-muted text-xs line-clamp-2 mb-4 font-light leading-relaxed min-h-[2.5rem]">
                ${dishDesc}
              </p>
            </div>

            <!-- CARD FOOTER: PRICE & ADD TO CART -->
            <div class="flex items-center justify-between pt-4 border-t border-brand-border/60">
              <span class="font-serif text-2xl font-bold text-brand-gold tracking-tight">${priceText}</span>
              
              <button 
                onclick="window.handleAddToCart(this, '${item.id}', '${safeName}', ${item.price || 0}, '${safeImg}')" 
                class="add-to-cart-btn bg-brand-dark hover:bg-brand-gold hover:text-brand-dark text-brand-gold border border-brand-gold/50 active:scale-95 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center space-x-1.5 shadow-sm hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                title="Add to order"
              >
                <i data-lucide="plus" class="btn-icon w-3.5 h-3.5 transition-transform"></i>
                <span class="btn-label">Add</span>
              </button>
            </div>
          </div>
        </article>
      `;
      })
      .join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // ==========================================================================
  // 7. REALTIME SYNCHRONIZATION WITH ADMIN PANEL
  // ==========================================================================
  function setupRealtimeSubscription() {
    if (!window.supabase) return;
    if (realtimeChannel) return;

    try {
      realtimeChannel = window.supabase
        .channel('veloura_home_realtime_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'menu_items' },
          (payload) => {
            console.log('Realtime change in menu_items:', payload.eventType);
            fetchMenuItems(false);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'categories' },
          (payload) => {
            console.log('Realtime change in categories:', payload.eventType);
            fetchMenuItems(false);
          }
        )
        .subscribe((status) => {
          console.log('Veloura realtime subscription status:', status);
        });
    } catch (e) {
      console.warn('Realtime subscription not available:', e);
    }
  }

  // ==========================================================================
  // 8. ADD TO CART HANDLER (WITH MICRO-ANIMATION & TOAST)
  // ==========================================================================
  window.handleAddToCart = function (btn, id, name, price, image) {
    // 1. Update localStorage Cart (matches cart.js & checkout.js requirements)
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('veloura_cart') || '[]');
    } catch (e) {
      cart = [];
    }

    const existing = cart.find((i) => i.id === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: id,
        name: name,
        price: Number(price) || 0,
        quantity: 1,
        image: image || null
      });
    }

    localStorage.setItem('veloura_cart', JSON.stringify(cart));

    // 2. Update Cart Count Badges with animation
    updateCartCounts(true);

    // 3. Button Feedback Animation
    if (btn) {
      const originalLabel = btn.querySelector('.btn-label')?.textContent || 'Add';
      const icon = btn.querySelector('.btn-icon');
      const label = btn.querySelector('.btn-label');

      btn.classList.add('bg-brand-gold', 'text-brand-dark');
      if (label) label.textContent = 'Added!';
      if (icon) {
        icon.setAttribute('data-lucide', 'check');
        if (window.lucide) window.lucide.createIcons();
      }

      setTimeout(() => {
        btn.classList.remove('bg-brand-gold', 'text-brand-dark');
        if (label) label.textContent = originalLabel;
        if (icon) {
          icon.setAttribute('data-lucide', 'plus');
          if (window.lucide) window.lucide.createIcons();
        }
      }, 1200);
    }

    // 4. Toast notification
    if (window.showToast) {
      window.showToast(`${name} added to your cart`);
    }
  };

  function updateCartCounts(animate = false) {
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('veloura_cart') || '[]');
    } catch (e) {
      cart = [];
    }

    const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    const badges = [
      document.getElementById('cart-badge-count'),
      ...document.querySelectorAll('.cart-count'),
      ...document.querySelectorAll('.mobile-cart-count')
    ];

    badges.forEach((badge) => {
      if (!badge) return;
      badge.textContent = totalCount;
      if (animate) {
        badge.classList.add('scale-150', 'bg-white', 'text-brand-dark');
        setTimeout(() => {
          badge.classList.remove('scale-150', 'bg-white', 'text-brand-dark');
        }, 300);
      }
    });
  }

  // Expose global refresh function if needed
  window.refreshHomeMenu = () => fetchMenuItems(false);
})();
