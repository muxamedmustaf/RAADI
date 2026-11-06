// script.js

// جلب وتصفية الإعلانات من Supabase
async function fetchListings(filters = {}) {
    const listingsContainer = document.getElementById('listings-container');
    if (!listingsContainer) return;

    // إظهار مؤشر التحميل
    listingsContainer.innerHTML = '<div class="loading">جاري تحميل الإعلانات...</div>';

    try {
        // البدء بجلب الإعلانات ذات الحالة المقبولة (approved) فقط
        let query = supabase
            .from('listings')
            .select('*')
            .eq('status', 'approved'); // مطابقة الحالة تماماً مع قاعدة البيانات

        // فلترة بالكلمة المفتاحية (عنوان الإعلان أو الوصف)
        if (filters.keyword && filters.keyword.trim() !== '') {
            const term = `%${filters.keyword.trim()}%`;
            query = query.or(`title.ilike.${term},description.ilike.${term}`);
        }

        // فلترة بالمدينة (استخدام ilike لتجنب مشاكل حالة الأحرف)
        if (filters.city && filters.city.trim() !== '') {
            query = query.ilike('city', `%${filters.city.trim()}%`);
        }

        // فلترة بالفئة (Category)
        if (filters.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }

        // ترتيب النتائج (الأحدث أولاً)
        query = query.order('created_at', { ascending: false });

        const { data: listings, error } = await query;

        if (error) {
            console.error('خطأ في جلب الإعلانات من Supabase:', error);
            listingsContainer.innerHTML = '<p class="error-msg">حدث خطأ أثناء تحميل البيانات.</p>';
            return;
        }

        // في حال عدم وجود نتائج
        if (!listings || listings.length === 0) {
            listingsContainer.innerHTML = `
                <div class="no-results">
                    <img src="search-icon.svg" alt="بحث" width="50">
                    <h3>لا توجد إعلانات للعرض حاليًا</h3>
                    <p>جرب تغيير كلمات البحث أو المدينة.</p>
                </div>
            `;
            return;
        }

        // عرض الإعلانات في الواجهة
        renderListings(listings);

    } catch (err) {
        console.error('خطأ غير متوقع:', err);
    }
}

// دالة بناء بطاقات الإعلانات
function renderListings(listings) {
    const listingsContainer = document.getElementById('listings-container');
    listingsContainer.innerHTML = '';

    listings.forEach(item => {
        const imageUrl = item.image_url || item.images?.[0] || 'placeholder.jpg';
        
        const cardHtml = `
            <div class="listing-card">
                <img src="${imageUrl}" alt="${item.title}" class="listing-img">
                <div class="listing-info">
                    <span class="category-badge">${item.category || 'عام'}</span>
                    <h4 class="listing-title">${item.title}</h4>
                    <p class="listing-price">${item.price ? item.price + ' $' : 'حسب الاتفاق'}</p>
                    <p class="listing-location">📍 ${item.city || 'غير محدد'}</p>
                    <a href="listing.html?id=${item.id}" class="btn-details">عرض التفاصيل</a>
                </div>
            </div>
        `;
        listingsContainer.innerHTML += cardHtml;
    });
}

// تشغيل الجلب عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    fetchListings();

    // ربط نموذج البحث
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
