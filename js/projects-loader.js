/**
 * PROJECTS LIST LOADER - WITH CATEGORY API SUPPORT (V3)
 * Fetches categories from Strapi API and rebuilds the filter bar.
 */

document.addEventListener('DOMContentLoaded', loadProjects);

// Global variable to store fetched categories
let allCategories = [];

async function loadProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

    try {
        // Fetch both projects and categories in parallel
        const [projectsResponse, categoriesResponse] = await Promise.all([
            fetch(`${CONFIG.API_URL}/projects?locale=${lang}&populate=*`, {
                mode: 'cors',
                credentials: 'omit'
            }),
            fetch(`${CONFIG.API_URL}/categories?locale=${lang}&sort=order:asc`, {
                mode: 'cors',
                credentials: 'omit'
            })
        ]);

        if (!projectsResponse.ok) {
            throw new Error(`HTTP Error ${projectsResponse.status}: ${projectsResponse.statusText}`);
        }

        const projectsJson = await projectsResponse.json();
        const projects = CONFIG.flatten(projectsJson);

        // Parse categories (may fail if not available yet)
        if (categoriesResponse.ok) {
            const categoriesJson = await categoriesResponse.json();
            allCategories = CONFIG.flatten(categoriesJson) || [];
            if (!Array.isArray(allCategories)) allCategories = [];
        }

        // Robust check: projects must be an array
        if (!Array.isArray(projects)) {
            console.warn('Projects data is not an array:', projects);

            if (projects && (projects.error || projects.message)) {
                throw new Error(projects.error?.message || projects.message || 'Unknown API Error');
            }

            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: rgba(0,0,0,0.05); color: #000;">
                    <h3>Invalid Data Error</h3>
                    <p>Strapi returned valid JSON but not a list of projects.</p>
                    <pre style="text-align:left; font-size:10px;">${JSON.stringify(projectsJson, null, 2).slice(0, 300)}...</pre>
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

        // Clear existing static items
        container.innerHTML = '';

        projects.forEach(project => {
            const html = createProjectCard(project);
            container.insertAdjacentHTML('beforeend', html);
        });

        // Re-initialize filters with API categories
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

    // Category is now a relation - get the name from the related object
    const categoryName = project.category?.name || 'Architecture';

    return `
        <div class="gt-grid-item gt-grid-item--h2" data-category="${categoryName}" style="position: relative;">
            <div class="gt-img" style="background-image:url('${imgUrl}');"></div>
            <a href="projectview.html?project=${project.slug}" class="gt-content">
                <span>
                    <h2>${project.title}</h2>
                    <ul class="gt-location">
                        <li>${project.location || ''}</li>
                    </ul>
                    <p class="gt-excerpt">${project.excerpt || ''}</p>
                    <ul class="gt-cat">
                        <li>${categoryName}</li>
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

    if (!bar) return;

    // Build categories list: use API categories if available, else derive from projects
    let categoryNames = [];

    if (allCategories.length > 0) {
        // Use categories from API (already sorted by order)
        categoryNames = allCategories.map(cat => cat.name);
    } else {
        // Fallback: derive from project items
        const categoriesSet = new Set();
        items.forEach(item => {
            const cat = item.getAttribute('data-category');
            if (cat) categoriesSet.add(cat);
        });
        categoryNames = Array.from(categoriesSet);
    }

    if (categoryNames.length === 0) return;

    // Add "All" at the beginning
    const finalCats = ['All', ...categoryNames];

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
                item.style.display = show ? '' : 'none';
            });
        });

        bar.appendChild(btn);
    });
}
