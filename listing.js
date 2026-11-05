
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#listing-form");
  const message = document.querySelector("#form-message");

  if (!form || !message) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const title = form.querySelector("#title").value.trim();
    const price = Number(form.querySelector("#price").value);
    const city = form.querySelector("#city").value.trim();
    const phone = form.querySelector("#phone").value.trim();

    if (!title || !city || !phone || price < 0) {
      message.textContent = "يرجى التأكد من صحة البيانات.";
      return;
    }

    message.textContent =
      "تم التحقق من البيانات. سيتم تفعيل إرسال الإعلانات بعد ربط قاعدة البيانات.";

    message.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });
});
