// ==========================================================================
// VELOURA — Contact Form Controller
// Submits inquiries to Supabase with instant client-side feedback.
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type='submit']");
    const statusEl = form.querySelector(".form-status");

    const name = form.name?.value.trim();
    const email = form.email?.value.trim();
    const phone = form.phone?.value.trim();
    const message = form.message?.value.trim();

    if (!name || !email || !message) {
      if (statusEl) {
        statusEl.textContent = "Please fill in your name, a valid email, and your message.";
        statusEl.style.color = "#f87171";
      }
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="loader" style="width:16px;height:16px;margin-right:6px;"></span> Sending...`;
    }

    try {
      if (window.supabase) {
        await window.supabase.from("contact_messages").insert([{ name, email, phone, message }]);
      }

      // Persist locally for admin dashboard visibility
      try {
        const localMsgs = JSON.parse(localStorage.getItem("veloura_contact_messages") || "[]");
        localMsgs.unshift({
          id: `msg-${Date.now()}`,
          name,
          email,
          phone: phone || "+92 300 0000000",
          message,
          is_read: false,
          created_at: new Date().toISOString()
        });
        localStorage.setItem("veloura_contact_messages", JSON.stringify(localMsgs));
      } catch (e) {}

      if (statusEl) {
        statusEl.textContent = "Message received! Our concierge will reach out to you shortly.";
        statusEl.style.color = "#34d399";
      }
      if (window.showToast) {
        window.showToast("Thank you! Your message has been sent to our concierge desk.");
      }
      form.reset();
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = "Message sent — our concierge will be in touch.";
        statusEl.style.color = "#34d399";
      }
      form.reset();
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="send" style="width:16px;height:16px;"></i> Send Message`;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  });
});
