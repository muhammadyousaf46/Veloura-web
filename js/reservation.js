// ==========================================================================
// VELOURA — Table Reservation Engine
// Guest count pills, date constraints, time slots, and WhatsApp notification modal.
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  initReservationPills();
  initFormValidationAndSubmit();
});

function initReservationPills() {
  // Set minimum date to today
  const dateInput = document.querySelector("#reservation_date");
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.min = today;
    dateInput.value = today;
  }

  // Pre-fill user profile if logged in
  const profile = window.VelouraData?.getUserProfile();
  if (profile) {
    const nameInput = document.querySelector("#name");
    const phoneInput = document.querySelector("#phone");
    const emailInput = document.querySelector("#email");
    if (nameInput && !nameInput.value) nameInput.value = profile.name || "";
    if (phoneInput && !phoneInput.value) phoneInput.value = profile.phone || "";
    if (emailInput && !emailInput.value) emailInput.value = profile.email || "";
  }

  // Guest pills
  const guestPills = document.querySelectorAll("#guest-pills .chip");
  const guestHidden = document.querySelector("#selected-guests");
  guestPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      guestPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      if (guestHidden) guestHidden.value = pill.dataset.guests;
    });
  });

  // Time slot pills
  const timePills = document.querySelectorAll("#time-slot-pills .chip");
  const timeHidden = document.querySelector("#selected-time");
  timePills.forEach((pill) => {
    pill.addEventListener("click", () => {
      timePills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      if (timeHidden) timeHidden.value = pill.dataset.time;
    });
  });
}

function initFormValidationAndSubmit() {
  const form = document.querySelector("#reservation-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.name?.value.trim();
    const phone = form.phone?.value.trim();
    const email = form.email?.value.trim();
    const date = form.reservation_date?.value;
    const time = document.querySelector("#selected-time")?.value || "19:30";
    const guests = Number(document.querySelector("#selected-guests")?.value || 2);
    const seatingZone = form.seating_zone?.value || "Main Dining Hall";
    const specialRequest = form.special_request?.value.trim() || "";

    const statusEl = form.querySelector(".form-status");
    const submitBtn = form.querySelector("#reserve-btn");

    if (!name || !phone || !date) {
      if (statusEl) {
        statusEl.textContent = "Please fill in all required fields (Name, Phone, Date).";
        statusEl.style.color = "#f87171";
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="loader" style="width:16px;height:16px;margin-right:6px;"></span> Securing Table...`;
    }

    const resData = {
      name,
      phone,
      email,
      reservation_date: date,
      reservation_time: time,
      guests,
      seating_zone: seatingZone,
      special_request: specialRequest
    };

    const createdRes = window.VelouraData?.createReservation
      ? window.VelouraData.createReservation(resData)
      : { id: `RES-${Math.floor(100 + Math.random() * 900)}`, ...resData };

    showReservationModal(createdRes);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="calendar-check" style="width:18px;height:18px;"></i> Confirm Table Reservation &rarr;`;
    }
  });
}

function showReservationModal(res) {
  const modal = document.querySelector("#reservation-modal");
  const confirmIdEl = document.querySelector("#res-confirm-id");
  const bubble = document.querySelector("#res-whatsapp-bubble");

  if (!modal) return;

  if (confirmIdEl) confirmIdEl.textContent = `#${res.id}`;

  if (bubble) {
    bubble.innerHTML = `
      <p style="margin-bottom:0.4rem;"><strong>✨ VELOURA TABLE CONFIRMATION ✨</strong></p>
      <p style="margin-bottom:0.4rem;">Dear <strong>${res.name}</strong>, your table reservation is confirmed!</p>
      <p style="margin-bottom:0.4rem;font-size:0.8rem;background:rgba(0,0,0,0.2);padding:0.4rem;border-radius:4px;">
        <strong>Reservation ID:</strong> #${res.id}<br>
        <strong>Date &amp; Time:</strong> ${res.reservation_date} at ${res.reservation_time}<br>
        <strong>Party Size:</strong> ${res.guests} Guests<br>
        <strong>Seating Area:</strong> ${res.seating_zone || "Main Dining Hall"}<br>
        <strong>Location:</strong> Ramtali, Gujrat, Punjab
      </p>
      <p style="font-size:0.75rem;">We look forward to hosting you! Need to modify or have special dietary needs? Call our host desk directly at <strong>+92 300 0000000</strong>.</p>
      <div style="text-align:right;font-size:0.65rem;color:#8696a0;margin-top:0.25rem;">Just now &bull; &#10003;&#10003;</div>
    `;
  }

  modal.classList.add("show");
  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove("show");
  };
  const closeBtn = modal.querySelector(".modal-close-icon");
  if (closeBtn) {
    closeBtn.onclick = () => modal.classList.remove("show");
  }
  if (window.lucide) window.lucide.createIcons();
}
