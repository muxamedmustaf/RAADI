"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const listingsGrid = document.querySelector("#listings-grid");
  const emptyState = document.querySelector("#listings-empty");
  const searchForm = document.querySelector("#listing-search");
  const searchName = document.querySelector("#search-name");
  const searchCity = document.querySelector("#search-city");
  const sortSelect = document.querySelector("#listing-sort");
  const searchMessage = document.querySelector("#search-message");
  const clearBtn = document.querySelector("#clear-search");

  if (!listingsGrid) return;

  let allListings = [];

  async function fetchListings() {
    listingsGrid.innerHTML = "<p style='text-align:center; width:100%;'>جارٍ تحميل الإعلانات...</p>";
    
    const { data, error } = await raadiDB
      .from("listings")
      .select("*")
      .in("status", ["approved", "sold"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("خطأ في جلب الإعلانات:", error);
      listingsGrid.innerHTML = `<p style='text-align:center; color:red; width:100%;'>حدث خطأ: ${error.message}</p>`;
      return;
    }

    allListings = data || [];
    applyFiltersAndSort();
  }

  function applyFiltersAndSort() {
    const nameQuery = searchName.value.trim().toLowerCase();
    const cityQuery = searchCity.value.trim().toLowerCase();
    const sortValue = sortSelect.value;

    let filtered = allListings.filter(item => {
      const matchName = !nameQuery || (item.title && item.title.toLowerCase().includes(nameQuery)) || (item.description && item.description.toLowerCase().includes(nameQuery));
      const matchCity = !cityQuery || (item.location && item.location.toLowerCase().includes(cityQuery));
      return matchName && matchCity;
    });

    if (sortValue === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortValue === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else {
      // افتراضياً (الأحدث) - بما في ذلك خيار "الأقرب" مؤقتاً لأنه لا يوجد خرائط بعد
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    searchMessage.textContent = "";
    renderListings(filtered);
  }

  function renderListings(listings) {
    listingsGrid.innerHTML = "";

    if (listings.length === 0) {
      emptyState.style.display = "flex";
      return;
    }

    emptyState.style.display = "none";

    listings.forEach(item => {
      const isSold = item.status === "sold";
      
      // معالجة الصورة: إذا كان الرابط "LL" أو فارغاً، نضع صورة افتراضية
      let imageSrc = "https://via.placeholder.com/300x200?text=No+Image";
      if (item.image_url && item.image_url.startsWith("http")) {
        imageSrc = item.image_url;
      }

      const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString("ar-EG") : "غير محدد";
      
      const card = document.createElement("div");
      card.className = "listing-card";
      
      card.innerHTML = `
        <div class="listing-image-wrapper">
          <img src="${imageSrc}" alt="${item.title}" class="listing-image" loading="lazy">
          ${isSold ? '<div class="sold-badge">مباع</div>' : ''}
        </div>
        <div class="listing-content">
          <h3 class="listing-title">${item.title || 'بدون عنوان'}</h3>
          <p class="listing-price">$${item.price || 0}</p>
          <p class="listing-location">📍 ${item.location || 'غير محدد'}</p>
          <p class="listing-date">📅 ${dateStr}</p>
          <a href="https://wa.me/${item.whatsapp}?text=مرحباً، أنا مهتم بإعلانك: ${item.title}" 
             target="_blank" class="whatsapp-btn ${isSold ? 'disabled' : ''}">
            ${isSold ? 'تم البيع' : 'تواصل عبر واتساب'}
          </a>
        </div>
      `;
      
      listingsGrid.appendChild(card);
    });
  }

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    applyFiltersAndSort();
  });

  sortSelect.addEventListener("change", () => {
    applyFiltersAndSort();
  });

  clearBtn.addEventListener("click", () => {
    searchForm.reset();
    applyFiltersAndSort();
  });

  fetchListings();
});
