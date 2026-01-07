/**
 * PROJECT LIST LOADER (V2)
 * Fetches projects from Strapi API, merges with initial projects from image,
 * and builds the "Selected Projects List" table with sorting (most recent first).
 */

document.addEventListener('DOMContentLoaded', loadProjectList);

// Initial projects extracted from the provided image
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

async function loadProjectList() {
    const tableBody = document.getElementById('project-list-body');
    if (!tableBody) return;

    const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

    try {
        // Show loading state
        tableBody.innerHTML = `<tr><td colspan="5" class="table-status-message">Loading project list...</td></tr>`;

        // 1. Try to fetch the Selected Project List first
        const selectedResponse = await fetch(`${CONFIG.API_URL}/selected-project-list?locale=${lang}&populate[projects]=true`, {
            mode: 'cors',
            credentials: 'omit'
        });

        let projectsFromStrapi = [];
        let usedSelectedList = false;

        if (selectedResponse.ok) {
            const selectedJson = await selectedResponse.json();
            const flattenedSelected = CONFIG.flatten(selectedJson);

            if (flattenedSelected && Array.isArray(flattenedSelected.projects) && flattenedSelected.projects.length > 0) {
                projectsFromStrapi = flattenedSelected.projects;
                usedSelectedList = true;
                console.log('Using projects from "Selected Project List" (manually ordered in Strapi)');
            }
        }

        // 2. If Selected Project List is empty or failed, fallback to all projects sorted by date
        if (!usedSelectedList) {
            console.log('Selected Project List empty or inaccessible. Falling back to all projects (date:desc)');
            const response = await fetch(`${CONFIG.API_URL}/projects?locale=${lang}&populate=categories&sort=date:desc`, {
                mode: 'cors',
                credentials: 'omit'
            });

            if (response.ok) {
                const json = await response.json();
                projectsFromStrapi = CONFIG.flatten(json) || [];
            }
        }

        // Map Strapi projects to same format as INITIAL_PROJECTS
        const mappedStrapi = projectsFromStrapi.map(p => {
            if (usedSelectedList) {
                // p is an item from the repeatable component: tables.project-item
                return {
                    year: p.year || 'Unknown',
                    location: p.location || '',
                    title: p.name || '',
                    client: p.client || '',
                    category: p.category || '',
                    isFromStrapi: true,
                    id: p.id
                };
            }

            // Fallback: p is a project collection type
            const cats = Array.isArray(p.categories) ? p.categories : (p.category ? [p.category] : []);
            return {
                year: p.date ? p.date.substring(0, 4) : 'Unknown',
                location: p.location || '',
                title: p.title || '',
                client: p.client || '',
                category: cats.map(c => c.name).join(', '),
                isFromStrapi: true,
                id: p.id
            };
        });

        // Merge and deduplicate
        const allProjects = [...mappedStrapi];

        INITIAL_PROJECTS.forEach(initP => {
            if (!mappedStrapi.find(s => s.title.trim().toLowerCase() === initP.title.trim().toLowerCase())) {
                allProjects.push(initP);
            }
        });

        // SORTING:
        // If using manual Strapi list, preserve their order at the top.
        // Otherwise sort by year.
        if (usedSelectedList) {
            allProjects.sort((a, b) => {
                if (a.isFromStrapi && !b.isFromStrapi) return -1;
                if (!a.isFromStrapi && b.isFromStrapi) return 1;
                if (!a.isFromStrapi && !b.isFromStrapi) {
                    return b.year.localeCompare(a.year);
                }
                return 0; // Preserve Strapi order
            });
        } else {
            allProjects.sort((a, b) => {
                if (b.year !== a.year) {
                    return b.year.localeCompare(a.year);
                }
                if (a.isFromStrapi && !b.isFromStrapi) return -1;
                if (!a.isFromStrapi && b.isFromStrapi) return 1;
                if (a.isFromStrapi && b.isFromStrapi) return b.id - a.id;
                return 0;
            });
        }

        if (allProjects.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="table-status-message">No projects found.</td></tr>`;
            return;
        }

        // Clear loading state
        tableBody.innerHTML = '';

        allProjects.forEach(project => {
            const row = `
                <tr>
                    <td class="year-col">${project.year}</td>
                    <td class="location-col">${project.location}</td>
                    <td class="name-col">${project.title}</td>
                    <td class="client-col">${project.client}</td>
                    <td class="category-col">${project.category}</td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

    } catch (error) {
        console.error('Error loading project list:', error);
        // Fallback to initial projects if API fails
        renderFallback(tableBody);
    }
}

function renderFallback(container) {
    container.innerHTML = '';
    INITIAL_PROJECTS.forEach(project => {
        const row = `
            <tr>
                <td class="year-col">${project.year}</td>
                <td class="location-col">${project.location}</td>
                <td class="name-col">${project.title}</td>
                <td class="client-col">${project.client}</td>
                <td class="category-col">${project.category}</td>
            </tr>
        `;
        container.insertAdjacentHTML('beforeend', row);
    });
}
