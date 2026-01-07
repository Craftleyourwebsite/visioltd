/**
 * PROJECTS LIST LOADER - WITH CATEGORY API SUPPORT (V3)
 * Fetches categories from Strapi API and rebuilds the filter bar.
 */

document.addEventListener('DOMContentLoaded', () => {
    loadProjects();

    // Delegate click events for category-item and group headers
    document.addEventListener('click', (e) => {
        // Filter click
        if (e.target.classList.contains('category-item')) {
            const catName = e.target.textContent.trim();
            filterProjectsBy(catName);
        }

        // Accordion toggle (mobile only)
        if (e.target.classList.contains('category-group-header') && window.innerWidth <= 575) {
            const group = e.target.closest('.category-group');
            if (group) {
                group.classList.toggle('is-active');
            }
        }

        // Reset filter when clicking "All Categories" title
        if (e.target.classList.contains('all-categories-title')) {
            filterProjectsBy('All');
        }
    });
});

function filterProjectsBy(catName) {
    const container = document.getElementById('projects-container');
    if (!container) return;

    const items = Array.from(container.querySelectorAll('.gt-grid-item'));

    items.forEach(item => {
        let show = (catName === 'All');
        if (!show) {
            try {
                const itemCats = JSON.parse(item.getAttribute('data-categories') || '[]');
                show = itemCats.some(c => c.trim().toLowerCase() === catName.trim().toLowerCase());
            } catch (e) {
                console.error(e);
                show = false;
            }
        }

        item.classList.toggle('is-hidden', !show);
        item.style.display = show ? '' : 'none';
    });

    // Scroll to grid
    container.scrollIntoView({ behavior: 'smooth' });
}

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

        // Parse categories
        if (categoriesResponse.ok) {
            const categoriesJson = await categoriesResponse.json();
            allCategories = CONFIG.flatten(categoriesJson) || [];
            if (!Array.isArray(allCategories)) allCategories = [];

            // Render the category grid dynamically
            renderCategoryGrid(allCategories);
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
    const imgUrl = CONFIG.getImageUrl(project.thumbnail, 'public/section/1.jpeg');

    // Handle multiple categories
    const categories = Array.isArray(project.categories) ? project.categories : (project.category ? [project.category] : []);
    const categoryNames = categories.length > 0 ? categories.map(c => c.name).join(', ') : 'Architecture';
    const categoryList = categories.map(c => c.name);

    return `
        <div class="gt-grid-item gt-grid-item--h2" data-categories='${JSON.stringify(categoryList)}' style="position: relative;">
            <div class="gt-img" style="background-image:url('${imgUrl}');"></div>
            <a href="projectview.html?project=${project.slug}" class="gt-content">
                <span>
                    <h2>${project.title}</h2>
                    <ul class="gt-location">
                        <li>${project.location || ''}</li>
                    </ul>
                    <p class="gt-excerpt">${project.excerpt || ''}</p>
                    <ul class="gt-cat">
                        <li>${categoryNames}</li>
                    </ul>
                </span>
            </a>
    `;
}

function renderCategoryGrid(categories) {
    const gridContainer = document.getElementById('dynamic-categories-grid');
    if (!gridContainer) return;

    // Group categories by the 'group' field
    const groups = {};
    categories.forEach(cat => {
        const groupName = cat.group || 'Other';
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(cat.name);
    });

    // Define the preferred order of groups to match the design if possible
    const preferredOrder = [
        'Core Architecture',
        'Infrastructure & Transport',
        'Industrial & Logistics',
        'Urban Planning & Territorial Development',
        'Heritage & Adaptive Reuse',
        'Interior Architecture',
        'Landscape & Environment',
        'Specialist / Strategic Work'
    ];

    // Sort group names: preferred order first, then alphabetical
    const groupNames = Object.keys(groups).sort((a, b) => {
        const idxA = preferredOrder.indexOf(a);
        const idxB = preferredOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    gridContainer.innerHTML = '';

    groupNames.forEach(groupName => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'category-group';

        const header = document.createElement('div');
        header.className = 'category-group-header';
        header.textContent = groupName;

        const list = document.createElement('ul');
        list.className = 'category-list';

        groups[groupName].forEach(catName => {
            const li = document.createElement('li');
            li.className = 'category-item';
            li.textContent = catName;
            list.appendChild(li);
        });

        groupDiv.appendChild(header);
        groupDiv.appendChild(list);
        gridContainer.appendChild(groupDiv);
    });
}

