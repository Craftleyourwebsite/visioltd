/**
 * PROJECT DETAIL LOADER - OPTIMIZED
 * Injects Strapi data into the existing HTML structure.
 * Strategy: Check Grid Cache -> Check Detail Cache -> Fetch Network
 */

const CACHE_GRID_PREFIX = 'cached_strapi_projects_grid';
const CACHE_DETAIL_PREFIX = 'cached_project_detail';
const CACHE_TTL = 300000; // 5 Minutes

document.addEventListener('DOMContentLoaded', () => {
    initProjectDetail();
});

async function initProjectDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('project');

    if (!slug) {
        console.warn('No project slug found.');
        return;
    }

    // Language detection
    const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

    let projectBound = false;

    // --- STRATEGY 1: Try Grid Cache (Fastest - likely already loaded) ---
    try {
        const gridCacheKey = `${CACHE_GRID_PREFIX}_${lang}`;
        const cachedGrid = localStorage.getItem(gridCacheKey);

        if (cachedGrid) {
            const parsed = JSON.parse(cachedGrid);
            // We use grid cache even if slightly expired to show something immediately,
            // as long as it contains the project we need.
            if (Array.isArray(parsed.data)) {
                const found = parsed.data.find(p => p.slug === slug);
                if (found) {
                    console.log(`[Detail] Found project in Grid Cache. Rendering immediately.`);
                    injectProjectData(found);
                    projectBound = true;
                }
            }
        }
    } catch (e) {
        console.warn('[Detail] Grid cache check failed:', e);
    }

    // --- STRATEGY 2: Try Detail Cache (If not in grid or direct landing) ---
    const detailCacheKey = `${CACHE_DETAIL_PREFIX}_${slug}_${lang}`;
    if (!projectBound) {
        try {
            const cachedDetail = localStorage.getItem(detailCacheKey);
            if (cachedDetail) {
                const parsed = JSON.parse(cachedDetail);
                if (Date.now() - parsed.timestamp < CACHE_TTL) {
                    console.log(`[Detail] Found project in Detail Cache.`);
                    injectProjectData(parsed.data);
                    projectBound = true;
                }
            }
        } catch (e) {
            console.warn('[Detail] Detail cache check failed:', e);
        }
    }

    // --- STRATEGY 3: Network Fetch (If not bound or to revalidate) ---
    // If we already showed data from Grid Cache, we might settle with it OR fetch to ensure fresh details (optional).
    // Given the user wants "optimized" and "no static code", and grid usually has full data due to Populate=*,
    // we can skip fetch if found in VALID grid cache.
    // However, robust apps usually revalidate. Let's fetch only if NOT bound or if cache was expired/partial.

    if (!projectBound) {
        await fetchAndRender(slug, lang, detailCacheKey);
    } else {
        // Optional: Background revalidate if we want to be super strict about data freshness
        // fetchAndRender(slug, lang, detailCacheKey).catch(e => console.warn('Background revalidate failed', e));
    }
}

async function fetchAndRender(slug, lang, cacheKey) {
    try {
        console.log(`[Detail] Fetching fresh data for ${slug}...`);

        // Optimize fetch: only request necessary fields
        const fields = [
            'title', 'subtitle', 'welcome_text', 'client', 'date',
            'idea_title', 'idea_author', 'idea_description',
            'vision_title', 'vision_description',
            'fundamentals_title', 'fundamentals_description', 'slug'
        ].map((f, i) => `fields[${i}]=${f}`).join('&');

        const populates = [
            'main_image', 'vision_image', 'fundamentals_image', 'gallery'
        ].map(p => `populate[${p}][fields][0]=url&populate[${p}][fields][1]=alternativeText&populate[${p}][fields][2]=formats`).join('&');

        const apiUrl = `${CONFIG.API_URL}/projects?filters[slug][$eq]=${slug}&locale=${lang}&${fields}&${populates}`;

        const response = await fetch(apiUrl, { mode: 'cors', credentials: 'omit' });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = await response.json();
        const data = CONFIG.flatten(json);
        const project = Array.isArray(data) ? data[0] : data;

        if (project) {
            injectProjectData(project);
            document.title = `${project.title} - Visio Architecture`; // Verify title update

            // Save to Detail Cache
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: project
            }));
        } else {
            console.error('[Detail] Project not found API side.');
            // Could redirect to 404 or show message
        }

    } catch (error) {
        console.error('[Detail] Error loading project:', error);
    }
}

