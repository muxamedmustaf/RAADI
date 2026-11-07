"use strict";

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function fetchListings(filters = {}) {
    const container = document.getElementById("listings-container");

    if (!container) return;

    container.innerHTML = '<p class="listings-loading">جاري تحميل الإعلانات...</p>';

    try {
        const { data, error } = await raadiDB
            .from("listings")
            .select("*")
            .eq("status", "approved")
            .order("created_at", { ascending: false });

        console.log("RAADI TOTAL:", data?.length);
        console.log("RAADI DATA:", data);
        console.log("RAADI ERROR:", error);

        if (error) {
            console.error("SUPABASE ERROR:", error);
            container.innerHTML =
                `<p class="listings-error">خطأ قاعدة البيانات: ${escapeHTML(error.message)}</p>`;
            return;
        }

        let listings = data || [];

        if (filters.keyword) {
            const word = filters.keyword.toLowerCase();

            listings = listings.filter(item =>
                (item.title || "").toLowerCase().includes(word) ||
                (item.description || "").toLowerCase().includes(word)
            );
        }

        if (filters.city) {
            listings = listings.filter(item =>
                (item.city || "").toLowerCase().includes(
                    filters.city.toLowerCase()
                )
            );
        }

        if (filters.category && filters.category !== "all") {
            listings = listings.filter(item =>
                item.category === filters.category
            );
        }

        if (!listings.length) {
            container.innerHTML =
                '<div class="listings-empty"><h3>لا توجد إعلانات للعرض حالياً</h3></div>';
            return;
        }

        container.innerHTML = `
            <div class="listings-grid">
                ${listings.map(item => {
                    const image = item.image_url ||
                        (Array.isArray(item.images) ? item.images[0] : "");

                    return `
                        <article class="listing-card">

                            <div class="listing-image">
                                ${
                                    image
                                    ? `<img src="${escapeHTML(image)}"
                                           alt="${escapeHTML(item.title || "صورة الإعلان")}"
                                           loading="lazy"
                                           onerror="this.parentElement.innerHTML='<div class=&quot;no-listing-image&quot;>لا توجد صورة</div>'">`
                                    : '<div class="no-listing-image">لا توجد صورة</div>'
                                }
                            </div>

                            <div class="listing-content">

                                <span class="listing-category">
                                    ${escapeHTML(item.category || "إعلان")}
                                </span>

                                <h3 class="listing-title">
                                    ${escapeHTML(item.title || "بدون عنوان")}
                                </h3>

                                <p class="listing-description">
                                    ${escapeHTML(item.description || "")}
                                </p>

                                <div class="listing-price">
                                    ${item.price !== null && item.price !== undefined && item.price !== ""
                                        ? escapeHTML(item.price) + " $"
                                        : "حسب الاتفاق"}
                                </div>

                                <div class="listing-city">
                                    📍 ${escapeHTML(item.city || "غير محدد")}
                                </div>

                                <a class="listing-details"
                                   href="listing.html?id=${encodeURIComponent(item.id)}">
                                    عرض التفاصيل
                                </a>

                            </div>
                        </article>
                    `;
                }).join("")}
            </div>
        `;

    } catch (error) {
        console.error("RAADI ERROR:", error);

        container.innerHTML =
            `<p class="listings-error">حدث خطأ: ${escapeHTML(error.message)}</p>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    fetchListings();

    const form = document.getElementById("search-form");

    if (form) {
        form.addEventListener("submit", event => {
            event.preventDefault();

            fetchListings({
                keyword: document.getElementById("search-keyword").value,
                city: document.getElementById("search-city").value,
                category: document.getElementById("search-category").value
            });
        });
    }
});
