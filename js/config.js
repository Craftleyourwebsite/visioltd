const CONFIG = {
    STRAPI_URL: 'http://localhost:1337', // Update this with your actual Strapi URL
    API_URL: 'http://localhost:1337/api',
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
    }
};
