// ==========================================================================
// VELOURA — Admin: Newsletter Subscribers
// ==========================================================================

document.addEventListener("admin-authorized", loadSubscribers);

async function loadSubscribers() {
  const tbody = document.querySelector("#newsletter-table-body");
  tbody.innerHTML = `<tr><td colspan="2">Loading...</td></tr>`;

  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="2">Failed to load subscribers.</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="2">No subscribers yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((s) => `<tr><td>${s.email}</td><td>${new Date(s.created_at).toLocaleDateString()}</td></tr>`)
    .join("");
}
