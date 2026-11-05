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
        // التحقق من أن الملف صورة
        if (!file.type.startsWith("image/")) {
          message.textContent = "يرجى اختيار ملف صورة صحيح.";
          message.className = "form-message error";
          imageInput.value = "";
          imagePreview.hidden = true;
          return;
        }

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

  // دالة لضغط وتصغير الصورة تلقائياً
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

          // الحد الأقصى للأبعاد (800 بكسل)
          const MAX_SIZE = 800;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // تحويل الصورة إلى JPG لتقليل الحجم
          canvas.toBlob((blob) => {
            // تحويل الـ Blob إلى File
            const newFile = new File([blob], "compressed_image.jpg", {
              type: "image/jpeg",
              lastModified: Date.now()
            });
            resolve(newFile);
          }, "image/jpeg", 0.8); // جودة 80%
        };
      };
    });
  }

  // 2. إرسال النموذج ورفع الصورة
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const button = form.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    
    button.disabled = true;
    button.textContent = "جارٍ معالجة الصورة والإرسال...";
    message.className = "form-message";
    message.textContent = "";

    try {
      let imageUrl = null;

      // أ. رفع الصورة إن وجدت
      const file = imageInput.files[0];
      if (file) {
        // ضغط الصورة قبل الرفع
        const compressedFile = await compressImage(file);
        
        // إنشاء اسم فريد
        const fileName = `img_${Date.now()}.jpg`;

        const { error: uploadError } = await raadiDB.storage
          .from("listing-images")
          .upload(fileName, compressedFile);

        if (uploadError) throw uploadError;

        // الحصول على الرابط العام
        const { data: urlData } = raadiDB.storage
          .from("listing-images")
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      // ب. تجهيز بيانات الإعلان
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

      // ج. إدخال البيانات
      const { error: dbError } = await raadiDB
        .from("listings")
        .insert([listing]);

      if (dbError) throw dbError;

      // د. النجاح
      message.textContent = "تم إرسال إعلانك بنجاح! الإعلان ينتظر موافقة الإدارة.";
      message.classList.add("success");
      
      form.reset();
      if (imagePreview) imagePreview.hidden = true;

    } catch (error) {
      console.error("RAADI listing error:", error);
      message.textContent = "تعذر إرسال الإعلان: " + (error.message || "يرجى المحاولة مرة أخرى.");
      message.classList.add("error");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
});
