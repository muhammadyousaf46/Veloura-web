// ==========================================================================
// VELOURA — Admin route guard (with inline login)
// Every admin page includes this. If the visitor isn't a logged-in admin,
// it renders a login form directly into #admin-guard-inner instead of
// redirecting to a separate page.
// ==========================================================================

document.addEventListener("DOMContentLoaded", checkAdminAccess);

async function checkAdminAccess() {
  const shell = document.querySelector(".admin-shell");
  const guardBlock = document.querySelector("#admin-guard");
  const inner = document.querySelector("#admin-guard-inner");
  if (!shell || !guardBlock || !inner) return;

  let user = null;
  let profile = null;

  try {
    user = await getCurrentUser();
    if (user) profile = await getProfile(user.id);
  } catch (err) {
    console.error("Admin guard failed to reach Supabase:", err);
    shell.style.display = "none";
    guardBlock.style.display = "flex";
    inner.innerHTML = `
      <hr class="rule" style="margin-left:auto;margin-right:auto;" />
      <h2 style="text-align:center;">Connection Error</h2>
      <p style="text-align:center;max-width:360px;">
        Couldn't reach Supabase. This usually means the URL/key in
        <code>js/supabase-client.js</code> are still placeholders, or wrong.
        Check the browser console for details.
      </p>
      <button class="btn btn-dark" style="margin-top:1rem;" onclick="checkAdminAccess()">Retry</button>
    `;
    return;
  }

  if (user && profile && profile.role === "admin") {
    shell.style.display = "grid";
    guardBlock.style.display = "none";
    document.dispatchEvent(new CustomEvent("admin-authorized", { detail: { user, profile } }));
    return;
  }

  shell.style.display = "none";
  guardBlock.style.display = "flex";

  const message = user
    ? "This account does not have administrator access."
    : "Log in with your administrator account.";

  inner.innerHTML = `
    <hr class="rule" style="margin-left:auto;margin-right:auto;" />
    <h2 style="text-align:center;">Admin Access</h2>
    <p style="text-align:center;">${message}</p>
    <form id="admin-login-form" novalidate style="margin-top:1.5rem;max-width:340px;">
      <div class="field" style="margin-bottom:1rem;">
        <label for="admin-email">Email</label>
        <input id="admin-email" type="email" required />
      </div>
      <div class="field" style="margin-bottom:1rem;">
        <label for="admin-password">Password</label>
        <input id="admin-password" type="password" required />
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;">Log In</button>
      <p class="form-status" role="status" style="text-align:center;margin-top:0.75rem;"></p>
    </form>
  `;

  const form = document.querySelector("#admin-login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.querySelector("#admin-email").value.trim();
    const password = document.querySelector("#admin-password").value;
    const btn = form.querySelector("button[type='submit']");
    const statusEl = form.querySelector(".form-status");

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.innerHTML = `<span class="loader"></span>`;

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await checkAdminAccess();
    } catch (err) {
      console.error(err);
      statusEl.textContent = friendlyError(err);
      statusEl.className = "form-status error";
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}