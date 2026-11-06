// listing.js

async function loadListingDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('id');

    if (!listingId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const { data: listing, error } = await supabase
            .from('listings')
            .select('*')
            .eq('id', listingId)
            .single();

        if (error || !listing) {
            console.error('لم يتم العثور على الإعلان:', error);
            document.getElementById('listing-details-container').innerHTML = '<h2>الإعلان غير موجود أو قيد المراجعة.</h2>';
            return;
        }

        // عرض تفاصيل الإعلان
        document.getElementById('listing-title').textContent = listing.title;
        document.getElementById('listing-description').textContent = listing.description;
        document.getElementById('listing-price').textContent = listing.price ? `${listing.price} $` : 'حسب الاتفاق';
        document.getElementById('listing-city').textContent = listing.city || 'غير محدد';
        document.getElementById('listing-image').src = listing.image_url || listing.images?.[0] || 'placeholder.jpg';

    } catch (err) {
        console.error('خطأ في تحميل تفاصيل الإعلان:', err);
    }
}

document.addEventListener('DOMContentLoaded', loadListingDetails);
