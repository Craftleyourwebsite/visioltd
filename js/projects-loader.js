/**
 * PROJECTS LIST LOADER - RESTORED DESIGN + FILTERS (V2)
 * Injects project items and rebuilds the filter bar dynamically.
 */

document.addEventListener('DOMContentLoaded', loadProjects);

async function loadProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

    try {
        const response = await fetch(`${CONFIG.API_URL}/projects?locale=${lang}&populate=*`, {
            mode: 'cors',
            credentials: 'omit'
        });
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();

        // Debug
        // console.log('Strapi raw response:', json);

        const projects = CONFIG.flatten(json);

        // Robust check: projects must be an array
        if (!Array.isArray(projects)) {
            // If flatten returned an object (e.g. error details or just meta), treat as empty/error
            console.warn('Projects data is not an array:', projects);

            // If it contains error info, throw it
            if (projects && (projects.error || projects.message)) {
                throw new Error(projects.error?.message || projects.message || 'Unknown API Error');
            }

            // Otherwise empty
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: rgba(0,0,0,0.05); color: #000;">
                    <h3>Invalid Data Error</h3>
                    <p>Strapi returned valid JSON but not a list of projects.</p>
                    <pre style="text-align:left; font-size:10px;">${JSON.stringify(json, null, 2).slice(0, 300)}...</pre>
                </div>`;
            return;
        }

        if (projects.length === 0) {
            console.warn('No projects returned from Strapi.');
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: rgba(0,0,0,0.05); color: #000;">
                    <h3>No projects found</h3>
                    <p>Please ensure you have created and <strong>published</strong> a project in Strapi (Drafts are not shown).</p>
                    <p>Current Locale: ${lang}</p>
                </div>`;
            return;
        }

        // Clear existing static items (important: do this before rebuilding filters)
        container.innerHTML = '';

        projects.forEach(project => {
            const html = createProjectCard(project);
            container.insertAdjacentHTML('beforeend', html);
        });

        // Re-initialize filters based on the new dynamic content
        initFilters();

    } catch (error) {
        console.error('Error loading projects:', error);
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: #ffebee; color: #c62828;">
                <h3>Connection Error</h3>
                <p>Could not load projects from Strapi.</p>
                <p><strong>Reason:</strong> ${error.message}</p>
                <p>Make sure Strapi is running (<code>npm run develop</code>) and permissions (Public > find) are set.</p>
            </div>`;
    }
}

function createProjectCard(project) {
    const imgUrl = project.thumbnail?.url
        ? (project.thumbnail.url.startsWith('http') ? project.thumbnail.url : CONFIG.STRAPI_URL + project.thumbnail.url)
        : 'public/section/1.jpeg'; // Fallback

    // Ensure we have a category for filtering
    const category = project.category || 'Architecture';

    return `
        <div class="gt-grid-item gt-grid-item--h2" data-category="${category}" style="position: relative;">
            <div class="gt-img" style="background-image:url('${imgUrl}');"></div>
            <a href="projectview.html?project=${project.slug}" class="gt-content">
                <span>
                    <h2>${project.title}</h2>
                    <ul class="gt-location">
                        <li>${project.location || ''}</li>
                    </ul>
                    <p class="gt-excerpt">${project.excerpt || ''}</p>
                    <ul class="gt-cat">
                        <li>${category}</li>
                    </ul>
                </span>
            </a>
        </div>
    `;
}

function initFilters() {
    const grid = document.getElementById('projects-container');
    if (!grid) return;

    const items = Array.from(grid.querySelectorAll('.gt-grid-item'));
    const bar = document.getElementById('gt-filters');

    if (!items.length || !bar) return;

    // Derive categories from items
    const categories = new Set();
    items.forEach(item => {
        const cat = item.getAttribute('data-category');
        if (cat) categories.add(cat);
    });

    if (categories.size === 0) return;

    // Preferred order helps keeping consistency
    const order = ['All', 'Residential', 'Workplace', 'Hotel', 'Sport', 'Cultural'];
    const finalCats = ['All'].concat(
        order.filter(c => categories.has(c))
    ).concat(
        Array.from(categories).filter(c => !order.includes(c) && c !== 'All')
    );

    // Build filter buttons
    bar.innerHTML = '';
    finalCats.forEach((cat, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = cat;
        if (idx === 0) btn.classList.add('is-active');

        btn.addEventListener('click', () => {
            // UI toggle
            Array.from(bar.children).forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');

            // Logic toggle
            items.forEach(item => {
                const itemCat = item.getAttribute('data-category');
                const show = (cat === 'All') || (itemCat === cat);

                item.classList.toggle('is-hidden', !show);
                item.style.display = show ? '' : 'none'; // Ensure layout reflow
            });
        });

        bar.appendChild(btn);
    });
}
