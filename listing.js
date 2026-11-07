"use strict";

async function loadListingDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get("id");

    if (!listingId) {
        window.location.href = "index.html";
        return;
    }

    try {
        const { data: listing, error } = await raadiDB
            .from("listings")
            .select("*")
            .eq("id", listingId)
            .single();

        if (error || !listing) {
            document.getElementById("listing-details-container").innerHTML =
                "<h2>الإعلان غير موجود أو قيد المراجعة.</h2>";
            return;
        }

        document.getElementById("listing-title").textContent =
            listing.title || "";

        document.getElementById("listing-description").textContent =
            listing.description || "";

        document.getElementById("listing-price").textContent =
            listing.price ? `${listing.price} $` : "حسب الاتفاق";

        document.getElementById("listing-city").textContent =
            listing.city || "غير محدد";

        // جمع روابط الصور المتاحة
        const images = [];

        if (listing.image_url) {
            images.push(listing.image_url);
        }

        if (Array.isArray(listing.images)) {
            listing.images.forEach(url => {
                if (typeof url === "string" && url.trim()) {
                    images.push(url);
                }
            });
        }

        const uniqueImages = [...new Set(images)];

        if (!uniqueImages.length) {
            document.getElementById("listing-image").style.display = "none";
            document.getElementById("gallery-count").textContent =
                "لا توجد صورة لهذا الإعلان";
            document.getElementById("previous-image").style.display = "none";
            document.getElementById("next-image").style.display = "none";
            return;
        }

        setupGallery(uniqueImages);

    } catch (error) {
        console.error("خطأ في تحميل الإعلان:", error);
        document.getElementById("listing-details-container").textContent =
            "حدث خطأ أثناء تحميل الإعلان.";
    }
}

function setupGallery(images) {
    const mainImage = document.getElementById("listing-image");
    const thumbnails = document.getElementById("listing-thumbnails");
    const count = document.getElementById("gallery-count");

    const previous = document.getElementById("previous-image");
    const next = document.getElementById("next-image");

    const modal = document.getElementById("image-modal");
    const modalImage = document.getElementById("modal-image");

    let currentIndex = 0;
    let zoom = 1;

    function showImage(index) {
        currentIndex = (index + images.length) % images.length;

        mainImage.src = images[currentIndex];
        count.textContent = `${currentIndex + 1} / ${images.length}`;

        thumbnails.querySelectorAll("img").forEach((img, i) => {
            img.classList.toggle("active", i === currentIndex);
        });

        if (modal.classList.contains("open")) {
            modalImage.src = images[currentIndex];
            resetZoom();
        }
    }

    images.forEach((url, index) => {
        const thumbnail = document.createElement("img");
        thumbnail.src = url;
        thumbnail.alt = "صورة مصغرة";
        thumbnail.className = "thumbnail";

        thumbnail.addEventListener("click", () => showImage(index));

        thumbnails.appendChild(thumbnail);
    });

    previous.addEventListener("click", () => {
        showImage(currentIndex - 1);
    });

    next.addEventListener("click", () => {
        showImage(currentIndex + 1);
    });

    function resetZoom() {
        zoom = 1;
        modalImage.style.transform = "scale(1)";
    }

    function openModal() {
        modal.classList.add("open");
        modalImage.src = images[currentIndex];
        resetZoom();
    }

    function closeModal() {
        modal.classList.remove("open");
        resetZoom();
    }

    mainImage.addEventListener("click", openModal);

    document.getElementById("modal-close").addEventListener(
        "click",
        closeModal
    );

    modal.addEventListener("click", event => {
        if (event.target === modal) closeModal();
    });

    document.getElementById("zoom-in").addEventListener("click", () => {
        zoom = Math.min(zoom + 0.5, 4);
        modalImage.style.transform = `scale(${zoom})`;
    });

    document.getElementById("zoom-out").addEventListener("click", () => {
        zoom = Math.max(zoom - 0.5, 1);
        modalImage.style.transform = `scale(${zoom})`;
    });

    // التكبير والتصغير بإصبعين على الهاتف
    let initialDistance = 0;
    let initialZoom = 1;

    modal.addEventListener("touchstart", event => {
        if (event.touches.length === 2) {
            initialDistance = Math.hypot(
                event.touches[0].clientX - event.touches[1].clientX,
                event.touches[0].clientY - event.touches[1].clientY
            );

            initialZoom = zoom;
        }
    }, { passive: true });

    modal.addEventListener("touchmove", event => {
        if (event.touches.length === 2) {
            event.preventDefault();

            const distance = Math.hypot(
                event.touches[0].clientX - event.touches[1].clientX,
                event.touches[0].clientY - event.touches[1].clientY
            );

            zoom = Math.min(
                4,
                Math.max(1, initialZoom * distance / initialDistance)
            );

            modalImage.style.transform = `scale(${zoom})`;
        }
    }, { passive: false });

    document.addEventListener("keydown", event => {
        if (!modal.classList.contains("open")) return;

        if (event.key === "Escape") closeModal();
        if (event.key === "ArrowLeft") showImage(currentIndex + 1);
        if (event.key === "ArrowRight") showImage(currentIndex - 1);
    });

    showImage(0);

    if (images.length <= 1) {
        previous.style.display = "none";
        next.style.display = "none";
        thumbnails.style.display = "none";
    }
}

document.addEventListener("DOMContentLoaded", loadListingDetails);
