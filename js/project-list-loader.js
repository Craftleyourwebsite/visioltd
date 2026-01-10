/**
 * PROJECT LIST LOADER (V5 - OPTIMIZED DYNAMIC HYBRID)
 * Fetches "Selected Projects" directly from Strapi API at runtime.
 * Merges them with INITIAL_PROJECTS (Static).
 * Sorts by Year DESC.
 * OPTIMIZATION: Uses localStorage caching (5 minutes TTL) to prevent hammering Strapi on every page load.
 */

// Initial projects (LEGITIMATE STATIC PROJECTS)
const INITIAL_PROJECTS = [
    { year: '2025', location: 'Port Louis, Mauritius', title: 'Harbourview Mixed-Use Tower', client: 'Meridian Capital Ltd', category: 'Mixed-Use / High-Rise' },
    { year: '2025', location: 'Côte d\'Or, Mauritius', title: 'Verdant Courtyard Residences', client: 'Côte d\'Or Development Co.', category: 'Residential (Mid-High End)' },
    { year: '2025', location: 'Maputo, Mozambique', title: 'Baía Business District Masterplan', client: 'Baía Urban Holdings', category: 'Urban Masterplan' },
    { year: '2024', location: 'Grand Baie, Mauritius', title: 'Coral Bay Boutique Hotel', client: 'Coral Hospitality Group', category: 'Hospitality' },
    { year: '2024', location: 'Ebène, Mauritius', title: 'Nexus Office Campus', client: 'Nexus Corporate Properties', category: 'Commercial / Offices' },
    { year: '2024', location: 'Kigali, Rwanda', title: 'Hillside Mobility Hub', client: 'City of Kigali (PPP Unit)', category: 'Mobility / Transport' },
    { year: '2024', location: 'Antananarivo, Madagascar', title: 'Ankora Market & Community Hub', client: 'Ankora Municipal Council', category: 'Public / Civic' },
    { year: '2024', location: 'Rodrigues, Mauritius', title: 'Port Mathurin Civic Centre', client: 'Rodrigues Regional Assembly', category: 'Public / Institutional' },
    { year: '2023', location: 'Tamarin, Mauritius', title: 'Dunecrest Villas Estate', client: 'Dunecrest Developments', category: 'Residential (High End)' },
    { year: '2023', location: 'Nairobi, Kenya', title: 'GreenLoop Industrial Park', client: 'GreenLoop Logistics Ltd', category: 'Industrial' },
    { year: '2023', location: 'Lusaka, Zambia', title: 'Arcadia Healthcare Clinic Network', client: 'Arcadia Health Partners', category: 'Healthcare' },
    { year: '2023', location: 'Port Louis, Mauritius', title: 'Old Wharf Urban Regeneration Concept', client: 'Port City Regeneration Agency', category: 'Urban Regeneration' },
    { year: '2022', location: 'Moka, Mauritius', title: 'Ridgeline Education Campus', client: 'Ridgeline Education Trust', category: 'Education' },
    { year: '2022', location: 'Dakar, Senegal', title: 'Atlantic Cultural Pavilion', client: 'Fondation Atlantique', category: 'Culture / Public' },
    { year: '2022', location: 'Abidjan, Côte d\'Ivoire', title: 'Lagoon View Apartments', client: 'Lagoon Residential SA', category: 'Residential (Apartments)' },
    { year: '2022', location: 'Curepipe, Mauritius', title: 'Highland Retail Galleria', client: 'Highland Retail Partners', category: 'Retail / Commercial' },
    { year: '2021', location: 'Kolwezi, DRC', title: 'Kivu Eco-Lodge & Conference Retreat', client: 'Kivu Hospitality DRC', category: 'Hospitality / Eco-tourism' },
    { year: '2021', location: 'Pointe aux Canonniers, Mauritius', title: 'Seabreeze Beachfront Apartments', client: 'Seabreeze Living Ltd', category: 'Residential (Apartments)' },
    { year: '2021', location: 'Accra, Ghana', title: 'SolarCanopy Community Library', client: 'Horizon Community Foundation', category: 'Public / Community' },
    { year: '2020', location: 'Port Louis, Mauritius', title: 'Sentinel House Renovation', client: 'Private Client (Confidential)', category: 'Renovation / Heritage' },
    { year: '2020', location: 'Mahébourg, Mauritius', title: 'Waterfront Public Realm Upgrade', client: 'Mahébourg Municipality', category: 'Public Realm / Landscape' },
    { year: '2019', location: 'Phoenix, Mauritius', title: 'Central Park Urban Infill Scheme', client: 'Phoenix Development Consortium', category: 'Urban Design / Mixed-Use' },
    { year: '2019', location: 'Gaborone, Botswana', title: 'Kgale View Corporate HQ', client: 'Kgale Holdings', category: 'Commercial / Offices' },
    { year: '2018', location: 'Pointe d\'Esny, Mauritius', title: 'Mangrove Walk Residences', client: 'OceanEdge Properties', category: 'Residential / Sustainable' },
    { year: '2018', location: 'Kinshasa, DRC', title: 'Riverfront Convention Centre Concept', client: 'Congo Events & Expo SA', category: 'Public / Event' }
];

// Config for Optimization
const PROJECTS_CACHE_KEY = 'cached_strapi_projects';
const CACHE_TTL_MS = 300000; // 5 Minutes Cache

document.addEventListener('DOMContentLoaded', loadProjectList);

