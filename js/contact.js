// ==========================================================================
// VELOURA — Contact form -> Supabase
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type='submit']");
    const statusEl = form.querySelector(".form-status");

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      message: form.message.value.trim(),
    };

    if (!payload.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) || !payload.message) {
      statusEl.textContent = "Please fill in your name, a valid email, and a message.";
      statusEl.className = "form-status error";
      return;
    }

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.innerHTML = `<span class="loader"></span>`;

    try {
      const { error } = await supabase.from("contact_messages").insert(payload);
      if (error) throw error;
      statusEl.textContent = "Message sent — we'll get back to you soon.";
      statusEl.className = "form-status success";
      form.reset();
    } catch (err) {
      console.error("Contact form failed:", err);
      statusEl.textContent = friendlyError(err);
      statusEl.className = "form-status error";
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
});
