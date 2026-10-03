// ==========================================================================
// VELOURA — Visual Gallery Controller with Unsplash Photography & Lightbox
// ==========================================================================

let activeGalleryCategory = "All";
let currentLightboxIdx = 0;
let displayedGalleryItems = [];

document.addEventListener("DOMContentLoaded", initGalleryPage);

function initGalleryPage() {
  const collection = window.VelouraData?.GALLERY_COLLECTION || [];
  displayedGalleryItems = collection;

  renderGalleryChips(collection);
  renderGalleryGrid();
}

function renderGalleryChips(collection) {
  const container = document.querySelector("#gallery-chips");
  if (!container) return;

  const categories = ["All", ...new Set(collection.map((item) => item.category))];

  container.innerHTML = categories
    .map(
      (cat) => `
    <button class="chip ${cat === activeGalleryCategory ? "active" : ""}" onclick="filterGallery('${cat}')">
      <span>${cat}</span>
    </button>
  `
    )
    .join("");
}

window.filterGallery = function (cat) {
  activeGalleryCategory = cat;
  const collection = window.VelouraData?.GALLERY_COLLECTION || [];

  renderGalleryChips(collection);

  if (cat === "All") {
    displayedGalleryItems = collection;
  } else {
    displayedGalleryItems = collection.filter((i) => i.category === cat);
  }

  renderGalleryGrid();
};

function renderGalleryGrid() {
  const grid = document.querySelector("#gallery-grid");
  if (!grid) return;

  grid.innerHTML = displayedGalleryItems
    .map(
      (item, index) => `
    <div class="gallery-card" onclick="openLightbox(${index})" title="${item.name}">
      <img src="${item.image}" alt="${item.name}" loading="lazy" />
      <div class="gallery-overlay">
        <span class="badge badge-chef" style="align-self:flex-start;margin-bottom:0.4rem;">${item.category}</span>
        <h4 style="font-size:1.15rem;color:var(--text-primary);">${item.name}</h4>
        <p style="font-size:0.75rem;color:var(--gold-light);">${item.caption}</p>
      </div>
    </div>
  `
    )
    .join("");

  if (window.lucide) window.lucide.createIcons();
}

window.openLightbox = function (index) {
  currentLightboxIdx = index;
  const modal = document.querySelector("#lightbox-modal");
  const imgEl = document.querySelector("#lightbox-img");
  const titleEl = document.querySelector("#lightbox-title");
  const captionEl = document.querySelector("#lightbox-caption");

  if (!modal || !displayedGalleryItems[index]) return;

  const item = displayedGalleryItems[index];
  if (imgEl) imgEl.src = item.image;
  if (titleEl) titleEl.textContent = item.name;
  if (captionEl) captionEl.textContent = item.caption;

  modal.classList.add("show");
  document.body.style.overflow = "hidden";
  if (window.lucide) window.lucide.createIcons();
};

window.closeLightbox = function () {
  const modal = document.querySelector("#lightbox-modal");
  if (modal) modal.classList.remove("show");
  document.body.style.overflow = "";
};

window.nextLightboxImage = function () {
  currentLightboxIdx = (currentLightboxIdx + 1) % displayedGalleryItems.length;
  openLightbox(currentLightboxIdx);
};

window.prevLightboxImage = function () {
  currentLightboxIdx = (currentLightboxIdx - 1 + displayedGalleryItems.length) % displayedGalleryItems.length;
  openLightbox(currentLightboxIdx);
};

// Close on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") nextLightboxImage();
  if (e.key === "ArrowLeft") prevLightboxImage();
});