function injectProjectData(project) {
    if (!project) return;

    // Helper to safely set text content and remove loading-skeleton
    const setText = (id, content) => {
        const el = document.getElementById(id);
        if (!el) return;

        el.classList.remove('loading-skeleton');

        // Handle Strapi v5 Rich Text (Blocks) - Simple flattener
        if (Array.isArray(content)) {
            const text = content
                .map(block => block.children?.map(c => c.text).join('') || '')
                .join('\n\n');
            el.textContent = text || '';
            return;
        }

        el.textContent = content || '';
    };

    // Helper for images
    const setImage = (id, content, isBackground = false) => {
        const el = document.getElementById(id);
        if (!el) return;

        // Remove skeleton class
        el.classList.remove('loading-skeleton');
        if (el.parentElement?.classList.contains('loading-skeleton')) {
            el.parentElement.classList.remove('loading-skeleton');
        }

        if (!content?.url) {
            // handle missing image gracefully
            if (isBackground) el.style.backgroundColor = '#ddd';
            return;
        }

        const url = CONFIG.getOptimizedImageUrl(content, isBackground ? 'large' : 'medium');

        if (isBackground) {
            el.style.backgroundImage = `url('${url}')`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            // Force override any Elementor CSS
            el.style.setProperty('background-image', `url('${url}')`, 'important');
        } else {
            el.src = url;
            el.alt = content.alternativeText || project.title || '';
            el.style.opacity = '1';
        }
    };

    // --- INJECTION ---

    // 1. Header / Hero
    setText('project-subtitle', project.subtitle);
    setText('project-title', project.title);
    setText('project-welcome', project.welcome_text);
    if (project.title) document.title = `${project.title} - Visio Architecture`;

    // 2. Meta Info
    setText('project-client', project.client);
    setText('project-date', project.date);

    // 3. Main Image
    setImage('project-main-image', project.main_image, true);

    // 4. "The Idea"
    setText('project-idea-title', project.idea_title);
    setText('project-idea-author', project.idea_author);
    setText('project-idea-description', project.idea_description);

    // 5. "Vision"
    setText('project-vision-title', project.vision_title);
    setText('project-vision-description', project.vision_description);
    setImage('project-vision-image', project.vision_image);

    // 6. "Fundamentals"
    setText('project-fundamentals-title', project.fundamentals_title);
    setText('project-fundamentals-description', project.fundamentals_description);
    setImage('project-fundamentals-image', project.fundamentals_image);

    // 7. Gallery
    const galleryGrid = document.getElementById('project-gallery-grid');
    const gallerySection = document.getElementById('project-gallery-section');

    if (galleryGrid) {
        let galleryItems = [];
        if (Array.isArray(project.gallery)) {
            galleryItems = project.gallery;
        } else if (project.gallery?.data) {
            galleryItems = Array.isArray(project.gallery.data) ? project.gallery.data : [project.gallery.data];
        } else if (project.gallery) {
            galleryItems = [project.gallery];
        }

        if (galleryItems.length > 0) {
            gallerySection.style.display = 'block';
            galleryGrid.innerHTML = '';

            galleryItems.forEach(img => {
                const item = img.attributes ? { ...img.attributes, id: img.id } : img;
                const rawUrl = item.url;
                if (!rawUrl) return;

                const imageUrl = CONFIG.getImageUrl(item);
                const itemHTML = `
                    <div class="qodef-e qodef-image-wrapper qodef-grid-item">
                        <div class="qodef-e-inner">
                            <a class="qodef-popup-item" data-fslightbox="project-gallery" data-type="image" href="${imageUrl}">
                                <img src="${imageUrl}" alt="${item.alternativeText || ''}" loading="lazy">
                            </a>
                        </div>
                    </div>
                `;
                galleryGrid.insertAdjacentHTML('beforeend', itemHTML);
            });

            // Re-init lightbox
            setTimeout(() => {
                if (window.refreshFsLightbox) window.refreshFsLightbox();
            }, 500);

        } else {
            if (gallerySection) gallerySection.style.display = 'none';
        }
    }
}
