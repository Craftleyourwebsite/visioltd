/**
 * SOCIAL LOADER
 * Fetches social posts from Strapi and renders them into #social-container
 * Uses ContentLoader for intelligent caching and skeleton loading
 */

(function () {
    'use strict';

    // Cache key for this content type
    const CONTENT_TYPE = 'social';

    /**
     * Load Social content
     */
    async function loadSocial() {
        const container = document.getElementById('social-container');
        if (!container) return;

        const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

        // Check if ContentLoader is available
        if (typeof ContentLoader !== 'undefined') {
            // Use the unified ContentLoader
            await ContentLoader.load({
                type: CONTENT_TYPE,
                url: `${CONFIG.API_URL}/socials?locale=${lang}&populate=*&sort=date:desc`,
                containerId: 'social-container',
                renderFn: createSocialCard,
                skeletonCount: 6,
                onSuccess: (items, source) => {
                    console.log(`[Social] Loaded ${items.length} items from ${source}`);
                    renderCategories(items);
                    initializeIsotope(container);
                },
                onError: (error) => {
                    console.error('[Social] Load error:', error);
                    renderCategories([]);
                }
            });
        } else {
            // Fallback to direct loading
            await loadSocialDirect();
        }
    }

    /**
     * Direct loading fallback (without ContentLoader)
     */
    async function loadSocialDirect() {
        const container = document.getElementById('social-container');
        if (!container) return;

        // Show skeleton loading
        container.innerHTML = generateSkeletons(6);

        const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

        try {
            const response = await fetch(`${CONFIG.API_URL}/socials?locale=${lang}&populate=*&sort=date:desc`, {
                mode: 'cors',
                credentials: 'omit'
            });

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}`);
            }

            const json = await response.json();
            const socialItems = CONFIG.flatten(json);

            if (!Array.isArray(socialItems) || socialItems.length === 0) {
                container.innerHTML = `
                    <div class="content-empty" style="text-align: center; padding: 40px; width: 100%;">
                        <h3>No items found</h3>
                        <p>Stay tuned for updates.</p>
                    </div>`;
                renderCategories([]);
                return;
            }

            container.innerHTML = '';
            socialItems.forEach(item => {
                container.insertAdjacentHTML('beforeend', createSocialCard(item));
            });

            renderCategories(socialItems);
            initializeIsotope(container);

        } catch (error) {
            console.error('Error loading social items:', error);
            container.innerHTML = `
                <div class="content-error" style="text-align: center; padding: 40px; width: 100%;">
                    <h3>Error loading content</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()">Retry</button>
                </div>`;
        }
    }

    /**
     * Generate skeleton loading cards
     */
    function generateSkeletons(count) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="hentry skeleton-card">
                    <div class="hentry-wrap">
                        <div class="featured-image">
                            <div class="skeleton-image content-skeleton" style="width:100%;height:0;padding-bottom:66.67%;"></div>
                        </div>
                        <div class="hentry-middle">
                            <header class="entry-header">
                                <h2 class="entry-title">
                                    <span class="skeleton-title content-skeleton" style="display:block;height:24px;width:80%;margin:15px auto 0;"></span>
                                </h2>
                            </header>
                        </div>
                    </div>
                </div>
            `;
        }
        return html;
    }

    /**
     * Initialize Isotope for filtering
     */
    function initializeIsotope(container) {
        if (typeof imagesLoaded !== 'undefined' && typeof Isotope !== 'undefined') {
            imagesLoaded(container, function () {
                const iso = new Isotope(container, {
                    itemSelector: '.hentry:not(.skeleton-card)',
                    layoutMode: 'fitRows'
                });

                const filters = document.getElementById('filters');
                if (filters) {
                    // Remove existing listeners to prevent duplicates
                    const newFilters = filters.cloneNode(true);
                    filters.parentNode.replaceChild(newFilters, filters);

                    newFilters.addEventListener('click', function (e) {
                        const link = e.target.closest('a');
                        if (!link) return;
                        e.preventDefault();

                        newFilters.querySelectorAll('li').forEach(li => li.classList.remove('current'));
                        link.parentElement.classList.add('current');

                        const filterValue = link.getAttribute('data-filter');
                        iso.arrange({ filter: filterValue });
                    });
                }
            });
        }
    }

    /**
     * Render category filters
     */
    function renderCategories(items) {
        const container = document.getElementById('filters');
        if (!container) return;

        container.innerHTML = '';

        const categoryMap = new Map();

        items.forEach(item => {
            let cats = [];
            const rawCat = item.category || item.categorie || item.categories;

            if (Array.isArray(rawCat)) {
                cats = rawCat;
            } else if (rawCat) {
                cats = [rawCat];
            }

            cats.forEach(cat => {
                let name = '';
                let slug = '';

                if (typeof cat === 'string') {
                    name = cat;
                    slug = cat.toLowerCase().replace(/\s+/g, '-');
                } else if (typeof cat === 'object' && cat !== null) {
                    name = cat.name || cat.Name || cat.title || cat.Title || 'Untitled';
                    slug = cat.slug || name.toLowerCase().replace(/\s+/g, '-');
                }

                if (name) {
                    categoryMap.set(slug, name);
                }
            });
        });

        // Add "All"
        const allLi = document.createElement('li');
        allLi.className = 'current';
        allLi.innerHTML = `<a data-filter="*" href="#">all</a>`;
        container.appendChild(allLi);

        categoryMap.forEach((name, slug) => {
            const li = document.createElement('li');
            li.innerHTML = `<a data-filter=".${slug}" href="#">${name}</a>`;
            container.appendChild(li);
        });
    }

    /**
     * Create social card HTML
     */
    function createSocialCard(item) {
        const imgUrl = CONFIG.getImageUrl(item.main_image, '../public/section/1.jpeg');

        let cats = [];
        const rawCat = item.category || item.categorie || item.categories;
        if (Array.isArray(rawCat)) cats = rawCat;
        else if (rawCat) cats = [rawCat];

        const categoryClasses = cats.map(cat => {
            const slug = typeof cat === 'string' ? cat : (cat.slug || cat.name || cat.Name || '');
            return slug.toLowerCase().replace(/\s+/g, '-');
        }).join(' ');

        return `
        <div id="post-${item.id}" class="post-${item.id} portfolio hentry ${categoryClasses}">
            <div class="hentry-wrap">
                <div class="featured-image">
                    <a href="../socialopen/?social=${item.slug}">
                        <img src="${imgUrl}" class="attachment-arkiz_image_size_4 size-arkiz_image_size_4 wp-post-image" alt="${item.title}" loading="lazy" />
                    </a>
                </div>
                <div class="hentry-middle">
                    <header class="entry-header">
                        <h2 class="entry-title">
                            <a href="../socialopen/?social=${item.slug}">${item.title}</a>
                        </h2>
                    </header>
                </div>
            </div>
        </div>
        `;
    }

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', loadSocial);

    // Re-load on language change
    window.addEventListener('languageChanged', () => {
        // Clear loading state to allow refresh
        if (typeof ContentLoader !== 'undefined') {
            ContentLoader.LoadingState.resetAll();
        }
        loadSocial();
    });

})();
