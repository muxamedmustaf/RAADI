
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#listing-form");
  const message = document.querySelector("#form-message");
  const imageInput = document.querySelector("#image");
  const imagePreview = document.querySelector("#image-preview");

  if (!form || !message) return;

  // Image preview
  if (imageInput && imagePreview) {
    imageInput.addEventListener("change", () => {
      const file = imageInput.files[0];

      if (!file) {
        imagePreview.hidden = true;
        imagePreview.removeAttribute("src");
        return;
      }

      if (!file.type.startsWith("image/")) {
        message.textContent = "يرجى اختيار ملف صورة صحيح.";
        imageInput.value = "";
        imagePreview.hidden = true;
        return;
      }

      imagePreview.src = URL.createObjectURL(file);
      imagePreview.hidden = false;
      message.textContent = "";
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const getValue = (id) =>
      form.querySelector(`#${id}`).value.trim();

    const file = imageInput?.files[0] || null;

    if (file) {
      if (!file.type.startsWith("image/")) {
        message.textContent = "يرجى اختيار صورة صحيحة.";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        message.textContent =
          "حجم الصورة يجب ألا يتجاوز 5 ميغابايت.";
        return;
      }
    }

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
      // Upload image
      if (file) {
        const extension = file.name.split(".").pop();
        const fileName =
          `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

        const { error: uploadError } = await raadiDB
          .storage
          .from("listing-images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: imageData } = raadiDB
          .storage
          .from("listing-images")
          .getPublicUrl(fileName);

        listing.image_url = imageData.publicUrl;
      }

      // Save listing
      const { error } = await raadiDB
        .from("listings")
        .insert([listing]);

      if (error) throw error;

      message.textContent =
        "تم إرسال الإعلان بنجاح، وهو الآن قيد المراجعة.";

      form.reset();

      if (imagePreview) {
        imagePreview.hidden = true;
        imagePreview.removeAttribute("src");
      }

    } catch (error) {
      console.error("RAADI error:", error);

      message.textContent =
        "تعذر إرسال الإعلان. تحقق من إعدادات التخزين وحاول مرة أخرى.";

    } finally {
      button.disabled = false;
      button.textContent = "إرسال الإعلان للمراجعة";
    }
  });
});
