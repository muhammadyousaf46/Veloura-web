// ==========================================================================
// VELOURA — Authentication (Supabase Auth)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  initLoginForm();
  initSignupForm();
  initForgotPassword();
  initLogoutButtons();
});

function initLoginForm() {
  const form = document.querySelector("#login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;
    const btn = form.querySelector("button[type='submit']");
    const errorEl = form.querySelector(".form-status");

    if (!email || !password) {
      errorEl.textContent = "Please enter your email and password.";
      errorEl.className = "form-status error";
      return;
    }

    setLoading(btn, true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = "index.html";
    } catch (err) {
      console.error(err);
      errorEl.textContent = friendlyError(err);
      errorEl.className = "form-status error";
    } finally {
      setLoading(btn, false);
    }
  });
}

function initSignupForm() {
  const form = document.querySelector("#signup-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = form.full_name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const btn = form.querySelector("button[type='submit']");
    const errorEl = form.querySelector(".form-status");

    if (!fullName) {
      errorEl.textContent = "Please enter your name.";
      errorEl.className = "form-status error";
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEl.textContent = "Please enter a valid email.";
      errorEl.className = "form-status error";
      return;
    }
    if (password.length < 6) {
      errorEl.textContent = "Password must be at least 6 characters.";
      errorEl.className = "form-status error";
      return;
    }

    setLoading(btn, true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      errorEl.textContent = "Account created! Check your email to confirm, then log in.";
      errorEl.className = "form-status success";
      form.reset();
    } catch (err) {
      console.error(err);
      errorEl.textContent = friendlyError(err);
      errorEl.className = "form-status error";
    } finally {
      setLoading(btn, false);
    }
  });
}

function initForgotPassword() {
  const link = document.querySelector("#forgot-password-link");
  const form = document.querySelector("#login-form");
  if (!link || !form) return;

  link.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const errorEl = form.querySelector(".form-status");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEl.textContent = "Enter your email above first, then click 'Forgot password?'";
      errorEl.className = "form-status error";
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/login.html",
      });
      if (error) throw error;
      errorEl.textContent = "Password reset link sent — check your email.";
      errorEl.className = "form-status success";
    } catch (err) {
      console.error(err);
      errorEl.textContent = friendlyError(err);
      errorEl.className = "form-status error";
    }
  });
}

function initLogoutButtons() {
  document.querySelectorAll("[data-logout]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      // Admin sidebar logout: reload so the inline admin-guard login form reappears.
      // Any other [data-logout] button: send to the public login page.
      window.location.href = btn.dataset.logout === "admin" ? "index.html" : "../login.html";
    });
  });
}

function setLoading(btn, isLoading) {
  if (isLoading) {
    btn.dataset.originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = `<span class="loader"></span>`;
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || btn.textContent;
  }
}
