/**
 * PROJECTS LOADER
 * Fetches projects from Strapi and renders them into #projects-container
 * Uses robust fallback loading with caching
 */

(function () {
    'use strict';

    // Cache configuration
    const CONTENT_TYPE = 'projects';
    const GRID_CACHE_KEY = 'cached_strapi_projects_grid';
    const GRID_CACHE_TTL = 300000; // 5 minutes

    // Track if load has been initiated to prevent double-loading
    let loadInitiated = false;
    let loadCompleted = false;

    /**
     * Load Projects content
     */
    async function loadProjects() {
        const container = document.getElementById('projects-container');
        if (!container) {
            console.log('[Projects] Container not found');
            return;
        }

        // Prevent double-loading during same page session
        if (loadInitiated && !loadCompleted) {
            console.log('[Projects] Load already in progress, skipping');
            return;
        }

        // If already completed and container has real content, skip
        if (loadCompleted && container.querySelector('.hentry:not(.skeleton-card)')) {
            console.log('[Projects] Already loaded, skipping');
            return;
        }

        loadInitiated = true;
        loadCompleted = false;

        const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

        // --- STATIC CATEGORIES HANDLING (Always run) ---
        updateCategoryVisibility(lang);

        // Listen for language changes (only once)
        if (!window._projectsLangListenerAdded) {
            window.addEventListener('languageChanged', (e) => {
                updateCategoryVisibility(e.detail?.language || 'en');
            });
            window._projectsLangListenerAdded = true;
        }

        // Fix: Allow clicking "All Categories" title to reset filter
        setupAllCategoriesClick(container);

        // Always use direct loading (more reliable)
        await loadProjectsDirect();
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
        if (allCatTitle && !allCatTitle._clickHandlerAdded) {
            allCatTitle.addEventListener('click', () => {
                filterProjectsBy('All');
                if (container) container.scrollIntoView({ behavior: 'smooth' });
            });
            allCatTitle._clickHandlerAdded = true;
        }
    }

    /**
     * Direct loading with built-in cache - ROBUST VERSION
     */
    async function loadProjectsDirect() {
        const container = document.getElementById('projects-container');
        if (!container) {
            loadCompleted = true;
            return;
        }

        const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();
        const cacheKey = `${GRID_CACHE_KEY}_${lang}`;

        let projects = [];
        let useCache = false;

        // 1. Try Cache FIRST (show cached content immediately)
        try {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                const now = Date.now();
                if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
                    // Use cache if valid, or as immediate display while fetching
                    if (now - parsed.timestamp < GRID_CACHE_TTL) {
                        projects = parsed.data;
                        useCache = true;
                        console.log(`[Projects] Using valid cache (${projects.length} items)`);
                    } else {
                        // Show expired cache immediately, then refresh
                        console.log('[Projects] Showing expired cache while fetching fresh data');
                        renderProjects(container, parsed.data);
                    }
                }
            }
        } catch (e) {
            console.warn('[Projects] Cache parse error:', e);
        }

        // 2. If we have valid cache, render and we're done
        if (useCache && projects.length > 0) {
            renderProjects(container, projects);
            loadCompleted = true;
            return;
        }

        // 3. Show skeleton loading only if no cached content shown
        if (!container.querySelector('.hentry:not(.skeleton-card)')) {
            container.innerHTML = generateSkeletons(9);
        }

        // 4. Fetch fresh data
        try {
            console.log('[Projects] Fetching fresh data from API...');

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const response = await fetch(`${CONFIG.API_URL}/projects?locale=${lang}&populate=*&pagination[limit]=100`, {
                mode: 'cors',
                credentials: 'omit',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}`);
            }

            const json = await response.json();
            const fetchedProjects = CONFIG.flatten(json);

            if (Array.isArray(fetchedProjects) && fetchedProjects.length > 0) {
                projects = fetchedProjects;
                // Save to Cache
                try {
                    localStorage.setItem(cacheKey, JSON.stringify({
                        timestamp: Date.now(),
                        data: projects
                    }));
                    console.log(`[Projects] Cached ${projects.length} projects`);
                } catch (e) {
                    console.warn('[Projects] Failed to cache:', e);
                }
            } else if (Array.isArray(fetchedProjects) && fetchedProjects.length === 0) {
                console.log('[Projects] API returned empty array');
                projects = [];
            }
        } catch (error) {
            console.error('[Projects] Fetch error:', error);

            // Fallback: Try to use ANY cached data (even expired)
            if (projects.length === 0) {
                try {
                    const cachedData = localStorage.getItem(cacheKey);
                    if (cachedData) {
                        const parsed = JSON.parse(cachedData);
                        if (parsed.data && Array.isArray(parsed.data)) {
                            projects = parsed.data;
                            console.log('[Projects] Using expired cache as fallback');
                        }
                    }
                } catch (e) { }
            }

            // If still no data, show error
            if (projects.length === 0) {
                container.innerHTML = `
                    <div class="content-error" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                        <h3>Connection Error</h3>
                        <p>Could not load projects. Please check your connection.</p>
                        <button onclick="location.reload()" style="padding: 10px 20px; cursor: pointer;">Retry</button>
                    </div>`;
                loadCompleted = true;
                return;
            }
        }

        // 5. Final Render
        renderProjects(container, projects);
        loadCompleted = true;
    }

    /**
     * Render projects into container
     */
    function renderProjects(container, projects) {
        if (!container) return;

        if (!Array.isArray(projects) || projects.length === 0) {
            container.innerHTML = `
                <div class="content-empty" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <h3>No projects found</h3>
                    <p>Public projects will appear here once published.</p>
                </div>`;
            return;
        }

        console.log(`[Projects] Rendering ${projects.length} projects`);

        // Clear skeleton/previous content
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
        console.log('[Projects] Render complete');
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
                            <div class="skeleton-image content-skeleton" style="width:100%;height:0;padding-bottom:66.67%;background:#e0e0e0;"></div>
                        </div>
                        <div class="hentry-middle">
                            <header class="entry-header">
                                <h2 class="entry-title">
                                    <span class="skeleton-title content-skeleton" style="display:block;height:24px;width:80%;margin:15px auto 0;background:#e0e0e0;"></span>
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
        const categoryList = categories.map(c => c.name || c);

        // Clean categories string for attribute
        const catAttr = JSON.stringify(categoryList).replace(/"/g, '&quot;');

        // LINK FIX: Point to ../projectview/index.html
        const projectUrl = `../projectview/index.html?project=${project.slug || project.id}`;

        return `
            <div class="hentry" data-categories="${catAttr}">
                <div class="hentry-wrap">
                    <div class="featured-image">
                        <a href="${projectUrl}">
                            <img src="${imgUrl}" alt="${project.title || 'Project'}" loading="lazy">
                        </a>
                    </div>
                    <div class="hentry-middle">
                        <header class="entry-header">
                            <h2 class="entry-title">
                                <a href="${projectUrl}">${project.title || 'Untitled Project'}</a>
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
                const catData = item.getAttribute('data-categories');
                if (catData) {
                    cats = JSON.parse(catData.replace(/&quot;/g, '"') || '[]');
                }
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

    /**
     * Force reload projects (for language change)
     */
    function forceReloadProjects() {
        loadInitiated = false;
        loadCompleted = false;
        loadProjects();
    }

    // Expose for category filtering
    window.filterProjectsBy = filterProjectsBy;
    window.forceReloadProjects = forceReloadProjects;

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadProjects);
    } else {
        // DOM is already ready
        loadProjects();
    }

    // Re-load on language change
    window.addEventListener('languageChanged', () => {
        forceReloadProjects();
    });

})();
