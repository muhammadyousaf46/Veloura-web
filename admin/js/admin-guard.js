// ==========================================================================
// VELOURA — Admin Route Guard & Authentication Controller
// Access is granted ONLY if the user is authenticated via Supabase AND has
// role = 'admin' in the profiles table. The 1-click demo button is only for
// local development (when Supabase is not yet configured).
// ==========================================================================

document.addEventListener("DOMContentLoaded", checkAdminAccess);

async function checkAdminAccess() {
  const shell = document.querySelector(".admin-shell");
  const guardBlock = document.querySelector("#admin-guard");
  const inner = document.querySelector("#admin-guard-inner");
  if (!shell || !guardBlock || !inner) return;

  // 1. PRIMARY CHECK — Always verify via Supabase auth first
  let user = null;
  let profile = null;
  let supabaseAvailable = false;

  try {
    if (window.getCurrentUser) {
      supabaseAvailable = true;
      user = await window.getCurrentUser();
      if (user && window.getProfile) {
        profile = await window.getProfile(user.id);
      }
    }
  } catch (e) {
    console.warn("Supabase user check failed:", e);
    supabaseAvailable = false;
  }

  // Grant access if Supabase confirms admin role
  if (user && profile && profile.role === "admin") {
    grantAccess(shell, guardBlock, profile);
    return;
  }

  // 2. FALLBACK — Only allow demo mode if Supabase is NOT configured
  // (i.e., this is a local dev environment without real credentials)
  if (!supabaseAvailable) {
    const localRole = window.VelouraData?.getCurrentRole ? window.VelouraData.getCurrentRole() : null;
    if (localRole === "admin") {
      grantAccess(shell, guardBlock, { role: "admin", email: "demo@veloura.local", name: "Demo Administrator" });
      return;
    }
  }

  // Otherwise show Admin Login with 1-Click Demo Login option
  shell.style.display = "none";
  guardBlock.style.display = "flex";

  inner.innerHTML = `
    <div style="font-size:1.8rem;color:var(--gold-primary);margin-bottom:0.5rem;font-family:var(--font-display);font-weight:700;">VELOURA ADMIN</div>
    <div class="rule center"></div>
    <h2 style="font-size:1.4rem;text-align:center;margin-bottom:0.5rem;">Management Portal</h2>
    <p style="text-align:center;font-size:0.85rem;color:var(--text-muted);margin-bottom:1.5rem;">
      Sign in with your admin credentials to manage the restaurant.
    </p>

    <form id="admin-login-form" novalidate style="text-align:left;">
      <div class="field" style="margin-bottom:1rem;">
        <label for="admin-email">Admin Email</label>
        <input id="admin-email" type="email" autocomplete="email" placeholder="admin@example.com" required />
      </div>
      <div class="field" style="margin-bottom:1rem;">
        <label for="admin-password">Password</label>
        <input id="admin-password" type="password" placeholder="••••••••" autocomplete="current-password" required />
      </div>
      <button type="submit" id="admin-login-submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:0.75rem;">
        Sign In to Admin
      </button>
      <p class="form-status" role="status" style="text-align:center;margin-top:0.75rem;font-size:0.82rem;"></p>
    </form>

    <div style="margin-top:1.5rem;border-top:1px solid var(--border-subtle);padding-top:1rem;">
      <a href="../index.html" style="font-size:0.82rem;color:var(--gold-primary);text-decoration:underline;">&larr; Return to Customer Site</a>
    </div>
  `;

  // Attach credential login listener — verifies via Supabase auth + role check
  const form = document.querySelector("#admin-login-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.querySelector("#admin-email")?.value.trim();
    const password = document.querySelector("#admin-password")?.value;
    const statusEl = form.querySelector(".form-status");
    const submitBtn = document.querySelector("#admin-login-submit");

    if (!email || !password) {
      if (statusEl) {
        statusEl.textContent = "Please enter your email and password.";
        statusEl.className = "form-status error";
      }
      return;
    }

    // Disable button and show loading state
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Signing in…"; }
    if (statusEl) { statusEl.textContent = ""; statusEl.className = "form-status"; }

    try {
      // Step 1: Sign in via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      // Step 2: Verify this user has admin role in profiles table
      const profile = await window.getProfile(authData.user.id);
      if (!profile || profile.role !== "admin") {
        await supabase.auth.signOut(); // sign out immediately — not an admin
        throw new Error("Access denied. This account does not have admin privileges.");
      }

      // Step 3: Grant access
      grantAccess(shell, guardBlock, profile);
      if (window.showToast) window.showToast(`Welcome back, ${profile.full_name || "Admin"}!`);

    } catch (err) {
      console.error("Admin login error:", err);
      const msg = err.message?.toLowerCase().includes("invalid login")
        ? "Incorrect email or password."
        : (err.message || "Sign in failed. Please try again.");
      if (statusEl) { statusEl.textContent = msg; statusEl.className = "form-status error"; }
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Sign In to Admin"; }
    }
  });
}

function grantAccess(shell, guardBlock, profile) {
  shell.style.display = "grid";
  guardBlock.style.display = "none";
  document.dispatchEvent(new CustomEvent("admin-authorized", { detail: { profile } }));

  // Attach signout listener
  document.querySelectorAll("[data-logout='admin']").forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      if (window.VelouraData?.setCurrentRole) {
        window.VelouraData.setCurrentRole("registered");
      }
      if (window.supabase?.auth?.signOut) {
        window.supabase.auth.signOut();
      }
      window.location.href = "../index.html";
    };
  });
}
