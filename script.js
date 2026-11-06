// script.js
"use strict";

async function fetchListings(filters = {}) {
    const listingsContainer = document.getElementById('listings-container');
    if (!listingsContainer) return;

    listingsContainer.innerHTML = '<div class="loading">جاري تحميل الإعلانات...</div>';

    try {
        // التحقق من تهيئة الاتصال بقاعدة البيانات
        if (typeof raadiDB === 'undefined') {
            console.error('خطأ: لم يتم تعريف raadiDB. تأكد من تحميل ملف supabase.js أولاً.');
            listingsContainer.innerHTML = '<p class="error-msg">خطأ في الاتصال بقاعدة البيانات.</p>';
            return;
        }

        // جلب الإعلانات ذات الحالة approved فقط
        let query = raadiDB
            .from('listings')
            .select('*')
            .eq('status', 'approved');

        // فلترة بالكلمات المفتاحية (عنوان أو وصف)
        if (filters.keyword && filters.keyword.trim() !== '') {
            const term = `%${filters.keyword.trim()}%`;
            query = query.or(`title.ilike.${term},description.ilike.${term}`);
        }

        // فلترة بالمدينة أو المنطقة
        if (filters.city && filters.city.trim() !== '') {
            query = query.ilike('city', `%${filters.city.trim()}%`);
        }

        // فلترة بالتصنيف
        if (filters.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }

        // الترتيب من الأحدث للأقدم
        query = query.order('created_at', { ascending: false });

        const { data: listings, error } = await query;

        if (error) {
            console.error('خطأ في جلب الإعلانات من Supabase:', error);
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
            <div class="listing-card" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #fff;">
                <img src="${imageUrl}" alt="${item.title || 'إعلان'}" class="listing-img" style="width: 100%; height: 180px; object-fit: cover; border-radius: 6px;" onerror="this.src='placeholder.jpg';">
                <div class="listing-info" style="margin-top: 10px;">
                    <span class="category-badge" style="background: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-size: 12px;">${item.category || 'عام'}</span>
                    <h4 class="listing-title" style="margin: 8px 0 5px; font-size: 18px;">${item.title || 'بدون عنوان'}</h4>
                    <p class="listing-price" style="color: #2b6cb0; font-weight: bold; margin: 5px 0;">السعر: ${item.price ? item.price + ' $' : 'حسب الاتفاق'}</p>
                    <p class="listing-location" style="color: #666; margin: 5px 0;">📍 المدينة: ${item.city || 'غير محدد'}</p>
                    <a href="listing.html?id=${item.id}" class="btn-details" style="display: inline-block; margin-top: 8px; background: #319795; color: #fff; padding: 6px 12px; border-radius: 4px; text-decoration: none;">عرض التفاصيل</a>
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
