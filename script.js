"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  const categoryLinks = document.querySelectorAll(".category-card");
  const listingSection = document.querySelector("#listings");
  const listingsContainer = document.querySelector(".empty-state");

  categoryLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (listingSection) {
        listingSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  });

  const footerYear = document.querySelector(".site-footer small");
  if (footerYear) {
    footerYear.textContent = `© ${new Date().getFullYear()} RAADI`;
  }

  const comingSoon = document.querySelector(".coming-soon");
  if (comingSoon) comingSoon.hidden = true;

  if (!listingsContainer) return;

  try {
    const { data, error } = await raadiDB
      .from("listings")
      .select("id, title, category, price, location, description, image_url, whatsapp")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) throw error;

    listingsContainer.replaceChildren();

    if (!data || data.length === 0) {
      listingsContainer.textContent = "لا توجد إعلانات معتمدة حاليًا.";
      return;
    }

    data.forEach((listing) => {
      const card = document.createElement("article");
      card.className = "listing-card";

      if (listing.image_url) {
        const image = document.createElement("img");
        image.src = listing.image_url;
        image.alt = listing.title || "إعلان";
        image.loading = "lazy";
        card.appendChild(image);
      }

      const title = document.createElement("h3");
      title.textContent = listing.title || "إعلان";
      card.appendChild(title);

      if (listing.price !== null && listing.price !== undefined) {
        const price = document.createElement("p");
        price.textContent = `${listing.price} دولار`;
        card.appendChild(price);
      }

      if (listing.location) {
        const location = document.createElement("p");
        location.textContent = listing.location;
        card.appendChild(location);
      }

      if (listing.description) {
        const description = document.createElement("p");
        description.textContent = listing.description;
        card.appendChild(description);
      }

      if (listing.whatsapp) {
        const contact = document.createElement("a");
        const phone = String(listing.whatsapp).replace(/[^\d]/g, "");
        contact.href = `https://wa.me/${phone}`;
        contact.target = "_blank";
        contact.rel = "noopener noreferrer";
        contact.textContent = "تواصل عبر واتساب";
        card.appendChild(contact);
      }

      listingsContainer.appendChild(card);
    });
  } catch (error) {
    console.error("RAADI listings error:", error);
    listingsContainer.textContent =
      "تعذر تحميل الإعلانات الآن. يرجى المحاولة لاحقًا.";
  }
});
