// ==========================================================================
// VELOURA — Admin: Contact Messages
// ==========================================================================

document.addEventListener("admin-authorized", loadMessages);

async function loadMessages() {
  const tbody = document.querySelector("#messages-table-body");
  tbody.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;

  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="6">Failed to load messages.</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No messages yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (m) => `
    <tr>
      <td>${m.name}</td>
      <td>${m.email}</td>
      <td style="max-width:320px;">${m.message}</td>
      <td>${new Date(m.created_at).toLocaleDateString()}</td>
      <td><span class="status-pill ${m.is_read ? "completed" : "pending"}">${m.is_read ? "Read" : "Unread"}</span></td>
      <td class="admin-actions">
        ${!m.is_read ? `<button data-read="${m.id}">Mark Read</button>` : ""}
        <button data-delete="${m.id}">Delete</button>
      </td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-read]").forEach((btn) =>
    btn.addEventListener("click", () => markAsRead(btn.dataset.read))
  );
  tbody.querySelectorAll("[data-delete]").forEach((btn) =>
    btn.addEventListener("click", () => deleteMessage(btn.dataset.delete))
  );
}

async function markAsRead(id) {
  try {
    const { error } = await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
    if (error) throw error;
    loadMessages();
  } catch (err) {
    console.error(err);
    showToast(friendlyError(err), "error");
  }
}

async function deleteMessage(id) {
  if (!confirm("Delete this message?")) return;
  try {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) throw error;
    showToast("Message deleted");
    loadMessages();
  } catch (err) {
    console.error(err);
    showToast(friendlyError(err), "error");
  }
}
