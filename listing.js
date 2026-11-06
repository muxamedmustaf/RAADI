// listing.js
"use strict";

async function loadListingDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('id');

    if (!listingId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const { data: listing, error } = await raadiDB
            .from('listings')
            .select('*')
            .eq('id', listingId)
            .single();

        if (error || !listing) {
            console.error('لم يتم العثور على الإعلان:', error);
            const container = document.getElementById('listing-details-container');
            if (container) container.innerHTML = '<h2>الإعلان غير موجود أو قيد المراجعة.</h2>';
            return;
        }

        if (document.getElementById('listing-title')) {
            document.getElementById('listing-title').textContent = listing.title;
        }
        if (document.getElementById('listing-description')) {
            document.getElementById('listing-description').textContent = listing.description;
        }
        if (document.getElementById('listing-price')) {
            document.getElementById('listing-price').textContent = listing.price ? `${listing.price} $` : 'حسب الاتفاق';
        }
        if (document.getElementById('listing-city')) {
            document.getElementById('listing-city').textContent = listing.city || 'غير محدد';
        }
        if (document.getElementById('listing-image')) {
            document.getElementById('listing-image').src = listing.image_url || (Array.isArray(listing.images) && listing.images.length > 0 ? listing.images[0] : 'placeholder.jpg');
        }

    } catch (err) {
        console.error('خطأ في تحميل تفاصيل الإعلان:', err);
    }
}

document.addEventListener('DOMContentLoaded', loadListingDetails);