async function loadProjectList() {
    console.log('Project List Loader (Optimized Dynamic): Initializing...');
    const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

    // Elements
    const enBody = document.getElementById('project-list-body-en');
    const frBody = document.getElementById('project-list-body-fr');

    if (!enBody || !frBody) {
        console.warn('Project List Loader: Table body elements not found.');
        return;
    }

    async function fetchAndRenderProjects(language) {
        const targetBody = language === 'fr' ? frBody : enBody;
        if (!targetBody) return;

        // Show loading state if empty and not hidden
        if (targetBody.style.display !== 'none' && targetBody.querySelectorAll('tr').length === 0) {
            targetBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">Loading projects...</td></tr>';
        }

        let strapiProjects = [];
        const cacheKey = `${PROJECTS_CACHE_KEY}_${language}`;
        let loadedFromValidCache = false;

        // 1. Try Valid Cache
        try {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                const now = Date.now();
                if (now - parsed.timestamp < CACHE_TTL_MS) {
                    strapiProjects = parsed.data;
                    loadedFromValidCache = true;
                    console.log(`[List] Using cached projects for ${language} (Expires in ${Math.round((CACHE_TTL_MS - (now - parsed.timestamp)) / 1000)}s)`);
                }
            }
        } catch (e) {
            console.warn('[List] Cache parse error, ignoring.');
        }

        // 2. Fetch if not in valid cache
        if (!loadedFromValidCache) {
            try {
                // Fetch from Strapi (Selected List)
                const baseUrl = (typeof CONFIG !== 'undefined' && CONFIG.API_URL) ? CONFIG.API_URL : 'https://visiostrapi-production.up.railway.app/api';
                const url = `${baseUrl}/selected-project-list?locale=${language}&populate[projects]=true`;

                console.log(`[List] Fetching dynamic projects from: ${url}`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second max

                const response = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const json = await response.json();
                    let rawProjects = [];

                    if (json.data && json.data.attributes && Array.isArray(json.data.attributes.projects)) {
                        rawProjects = json.data.attributes.projects;
                    } else if (json.data && json.data.projects) {
                        rawProjects = json.data.projects;
                    }

                    strapiProjects = rawProjects.map(p => ({
                        year: p.year || 'Unknown',
                        location: p.location || '',
                        title: p.name || '',
                        client: p.client || '',
                        category: p.category || '',
                        isFromStrapi: true,
                        id: p.id
                    }));

                    // Save to Cache
                    localStorage.setItem(cacheKey, JSON.stringify({
                        timestamp: Date.now(),
                        data: strapiProjects
                    }));

                } else {
                    throw new Error(`Strapi fetch failed (${response.status})`);
                }

            } catch (err) {
                console.warn(`[List] Error fetching for ${language}:`, err);

                // 3. Fallback to Expired Cache
                const cachedData = localStorage.getItem(cacheKey);
                if (cachedData) {
                    try {
                        const parsed = JSON.parse(cachedData);
                        strapiProjects = parsed.data;
                        console.log('[List] Recovering with EXPIRED cache due to fetch error.');
                    } catch (e) { }
                }
            }
        }

        // 4. Merge with INITIAL_PROJECTS
        // We use a Map to deduplicate using normalized title as key
        const projectMap = new Map();

        // Add Strapi projects first (higher priority if we want them to be the source of truth, 
        // or lower if we want static to override? Usually dynamic overrides static, but here 
        // we're appending static ones that aren't in dynamic. The user wants "Selected Project List" + "Initial".
        // Use title as unique key.

        // Add dynamic projects
        strapiProjects.forEach(p => {
            projectMap.set(p.title.trim().toLowerCase(), p);
        });

        // Add static projects only if not present
        INITIAL_PROJECTS.forEach(initP => {
            const key = initP.title.trim().toLowerCase();
            if (!projectMap.has(key)) {
                projectMap.set(key, initP);
            }
        });

        const finalProjects = Array.from(projectMap.values());

        // 5. Sort by Year DESC
        finalProjects.sort((a, b) => {
            const yearA = parseInt(a.year) || 0;
            const yearB = parseInt(b.year) || 0;
            if (yearB !== yearA) return yearB - yearA; // Descending
            return a.title.localeCompare(b.title);
        });

        // 6. Render HTML
        if (finalProjects.length === 0) {
            targetBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No projects found.</td></tr>';
        } else {
            const html = finalProjects.map(project => `
                <tr>
                    <td class="year-col">${project.year}</td>
                    <td class="location-col">${project.location}</td>
                    <td class="name-col">${project.title}</td>
                    <td class="client-col">${project.client}</td>
                    <td class="category-col">${project.category}</td>
                </tr>
            `).join('');
            targetBody.innerHTML = html;
        }

        console.log(`[List] Rendered ${finalProjects.length} projects for ${language}`);
    }

    function updateProjectListVisibility(language) {
        if (language.toLowerCase() === 'fr') {
            enBody.style.display = 'none';
            frBody.style.display = 'table-row-group';
            fetchAndRenderProjects('fr');
        } else {
            enBody.style.display = 'table-row-group';
            frBody.style.display = 'none';
            fetchAndRenderProjects('en');
        }
    }

    // Initial load
    updateProjectListVisibility(lang);

    // Listen for language changes
    window.addEventListener('languageChanged', (e) => {
        const newLang = e.detail.language;
        updateProjectListVisibility(newLang);
    });
}
