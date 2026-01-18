/**
 * AFRICA IMAGE LOADER
 * Fetches the Africa map image from Strapi and updates the page dynamically
 * Optimized with caching to respect rate limits
 */

(function () {
    'use strict';

    const CACHE_KEY = 'visio_africa_image';
    const CACHE_TTL = 300000; // 5 minutes
    const FALLBACK_IMAGE = '../public/afric/map.jpeg';

    /**
     * Get cached data if valid
     */
    function getCachedData() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;

            if (age < CACHE_TTL) {
                console.log('[Africa] Using cached image (age: ' + Math.round(age / 1000) + 's)');
                return data;
            }
            console.log('[Africa] Cache expired');
            return null;
        } catch (e) {
            console.warn('[Africa] Cache read error:', e);
            return null;
        }
    }

    /**
     * Save data to cache
     */
    function setCachedData(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('[Africa] Cache write error:', e);
        }
    }

    /**
     * Update the image element with new source
     */
    function updateImage(imageUrl) {
        const imgElement = document.getElementById('africa-map-image');
        if (!imgElement) {
            console.warn('[Africa] Image element not found');
            return false;
        }

        imgElement.src = imageUrl;
        // Show image after setting source
        imgElement.onload = () => {
            imgElement.style.opacity = '1';
        };
        // If already in cache/loaded
        if (imgElement.complete) {
            imgElement.style.opacity = '1';
        }

        console.log('[Africa] Image updated to:', imageUrl);
        return true;
    }

    /**
     * Fetch image from Strapi API
     */
    async function fetchFromAPI() {
        // Check if CONFIG is available
        if (typeof CONFIG === 'undefined' || !CONFIG.API_URL) {
            console.warn('[Africa] CONFIG not available, using default API URL');
            return null;
        }

        const url = `${CONFIG.API_URL}/africa?populate=*`;
        console.log('[Africa] Fetching from:', url);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                console.warn('[Africa] API response not OK:', response.status);
                return null;
            }

            const json = await response.json();
            const data = CONFIG.flatten ? CONFIG.flatten(json) : json.data;

            if (!data || !data.image) {
                console.log('[Africa] No image data in response');
                return null;
            }

            // Extract image URL using central CONFIG helper
            return CONFIG.getImageUrl(data.image);

        } catch (error) {
            console.error('[Africa] API fetch error:', error);
            return null;
        }
    }

    /**
     * Initialize Africa image loading
     */
    async function initAfricaImage() {
        // First, check cache
        const cachedUrl = getCachedData();
        if (cachedUrl) {
            updateImage(cachedUrl);
            return;
        }

        // Fetch from API
        const imageUrl = await fetchFromAPI();

        if (imageUrl) {
            setCachedData(imageUrl);
            updateImage(imageUrl);
        } else {
            // Use the fallback image constant since we removed src from HTML
            updateImage(FALLBACK_IMAGE);
            console.log('[Africa] Using fallback static image due to API failure/empty data');
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAfricaImage);
    } else {
        // Small delay to ensure CONFIG is loaded
        setTimeout(initAfricaImage, 100);
    }

})();
