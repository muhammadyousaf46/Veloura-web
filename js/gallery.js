// ==========================================================================
// VELOURA — Gallery: category filter + lightbox
// ==========================================================================

const GALLERY_ITEMS = [
  { name: "Signature Plating", category: "Food" },
  { name: "Herb-Crusted Rack", category: "Food" },
  { name: "Dining Room", category: "Interior" },
  { name: "Bar Area", category: "Interior" },
  { name: "Head Chef at Work", category: "Chef" },
  { name: "Kitchen Pass", category: "Chef" },
  { name: "Private Dinner", category: "Events" },
  { name: "Anniversary Table", category: "Events" },
  { name: "Evening Ambiance", category: "Dining" },
  { name: "Window Seating", category: "Dining" },
  { name: "Dessert Course", category: "Food" },
  { name: "Entrance", category: "Interior" },
];
// IMAGE PLACEHOLDER: replace this array-driven grid with real photos —
// add an `image: "images/gallery/xxx.jpg"` field per item and render an
// <img> instead of the text label in galleryItemTemplate() below.

let currentFilter = "All";
let currentIndex = 0;
let filteredItems = [...GALLERY_ITEMS];

document.addEventListener("DOMContentLoaded", initGallery);

function initGallery() {
  const grid = document.querySelector("#gallery-grid");
  if (!grid) return;

  const categories = ["All", ...new Set(GALLERY_ITEMS.map((i) => i.category))];
  const chipWrap = document.querySelector("#gallery-chips");
  chipWrap.innerHTML = categories
    .map((c) => `<button class="chip ${c === currentFilter ? "active" : ""}" data-cat="${c}">${c}</button>`)
    .join("");

  chipWrap.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      currentFilter = chip.dataset.cat;
      chipWrap.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      renderGalleryGrid();
    });
  });

  renderGalleryGrid();
  initLightbox();
}

function renderGalleryGrid() {
  const grid = document.querySelector("#gallery-grid");
  filteredItems = currentFilter === "All" ? [...GALLERY_ITEMS] : GALLERY_ITEMS.filter((i) => i.category === currentFilter);

  grid.innerHTML = filteredItems
    .map((item, idx) => `<div class="gallery-item reveal is-visible" data-index="${idx}"><span>${item.name}</span></div>`)
    .join("");

  grid.querySelectorAll(".gallery-item").forEach((el) => {
    el.addEventListener("click", () => openLightbox(Number(el.dataset.index)));
  });
}

function initLightbox() {
  const lightbox = document.querySelector("#lightbox");
  document.querySelector("#lightbox-close").addEventListener("click", closeLightbox);
  document.querySelector("#lightbox-prev").addEventListener("click", () => navigateLightbox(-1));
  document.querySelector("#lightbox-next").addEventListener("click", () => navigateLightbox(1));
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") navigateLightbox(1);
    if (e.key === "ArrowLeft") navigateLightbox(-1);
  });
}

function openLightbox(index) {
  currentIndex = index;
  updateLightboxContent();
  document.querySelector("#lightbox").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  document.querySelector("#lightbox").classList.remove("open");
  document.body.style.overflow = "";
}

function navigateLightbox(delta) {
  currentIndex = (currentIndex + delta + filteredItems.length) % filteredItems.length;
  updateLightboxContent();
}

function updateLightboxContent() {
  const item = filteredItems[currentIndex];
  document.querySelector("#lightbox-caption").textContent = `${item.name} — ${item.category}`;
}
