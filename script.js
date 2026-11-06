// script.js

// دالة جلب وطباعة الإعلانات من Supabase
async function fetchListings(filters = {}) {
    const listingsContainer = document.getElementById('listings-container');
    if (!listingsContainer) {
        console.error("لم يتم العثور على العنصر listings-container في الصفحة");
        return;
    }

    // إظهار مؤشر التحميل
    listingsContainer.innerHTML = '<div class="loading">جاري تحميل الإعلانات...</div>';

    try {
        // التحقق من اتصال Supabase
        if (typeof supabase === 'undefined') {
            throw new Error("مكتبة Supabase غير متصلة أو لم يتم تحميل supabase.js بنجاح");
        }

        // بناء استعلام الجلب للإعلانات المقبولة
        let query = supabase
            .from('listings')
            .select('*')
            .eq('status', 'approved');

        // تطبيق الفلاتر عند وجودها
        if (filters.keyword && filters.keyword.trim() !== '') {
            const term = `%${filters.keyword.trim()}%`;
            query = query.or(`title.ilike.${term},description.ilike.${term}`);
        }

        if (filters.city && filters.city.trim() !== '') {
            query = query.ilike('city', `%${filters.city.trim()}%`);
        }

        if (filters.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }

        // الترتيب حسب الأحدث
        query = query.order('created_at', { ascending: false });

        // تنفيذ الاستعلام
        const { data: listings, error } = await query;

        if (error) {
            console.error('خطأ Supabase أثناء الجلب:', error);
            listingsContainer.innerHTML = '<p class="error-msg">حدث خطأ أثناء تحميل البيانات من الخادم.</p>';
            return;
        }

        console.log("البيانات التي تم جلبها وطباعتها بنجاح:", listings);

        // التعامل مع النتيجة الفارغة
        if (!listings || listings.length === 0) {
            listingsContainer.innerHTML = `
                <div class="no-results">
                    <h3>لا توجد إعلانات للعرض حاليًا</h3>
                    <p>جرب تغيير كلمات البحث أو اسم المدينة.</p>
                </div>
            `;
            return;
        }

        // طباعة الإعلانات في الواجهة
        renderListings(listings);

    } catch (err) {
        console.error('خطأ غير متوقع:', err.message || err);
        listingsContainer.innerHTML = '<p class="error-msg">تعذر الاتصال بقاعدة البيانات.</p>';
    }
}

// دالة رندر وطباعة العناصر داخل بطاقات HTML
function renderListings(listings) {
    const listingsContainer = document.getElementById('listings-container');
    listingsContainer.innerHTML = '';

    listings.forEach(item => {
        // استخراج الصورة المتاحة
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

// تهيئة الأحداث بعد تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // تشغيل الجلب الأولي عند التحميل
    fetchListings();

    // ربط نموذج البحث إن وجد
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const keywordEl = document.getElementById('search-keyword');
            const cityEl = document.getElementById('search-city');
            const categoryEl = document.getElementById('search-category');

            const filters = {
                keyword: keywordEl ? keywordEl.value : '',
                city: cityEl ? cityEl.value : '',
                category: categoryEl ? categoryEl.value : ''
            };

            fetchListings(filters);
        });
    }
});
