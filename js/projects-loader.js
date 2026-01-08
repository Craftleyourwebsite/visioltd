async function loadProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

    try {
        const [projectsResponse, categoriesResponse] = await Promise.all([
            fetch(`${CONFIG.API_URL}/projects?locale=${lang}&populate=*&pagination[limit]=100`, {
                mode: 'cors',
                credentials: 'omit'
            }),
            fetch(`${CONFIG.API_URL}/categories?locale=${lang}&sort=order:asc&pagination[limit]=100`, {
                mode: 'cors',
                credentials: 'omit'
            })
        ]);

        if (!projectsResponse.ok) {
            throw new Error(`HTTP Error ${projectsResponse.status}: ${projectsResponse.statusText}`);
        }

        const projectsJson = await projectsResponse.json();
        const projects = CONFIG.flatten(projectsJson);

        if (categoriesResponse.ok) {
            const categoriesJson = await categoriesResponse.json();
            allCategories = CONFIG.flatten(categoriesJson) || [];
            if (!Array.isArray(allCategories)) allCategories = [];

            renderCategoryGrid(allCategories);
        }

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

    const categories = Array.isArray(project.categories) ? project.categories : (project.category ? [project.category] : []);
    const categoryList = categories.map(c => c.name);

    return `
        <div class="hentry" data-categories='${JSON.stringify(categoryList)}'>
            <div class="hentry-wrap">
                <div class="featured-image">
                    <a href="projectview.html?project=${project.slug}">
                        <img src="${imgUrl}" alt="${project.title}">
                    </a>
                </div>
                <div class="hentry-middle">
                    <header class="entry-header">
                        <h2 class="entry-title">
                            <a href="projectview.html?project=${project.slug}">${project.title}</a>
                        </h2>
                    </header>
                </div>
            </div>
        </div>
    `;
}

function filterProjectsBy(catName) {
    const items = document.querySelectorAll('#projects-container .hentry');
    items.forEach(item => {
        let cats = [];
        try {
            cats = JSON.parse(item.getAttribute('data-categories') || '[]');
        } catch (e) {
            console.error('Error parsing categories for item', e);
        }

        if (catName === 'All' || cats.includes(catName)) {
            item.classList.remove('is-hidden');
        } else {
            item.classList.add('is-hidden');
        }
    });
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

    // Define the column mapping to match the spreadsheet design
    const columnMapping = [
        ['Core Architecture'],
        ['Infrastructure & Transport', 'Industrial & Logistics'],
        ['Urban Planning & Territorial Development', 'Heritage & Adaptive Reuse'],
        ['Interior Architecture', 'Landscape & Environment', 'Specialist / Strategic Work']
    ];

    gridContainer.innerHTML = '';

    columnMapping.forEach(colGroups => {
        const colDiv = document.createElement('div');
        colDiv.className = 'category-column';

        colGroups.forEach(groupName => {
            if (groups[groupName]) {
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

                    // Add click event for filtering
                    li.addEventListener('click', () => {
                        filterProjectsBy(catName);
                        // Optional: Smooth scroll to projects
                        document.getElementById('projects-container').scrollIntoView({ behavior: 'smooth' });
                    });

                    list.appendChild(li);
                });

                header.addEventListener('click', () => {
                    if (window.innerWidth <= 575) {
                        groupDiv.classList.toggle('is-active');
                    }
                });

                groupDiv.appendChild(header);
                groupDiv.appendChild(list);
                colDiv.appendChild(groupDiv);
            }
        });

        gridContainer.appendChild(colDiv);
    });
}

document.addEventListener('DOMContentLoaded', loadProjects);
