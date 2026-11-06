// script.js
"use strict";

async function fetchListings(filters = {}) {
    const listingsContainer = document.getElementById('listings-container');
    if (!listingsContainer) return;

    listingsContainer.innerHTML = '<div class="loading">جاري تحميل الإعلانات...</div>';

    try {
        // التحقق من وجود كائن الاتصال raadiDB
        if (typeof raadiDB === 'undefined') {
            console.error('خطأ: لم يتم تحميل raadiDB من ملف supabase.js');
            listingsContainer.innerHTML = '<p class="error-msg">خطأ في تهيئة الاتصال بقاعدة البيانات.</p>';
            return;
        }

        // جلب الإعلانات المعتمدة فقط باستخدام raadiDB
        let query = raadiDB
            .from('listings')
            .select('*')
            .eq('status', 'approved');

        // فلترة بالكلمة المفتاحية
        if (filters.keyword && filters.keyword.trim() !== '') {
            const term = `%${filters.keyword.trim()}%`;
            query = query.or(`title.ilike.${term},description.ilike.${term}`);
        }

        // فلترة بالمدينة (بحث مرن غير حساس لحالة الأحرف)
        if (filters.city && filters.city.trim() !== '') {
            query = query.ilike('city', `%${filters.city.trim()}%`);
        }

        // فلترة بالتصنيف
        if (filters.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }

        // الترتيب حسب الأحدث
        query = query.order('created_at', { ascending: false });

        const { data: listings, error } = await query;

        if (error) {
            console.error('خطأ في جلب الإعلانات:', error);
            listingsContainer.innerHTML = '<p class="error-msg">حدث خطأ أثناء تحميل الإعلانات.</p>';
            return;
        }

        if (!listings || listings.length === 0) {
            listingsContainer.innerHTML = `
                <div class="no-results">
                    <h3>لا توجد إعلانات للعرض حاليًا</h3>
                    <p>جرب تغيير كلمات البحث أو المدينة.</p>
                </div>
            `;
            return;
        }

        renderListings(listings);

    } catch (err) {
        console.error('خطأ غير متوقع:', err);
        listingsContainer.innerHTML = '<p class="error-msg">تعذر الاتصال بالخادم.</p>';
    }
}

function renderListings(listings) {
    const listingsContainer = document.getElementById('listings-container');
    listingsContainer.innerHTML = '';

    listings.forEach(item => {
        const imageUrl = item.image_url || (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : 'placeholder.jpg');
        
        const cardHtml = `
            <div class="listing-card">
                <img src="${imageUrl}" alt="${item.title || 'إعلان'}" class="listing-img" onerror="this.src='placeholder.jpg';">
                <div class="listing-info">
                    <span class="category-badge">${item.category || 'عام'}</span>
                    <h4 class="listing-title">${item.title || 'بدون عنوان'}</h4>
                    <p class="listing-price">${item.price ? item.price + ' $' : 'حسب الاتفاق'}</p>
                    <p class="listing-location">📍 ${item.city || 'غير محدد'}</p>
                    <a href="listing.html?id=${item.id}" class="btn-details">عرض التفاصيل</a>
                </div>
            </div>
        `;
        listingsContainer.innerHTML += cardHtml;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchListings();

    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const keyword = document.getElementById('search-keyword')?.value;
            const city = document.getElementById('search-city')?.value;
            const category = document.getElementById('search-category')?.value;

            fetchListings({ keyword, city, category });
        });
    }
});
