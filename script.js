"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  const categoryLinks = document.querySelectorAll(".category-card");
  const searchForm = document.querySelector("#listing-search");
  const searchName = document.querySelector("#search-name");
  const searchCity = document.querySelector("#search-city");
  const sortSelect = document.querySelector("#listing-sort");
  const clearButton = document.querySelector("#clear-search");
  const searchMessage = document.querySelector("#search-message");
  const listingsGrid = document.querySelector("#listings-grid");
  const emptyState = document.querySelector("#listings-empty");
  const footerYear = document.querySelector(".site-footer small");

  let listings = [];
  let selectedCategory = "";

  if (footerYear) {
    footerYear.textContent = `© ${new Date().getFullYear()} RAADI`;
  }

  function showMessage(text) {
    if (searchMessage) searchMessage.textContent = text;
  }

  function addTextElement(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function renderListings() {
    if (!listingsGrid || !emptyState) return;

    const nameQuery = (searchName?.value || "").trim().toLowerCase();
    const cityQuery = (searchCity?.value || "").trim().toLowerCase();

    let results = listings.filter((listing) => {
      const title = String(listing.title || "").toLowerCase();
      const location = String(listing.location || "").toLowerCase();

      const matchesName = !nameQuery || title.includes(nameQuery);
      const matchesCity = !cityQuery || location.includes(cityQuery);
      const matchesCategory =
        !selectedCategory || listing.category === selectedCategory;

      return matchesName && matchesCity && matchesCategory;
    });

    const sortMode = sortSelect?.value || "newest";

    if (sortMode === "price-asc") {
      results.sort((a, b) => Number(a.price ?? Infinity) - Number(b.price ?? Infinity));
    } else if (sortMode === "price-desc") {
      results.sort((a, b) => Number(b.price ?? -Infinity) - Number(a.price ?? -Infinity));
    } else {
      results.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );
    }

    listingsGrid.replaceChildren();

    if (results.length === 0) {
      emptyState.hidden = false;
      showMessage("لم نعثر على إعلانات مطابقة لبحثك.");
      return;
    }

    emptyState.hidden = true;
    showMessage(`عدد الإعلانات: ${results.length}`);

    results.forEach((listing) => {
      const card = document.createElement("article");
      card.className = "listing-card";

      if (listing.image_url) {
        const image = document.createElement("img");
        image.src = listing.image_url;
        image.alt = listing.title || "صورة الإعلان";
        image.loading = "lazy";
        card.appendChild(image);
      }

      addTextElement(card, "h3", "listing-title", listing.title || "إعلان");

      if (listing.price !== null && listing.price !== undefined) {
        addTextElement(card, "p", "listing-price", `${listing.price} دولار`);
      }

      if (listing.location) {
        addTextElement(card, "p", "listing-location", listing.location);
      }

      if (listing.description) {
        addTextElement(card, "p", "listing-description", listing.description);
      }

      if (listing.whatsapp) {
        const phone = String(listing.whatsapp).replace(/[^\d]/g, "");

        if (phone) {
          const contact = document.createElement("a");
          contact.href = `https://wa.me/${phone}`;
          contact.target = "_blank";
          contact.rel = "noopener noreferrer";
          contact.className = "listing-contact";
          contact.textContent = "تواصل عبر واتساب";
          card.appendChild(contact);
        }
      }

      listingsGrid.appendChild(card);
    });
  }

  categoryLinks.forEach((link) => {
    link.addEventListener("click", () => {
      selectedCategory = link.dataset.category || "";
      renderListings();
    });
  });

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      renderListings();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      if (sortSelect.value === "nearest") {
        showMessage(
          "الترتيب حسب الأقرب يحتاج إلى حفظ مواقع الإعلانات من الخريطة أولًا."
        );
        return;
      }

      renderListings();
    });
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      searchForm?.reset();
      selectedCategory = "";
      renderListings();
    });
  }

  if (!listingsGrid || !emptyState) return;

  try {
    const { data, error } = await raadiDB
      .from("listings")
      .select(
        "id, title, category, price, location, description, image_url, whatsapp, created_at"
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) throw error;

    listings = data || [];
    renderListings();
  } catch (error) {
    console.error("RAADI listings error:", error);
    listingsGrid.replaceChildren();
    emptyState.hidden = false;
    showMessage("تعذر تحميل الإعلانات الآن. يرجى المحاولة لاحقًا.");
  }
});
