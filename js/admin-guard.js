// ==========================================================================
// VELOURA — Admin route guard
// Every admin page includes this BEFORE its own page script.
// It hides the admin shell until we've confirmed the user is an admin.
// ==========================================================================

(async function guardAdminRoute() {
  const shell = document.querySelector(".admin-shell");
  const guardBlock = document.querySelector("#admin-guard");

  const user = await getCurrentUser();

  if (!user) {
    redirectDenied("Please log in as an administrator to continue.");
    return;
  }

  const profile = await getProfile(user.id);

  if (!profile || profile.role !== "admin") {
    redirectDenied("This area is restricted to Veloura administrators.");
    return;
  }

  // Authorized — reveal the dashboard.
  if (shell) shell.style.display = "grid";
  if (guardBlock) guardBlock.style.display = "none";
  document.dispatchEvent(new CustomEvent("admin-authorized", { detail: { user, profile } }));

  function redirectDenied(message) {
    if (shell) shell.style.display = "none";
    if (guardBlock) {
      guardBlock.style.display = "flex";
      guardBlock.querySelector("p").textContent = message;
    }
  }
})();
