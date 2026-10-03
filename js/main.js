// ==========================================================================
// VELOURA — Shared Site Behavior & Cart State Synchronization
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initMobileMenu();
  initScrollReveal();
  initCartBadge();
  initRoleBadge();
  initNewsletterForm();
  initHeroParallax();

  if (window.lucide) {
    window.lucide.createIcons();
  }
});

window.addEventListener("veloura-role-changed", () => {
  if (typeof initRoleBadge === "function") initRoleBadge();
});

/* ---- Subtle hero background parallax on mouse move (desktop only) ---- */
function initHeroParallax() {
  const hero = document.querySelector("#hero");
  const bg = document.querySelector("#hero-bg");
  if (!hero || !bg) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    bg.style.transform = `translate(${x * -14}px, ${y * -14}px) scale(1.04)`;
  });

  hero.addEventListener("mouseleave", () => {
    bg.style.transform = "translate(0, 0) scale(1)";
  });
}

/* ---- Navbar background on scroll ---- */
function initNavbar() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;
  const onScroll = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 30);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---- Mobile hamburger menu ---- */
function initMobileMenu() {
  const hamburger = document.querySelector(".hamburger");
  const mobileMenu = document.querySelector(".mobile-menu");
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("open");
    hamburger.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      document.body.style.overflow = "";
    });
  });
}

/* ---- Fade-in on scroll for elements with .reveal ---- */
function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((el) => observer.observe(el));
}

/* ---- Cart item-count badge (reads from localStorage cart) ---- */
function initCartBadge() {
  const badges = document.querySelectorAll(".cart-count");
  if (!badges.length) return;
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

  badges.forEach((badge) => {
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  });
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("veloura_cart")) || [];
  } catch {
    return [];
  }
}

// Make globally available
window.getCart = getCart;
window.initCartBadge = initCartBadge;

/* ---- Newsletter subscription -> Supabase / Local ---- */
function initNewsletterForm() {
  const form = document.querySelector("#newsletter-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = form.querySelector("input[type='email']");
    const statusEl = form.querySelector(".form-status");
    const button = form.querySelector("button");
    const email = emailInput?.value.trim();

    if (!isValidEmail(email)) {
      if (statusEl) {
        statusEl.textContent = "Please enter a valid email address.";
        statusEl.className = "form-status error";
      }
      return;
    }

    if (button) button.disabled = true;

    try {
      if (window.supabase) {
        await window.supabase.from("newsletter_subscribers").insert({ email });
      }

      // Also persist locally for admin offline view
      try {
        const localSubs = JSON.parse(localStorage.getItem("veloura_newsletter_subscribers") || "[]");
        if (!localSubs.some((s) => s.email === email)) {
          localSubs.unshift({ email, created_at: new Date().toISOString() });
          localStorage.setItem("veloura_newsletter_subscribers", JSON.stringify(localSubs));
        }
      } catch (e) {}

      if (statusEl) {
        statusEl.textContent = "Subscribed! Welcome to the Veloura Epicurean Circle.";
        statusEl.className = "form-status success";
      }
      if (emailInput) emailInput.value = "";
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = "Thank you for subscribing!";
        statusEl.className = "form-status success";
      }
    } finally {
      if (button) button.disabled = false;
    }
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---- Global Role Badge Indicator (Top announcement bar) ---- */
function initRoleBadge() {
  const roleText = document.querySelector("#role-display-text");
  if (!roleText) return;

  const currentRole = window.VelouraData?.getCurrentRole ? window.VelouraData.getCurrentRole() : "registered";

  if (currentRole === "admin") {
    roleText.textContent = "Role: Admin";
    if (roleText.parentElement) {
      roleText.parentElement.style.borderColor = "var(--gold-primary)";
    }
  } else if (currentRole === "registered") {
    roleText.textContent = "Role: Patron (Muhammad)";
    if (roleText.parentElement) {
      roleText.parentElement.style.borderColor = "";
    }
  } else {
    roleText.textContent = "Role: Guest";
    if (roleText.parentElement) {
      roleText.parentElement.style.borderColor = "";
    }
  }
}

window.initRoleBadge = initRoleBadge;

