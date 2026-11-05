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

  // دالة لجلب البيانات من Supabase
  async function fetchListings() {
    listingsGrid.innerHTML = "<p style='text-align:center; width:100%;'>جارٍ تحميل الإعلانات...</p>";
    
    // جلب الإعلانات المعتمدة أو المباعة فقط
    const { data, error } = await raadiDB
      .from("listings")
      .select("*")
      .in("status", ["approved", "sold"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("خطأ في جلب الإعلانات:", error);
      listingsGrid.innerHTML = "<p style='text-align:center; color:red; width:100%;'>حدث خطأ أثناء تحميل الإعلانات.</p>";
      return;
    }

    allListings = data || [];
    applyFiltersAndSort();
  }

  // دالة لتصفية وترتيب الإعلانات
  async function applyFiltersAndSort() {
    const nameQuery = searchName.value.trim().toLowerCase();
    const cityQuery = searchCity.value.trim().toLowerCase();
    const sortValue = sortSelect.value;

    // 1. التصفية (البحث)
    let filtered = allListings.filter(item => {
      const matchName = !nameQuery || item.title.toLowerCase().includes(nameQuery) || (item.description && item.description.toLowerCase().includes(nameQuery));
      const matchCity = !cityQuery || (item.location && item.location.toLowerCase().includes(cityQuery));
      return matchName && matchCity;
    });

    // 2. الترتيب
    if (sortValue === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortValue === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortValue === "newest") {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortValue === "nearest") {
      // الترتيب حسب الأقرب (يتطلب موافقة المستخدم على الموقع)
      if ("geolocation" in navigator) {
        searchMessage.textContent = "جارٍ تحديد موقعك للترتيب...";
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            filtered.sort((a, b) => {
              const distA = getDistance(userLat, userLng, a.latitude, a.longitude);
              const distB = getDistance(userLat, userLng, b.latitude, b.longitude);
              return (distA || 99999) - (distB || 99999);
            });
            searchMessage.textContent = "";
            renderListings(filtered);
          },
          (error) => {
            searchMessage.textContent = "تعذر تحديد موقعك. تم الترتيب حسب الأحدث.";
            filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            renderListings(filtered);
          }
        );
        return; // ننتظر جلب الموقع قبل العرض
      } else {
        searchMessage.textContent = "متصفحك لا يدعم تحديد الموقع.";
      }
    }

    searchMessage.textContent = "";
    renderListings(filtered);
  }

  // دالة حساب المسافة بين نقطتين (Haversine formula)
  function getDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // دالة عرض البطاقات في الصفحة
  function renderListings(listings) {
    listingsGrid.innerHTML = "";

    if (listings.length === 0) {
      emptyState.style.display = "flex";
      return;
    }

    emptyState.style.display = "none";

    listings.forEach(item => {
      const isSold = item.status === "sold";
      const imageSrc = item.image_url || "https://via.placeholder.com/300x200?text=No+Image";
      const dateStr = new Date(item.created_at).toLocaleDateString("ar-EG");
      
      const card = document.createElement("div");
      card.className = "listing-card";
      
      card.innerHTML = `
        <div class="listing-image-wrapper">
          <img src="${imageSrc}" alt="${item.title}" class="listing-image" loading="lazy">
          ${isSold ? '<div class="sold-badge">مباع</div>' : ''}
        </div>
        <div class="listing-content">
          <h3 class="listing-title">${item.title}</h3>
          <p class="listing-price">$${item.price}</p>
          <p class="listing-location">📍 ${item.location}</p>
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

  // ربط الأحداث (Events)
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

  // بدء الجلب عند تحميل الصفحة
  fetchListings();
});
