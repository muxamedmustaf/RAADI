
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#listing-form");
  const message = document.querySelector("#form-message");

  if (!form || !message) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const getValue = (id) =>
      form.querySelector(`#${id}`).value.trim();

    const listing = {
      title: getValue("title"),
      category: getValue("category"),
      price: Number(getValue("price")),
      location: getValue("city"),
      seller_name: getValue("seller_name"),
      description: getValue("description"),
      whatsapp: getValue("phone"),
      status: "pending"
    };

    const button = form.querySelector('button[type="submit"]');

    button.disabled = true;
    button.textContent = "جارٍ إرسال الإعلان...";
    message.textContent = "";

    try {
      const { error } = await raadiDB
        .from("listings")
        .insert([listing]);

      if (error) throw error;

      message.textContent =
        "تم إرسال الإعلان بنجاح، وهو الآن قيد المراجعة.";

      form.reset();

    } catch (error) {
      console.error("RAADI error:", error);

      message.textContent =
        "تعذر إرسال الإعلان. يرجى المحاولة مرة أخرى.";

    } finally {
      button.disabled = false;
      button.textContent = "إرسال الإعلان للمراجعة";
    }
  });
});
