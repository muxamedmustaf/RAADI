"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#listing-form");
  const message = document.querySelector("#form-message");
  const imageInput = document.querySelector("#image");
  const imagePreview = document.querySelector("#image-preview");

  if (!form || !message) return;

  // 1. معاينة الصورة قبل الرفع
  if (imageInput && imagePreview) {
    imageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          imagePreview.src = event.target.result;
          imagePreview.hidden = false;
        };
        reader.readAsDataURL(file);
        message.className = "form-message";
        message.textContent = "";
      } else {
        imagePreview.src = "";
        imagePreview.hidden = true;
      }
    });
  }

  // 2. دالة ضغط الصورة (خفيفة ولا تعلق الهاتف)
  async function compressImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1000; // الحد الأقصى 1000 بكسل

          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            const newFile = new File([blob], "compressed_image.jpg", {
              type: "image/jpeg",
              lastModified: Date.now()
            });
            resolve(newFile);
          }, "image/jpeg", 0.8); // جودة 80% (حجم صغير جداً)
        };
      };
    });
  }

  // 3. إرسال النموذج
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const button = form.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    
    button.disabled = true;
    button.textContent = "جارٍ المعالجة والإرسال...";
    message.className = "form-message";
    message.textContent = "جارٍ الاتصال...";

    try {
      let imageUrl = null;
      const file = imageInput.files[0];
      
      if (file) {
        message.textContent = "جارٍ ضغط الصورة...";
        const compressedFile = await compressImage(file);
        const fileName = `img_${Date.now()}.jpg`;

        message.textContent = "جارٍ رفع الصورة إلى Supabase...";
        const { error: uploadError } = await raadiDB.storage
          .from("listing-images")
          .upload(fileName, compressedFile);

        // كشف الأخطاء الشائعة في التخزين
        if (uploadError) {
          if (uploadError.message.includes("Bucket not found")) {
            throw new Error("خطأ: مجلد الصور (listing-images) غير موجود في Supabase.");
          } else if (uploadError.message.includes("policy")) {
            throw new Error("خطأ: لا توجد صلاحيات (Policies) لرفع الصور في Supabase.");
          } else {
            throw new Error("فشل رفع الصورة: " + uploadError.message);
          }
        }

        const { data: urlData } = raadiDB.storage
          .from("listing-images")
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      message.textContent = "جارٍ حفظ الإعلان...";
      const listing = {
        title: document.querySelector("#title").value.trim(),
        category: document.querySelector("#category").value,
        price: Number(document.querySelector("#price").value),
        location: document.querySelector("#city").value.trim(),
        seller_name: document.querySelector("#seller_name").value.trim(),
        description: document.querySelector("#description").value.trim(),
        whatsapp: document.querySelector("#phone").value.trim(),
        image_url: imageUrl,
        status: "pending"
      };

      const { error: dbError } = await raadiDB
        .from("listings")
        .insert([listing]);

      if (dbError) {
        throw new Error("فشل حفظ البيانات: " + dbError.message);
      }

      message.textContent = "تم إرسال إعلانك بنجاح! الإعلان ينتظر موافقة الإدارة.";
      message.classList.add("success");
      
      form.reset();
      if (imagePreview) imagePreview.hidden = true;

    } catch (error) {
      console.error("RAADI listing error:", error);
      message.textContent = error.message;
      message.classList.add("error");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
});
