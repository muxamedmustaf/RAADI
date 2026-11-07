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

    container.innerHTML = '<p>جاري تحميل الإعلانات...</p>';

    try {
        const { data, error } = await raadiDB
            .from("listings")
            .select("*")
            .eq("status", "approved")
            .order("created_at", { ascending: false });

        if (error) {
            container.innerHTML =
                `<p style="color:red">خطأ Supabase: ${escapeHTML(error.message)}</p>`;
            return;
        }

        let listings = data || [];

        const originalCount = listings.length;

        if (filters.keyword) {
            const word = filters.keyword.toLowerCase();
            listings = listings.filter(item =>
                (item.title || "").toLowerCase().includes(word) ||
                (item.description || "").toLowerCase().includes(word)
            );
        }

        if (filters.city) {
            listings = listings.filter(item =>
                (item.city || "").toLowerCase().includes(filters.city.toLowerCase())
            );
        }

        if (filters.category && filters.category !== "all") {
            listings = listings.filter(item =>
                item.category === filters.category
            );
        }

        container.innerHTML = `
            <div style="background:#e6fffa;padding:12px;margin-bottom:15px;border-radius:8px;color:#087b55">
                عدد الإعلانات المستلمة من Supabase: ${originalCount}
                <br>
                عدد الإعلانات بعد البحث: ${listings.length}
            </div>
            ${
                listings.length
                ? listings.map(item => {
                    const image = item.image_url ||
                        (Array.isArray(item.images) ? item.images[0] : "");

                    return `
                        <article class="listing-card">
                            <div class="listing-image">
                                ${image
                                    ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(item.title || "صورة الإعلان")}" loading="lazy">`
                                    : '<div class="no-listing-image">لا توجد صورة</div>'
                                }
                            </div>
                            <div class="listing-content">
                                <span class="listing-category">${escapeHTML(item.category || "إعلان")}</span>
                                <h3>${escapeHTML(item.title || "بدون عنوان")}</h3>
                                <p>${escapeHTML(item.description || "")}</p>
                                <div class="listing-price">
                                    ${item.price !== null && item.price !== undefined && item.price !== ""
                                        ? escapeHTML(item.price) + " $"
                                        : "حسب الاتفاق"}
                                </div>
                                <div class="listing-city">📍 ${escapeHTML(item.city || "غير محدد")}</div>
                                <a class="listing-details" href="listing.html?id=${encodeURIComponent(item.id)}">عرض التفاصيل</a>
                            </div>
                        </article>
                    `;
                }).join("")
                : '<p>لا توجد إعلانات للعرض حالياً</p>'
            }
        `;

    } catch (error) {
        container.innerHTML =
            `<p style="color:red">حدث خطأ: ${escapeHTML(error.message)}</p>`;
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
