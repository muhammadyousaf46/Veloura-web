// ==========================================================================
// VELOURA — Shared site behavior (runs on every page)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initMobileMenu();
  initScrollReveal();
  initCartBadge();
  initNewsletterForm();
});

/* ---- Navbar background on scroll ---- */
function initNavbar() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;
  const onScroll = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
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
  const badge = document.querySelector(".cart-count");
  if (!badge) return;
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("veloura_cart")) || [];
  } catch {
    return [];
  }
}

/* ---- Newsletter subscription -> Supabase ---- */
function initNewsletterForm() {
  const form = document.querySelector("#newsletter-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = form.querySelector("input[type='email']");
    const statusEl = form.querySelector(".form-status");
    const button = form.querySelector("button");
    const email = emailInput.value.trim();

    if (!isValidEmail(email)) {
      statusEl.textContent = "Please enter a valid email address.";
      statusEl.className = "form-status error";
      return;
    }

    button.disabled = true;
    const originalText = button.textContent;
    button.innerHTML = `<span class="loader"></span>`;

    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email });

      if (error) {
        if (error.code === "23505") {
          statusEl.textContent = "You're already subscribed — thank you!";
          statusEl.className = "form-status success";
        } else {
          throw error;
        }
      } else {
        statusEl.textContent = "Subscribed! Welcome to Veloura.";
        statusEl.className = "form-status success";
        emailInput.value = "";
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = friendlyError(err);
      statusEl.className = "form-status error";
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
