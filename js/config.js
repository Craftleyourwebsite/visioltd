const CONFIG = {
    // Determine the base URL based on the environment
    STRAPI_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:1337'
        : 'https://visiostrapi-production.up.railway.app', // Production URL

    get API_URL() {
        return `${this.STRAPI_URL}/api`;
    },

    // Helper to flatten Strapi v4/v5 nested data structure
    flatten(obj) {
        if (!obj) return null;
        if (obj.data) return this.flatten(obj.data);
        if (obj.attributes) {
            const attrs = obj.attributes;
            for (let key in attrs) {
                attrs[key] = this.flatten(attrs[key]);
            }
            return { id: obj.id, ...attrs };
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.flatten(item));
        }
        return obj;
    },

    /**
     * Get a fully qualified URL for an image from Strapi data.
     * Handles Cloudinary (absolute) and Local (relative) URLs.
     */
    getImageUrl(imageData, fallback = 'public/placeholder.jpg') {
        if (!imageData) return fallback;

        // Handle cases where imageData might be the character string URL itself or an object
        const url = typeof imageData === 'string' ? imageData : (imageData.url || null);

        if (!url) return fallback;

        // If it's already an absolute URL (like Cloudinary), return it as is
        if (url.startsWith('http')) {
            return url;
        }

        // Otherwise, prepend the STRAPI_URL
        return `${this.STRAPI_URL}${url}`;
    }
};
