
"use strict";

// RAADI - Main interface interactions

document.addEventListener("DOMContentLoaded", () => {
  const categoryLinks = document.querySelectorAll(
    ".category-card"
  );

  const listingSection = document.querySelector("#listings");

  // Navigate to listings when a category is selected.
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

  // Update the footer year automatically.
  const footerYear = document.querySelector(
    ".site-footer small"
  );

  if (footerYear) {
    footerYear.textContent =
      `© ${new Date().getFullYear()} RAADI`;
  }

  // Show a friendly message for unavailable features.
  const comingSoon = document.querySelector(".coming-soon");

  if (comingSoon) {
    comingSoon.title = "ستتوفر الإعلانات قريبًا";
  }
});
