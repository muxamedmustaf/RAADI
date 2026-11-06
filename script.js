
"use strict";

async function fetchListings(filters = {}) {
    const container = document.getElementById("listings-container");

    if (!container) return;

    container.innerHTML = "جاري تحميل الإعلانات...";

    try {
        const { data, error } = await raadiDB
            .from("listings")
            .select("*")
            .eq("status", "approved")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("SUPABASE ERROR:", error);
            container.innerHTML =
                `<p>خطأ قاعدة البيانات: ${error.message}</p>`;
            return;
        }

        console.log("RAADI LISTINGS:", data);

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
                "<h3>لا توجد إعلانات للعرض حالياً</h3>";
            return;
        }

        container.innerHTML = listings.map(item => {
            const image = item.image_url ||
                (Array.isArray(item.images) ? item.images[0] : "") ||
                "placeholder.jpg";

            return `
                <article class="listing-card">
                    <img src="${image}" alt="إعلان"
                         style="width:100%;height:180px;object-fit:cover"
                         onerror="this.style.display='none'">

                    <h3>${item.title || "بدون عنوان"}</h3>
                    <p>${item.description || ""}</p>
                    <p>السعر: ${item.price || "حسب الاتفاق"} $</p>
                    <p>المدينة: ${item.city || "غير محدد"}</p>

                    <a href="listing.html?id=${item.id}">
                        عرض التفاصيل
                    </a>
                </article>
            `;
        }).join("");

    } catch (error) {
        console.error("RAADI ERROR:", error);
        container.innerHTML =
            `<p>حدث خطأ: ${error.message}</p>`;
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
