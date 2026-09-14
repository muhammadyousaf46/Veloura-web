// ==========================================================================
// VELOURA — Reservation form -> Supabase
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#reservation-form");
  if (!form) return;

  const dateInput = form.querySelector("#reservation_date");
  if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type='submit']");
    const statusEl = form.querySelector(".form-status");

    const payload = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      reservation_date: form.reservation_date.value,
      reservation_time: form.reservation_time.value,
      guests: Number(form.guests.value),
      special_request: form.special_request.value.trim(),
    };

    if (!payload.name || !payload.phone || !payload.reservation_date || !payload.reservation_time || !payload.guests) {
      statusEl.textContent = "Please fill in all required fields.";
      statusEl.className = "form-status error";
      return;
    }

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.innerHTML = `<span class="loader"></span>`;

    try {
      const user = await getCurrentUser();
      const { error } = await supabase.from("reservations").insert({
        ...payload,
        user_id: user ? user.id : null,
      });
      if (error) throw error;

      statusEl.textContent = "Reservation request received — we'll confirm shortly.";
      statusEl.className = "form-status success";
      form.reset();
    } catch (err) {
      console.error("Reservation failed:", err);
      statusEl.textContent = friendlyError(err);
      statusEl.className = "form-status error";
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
});
