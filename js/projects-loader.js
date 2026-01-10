/**
 * PROJECTS LOADER
 * Fetches projects from Strapi and renders them into #projects-container
 * Uses ContentLoader for intelligent caching and skeleton loading
 */

(function () {
    'use strict';

    // Cache configuration
    const CONTENT_TYPE = 'projects';
    const GRID_CACHE_KEY = 'cached_strapi_projects_grid';
    const GRID_CACHE_TTL = 300000; // 5 minutes

    /**
     * Load Projects content
     */
    async function loadProjects() {
        const container = document.getElementById('projects-container');
        if (!container) return;

        const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

        // --- STATIC CATEGORIES HANDLING (Always run) ---
        updateCategoryVisibility(lang);

        // Listen for language changes
        window.addEventListener('languageChanged', (e) => {
            updateCategoryVisibility(e.detail.language);
        });

        // Fix: Allow clicking "All Categories" title to reset filter
        setupAllCategoriesClick(container);

        // Check if ContentLoader is available
        if (typeof ContentLoader !== 'undefined') {
            // Use the unified ContentLoader
            await ContentLoader.load({
                type: CONTENT_TYPE,
                url: `${CONFIG.API_URL}/projects?locale=${lang}&populate=*&pagination[limit]=100`,
                containerId: 'projects-container',
                renderFn: createProjectCard,
                skeletonCount: 9,
                onSuccess: (items, source) => {
                    console.log(`[Projects] Loaded ${items.length} items from ${source}`);
                },
                onError: (error) => {
                    console.error('[Projects] Load error:', error);
                }
            });
        } else {
            // Fallback to direct loading with cache
            await loadProjectsDirect();
        }
    }

    /**
     * Update category visibility based on language
     */
    function updateCategoryVisibility(language) {
        const enContainer = document.getElementById('cat-en-container');
        const frContainer = document.getElementById('cat-fr-container');
        if (enContainer && frContainer) {
            if (language.toLowerCase() === 'fr') {
                enContainer.style.display = 'none';
                frContainer.style.display = 'grid';
            } else {
                enContainer.style.display = 'grid';
                frContainer.style.display = 'none';
            }
        }
    }

    /**
     * Setup click handler for "All Categories" title
     */
    function setupAllCategoriesClick(container) {
        const allCatTitle = document.querySelector('.all-categories-title');
        if (allCatTitle) {
            allCatTitle.replaceWith(allCatTitle.cloneNode(true));
            const newTitle = document.querySelector('.all-categories-title');
            newTitle.addEventListener('click', () => {
                filterProjectsBy('All');
                if (container) container.scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    /**
     * Direct loading fallback with built-in cache
     */
    async function loadProjectsDirect() {
        const container = document.getElementById('projects-container');
        if (!container) return;

        const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();
        const cacheKey = `${GRID_CACHE_KEY}_${lang}`;

        // Show skeleton loading
        container.innerHTML = generateSkeletons(9);

        let projects = [];
        let useCache = false;

        // 1. Try Cache
        try {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                const now = Date.now();
                if (now - parsed.timestamp < GRID_CACHE_TTL) {
                    projects = parsed.data;
                    useCache = true;
                    console.log(`[Projects] Using cache (expires in ${Math.round((GRID_CACHE_TTL - (now - parsed.timestamp)) / 1000)}s)`);
                }
            }
        } catch (e) {
            console.warn('[Projects] Cache parse error');
        }

        // 2. Fetch if no valid cache
        if (!useCache) {
            try {
                console.log('[Projects] Fetching fresh data...');
                const response = await fetch(`${CONFIG.API_URL}/projects?locale=${lang}&populate=*&pagination[limit]=100`, {
                    mode: 'cors',
                    credentials: 'omit'
                });

                if (!response.ok) {
                    throw new Error(`HTTP Error ${response.status}`);
                }

                const json = await response.json();
                const fetchedProjects = CONFIG.flatten(json);

                if (Array.isArray(fetchedProjects)) {
                    projects = fetchedProjects;
                    // Save to Cache
                    localStorage.setItem(cacheKey, JSON.stringify({
                        timestamp: Date.now(),
                        data: projects
                    }));
                }
            } catch (error) {
                console.error('[Projects] Fetch error:', error);

                // Fallback: Try to use expired cache
                const cachedData = localStorage.getItem(cacheKey);
                if (cachedData) {
                    try {
                        projects = JSON.parse(cachedData).data;
                        console.log('[Projects] Using expired cache as fallback');
                    } catch (e) { }
                }

                if (projects.length === 0) {
                    container.innerHTML = `
                        <div class="content-error" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                            <h3>Connection Error</h3>
                            <p>Could not load projects. Please check your connection.</p>
                            <button onclick="location.reload()">Retry</button>
                        </div>`;
                    return;
                }
            }
        }

        // 3. Render
        if (!Array.isArray(projects) || projects.length === 0) {
            container.innerHTML = `
                <div class="content-empty" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <h3>No projects found</h3>
                    <p>Public projects will appear here once published.</p>
                </div>`;
            return;
        }

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        projects.forEach(project => {
            const div = document.createElement('div');
            div.innerHTML = createProjectCard(project).trim();
            if (div.firstChild) {
                fragment.appendChild(div.firstChild);
            }
        });
        container.appendChild(fragment);
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
     * Create project card HTML
     */
    function createProjectCard(project) {
        const imgUrl = CONFIG.getImageUrl(project.thumbnail, 'public/section/1.jpeg');

        const categories = Array.isArray(project.categories) ? project.categories : (project.category ? [project.category] : []);
        const categoryList = categories.map(c => c.name);

        // Clean categories string for attribute
        const catAttr = JSON.stringify(categoryList).replace(/"/g, '&quot;');

        // LINK FIX: Point to ../projectview/index.html
        const projectUrl = `../projectview/index.html?project=${project.slug}`;

        return `
            <div class="hentry" data-categories="${catAttr}">
                <div class="hentry-wrap">
                    <div class="featured-image">
                        <a href="${projectUrl}">
                            <img src="${imgUrl}" alt="${project.title}" loading="lazy">
                        </a>
                    </div>
                    <div class="hentry-middle">
                        <header class="entry-header">
                            <h2 class="entry-title">
                                <a href="${projectUrl}">${project.title}</a>
                            </h2>
                        </header>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Filter projects by category
     */
    function filterProjectsBy(catName) {
        const items = document.querySelectorAll('#projects-container .hentry:not(.skeleton-card)');
        items.forEach(item => {
            let cats = [];
            try {
                cats = JSON.parse(item.getAttribute('data-categories').replace(/&quot;/g, '"') || '[]');
            } catch (e) {
                console.warn('Error parsing categories:', e);
            }

            if (catName === 'All' || cats.includes(catName)) {
                item.classList.remove('is-hidden');
                item.style.display = '';
            } else {
                item.classList.add('is-hidden');
                item.style.display = 'none';
            }
        });
    }

    // Expose for category filtering
    window.filterProjectsBy = filterProjectsBy;

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', loadProjects);

    // Re-load on language change
    window.addEventListener('languageChanged', () => {
        // Clear loading state to allow refresh
        if (typeof ContentLoader !== 'undefined') {
            ContentLoader.LoadingState.resetAll();
        }
        loadProjects();
    });

})();
