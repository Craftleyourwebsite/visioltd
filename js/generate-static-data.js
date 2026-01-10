const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const STRAPI_URL = 'https://visiostrapi-production.up.railway.app';
const API_URL = `${STRAPI_URL}/api`;
const LOCALES = ['en', 'fr'];
const CATEGORIE_DIR = path.join(__dirname, '../categorie');
const PROJECT_DIR = path.join(__dirname, '../selectedprojet');
const PROJECT_INDEX = path.join(__dirname, '../project/index.html');

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

// Create directories if they don't exist
[CATEGORIE_DIR, PROJECT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function fetchStrapi(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `${API_URL}${endpoint}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.error) {
                        console.warn(`API Warning for ${endpoint}:`, json.error.message);
                        resolve(null);
                    } else {
                        resolve(flatten(json.data));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => {
            console.error(`Fetch error for ${endpoint}:`, err.message);
            resolve(null);
        });
    });
}

function flatten(data) {
    if (!data) return null;
    if (Array.isArray(data)) {
        return data.map(item => flatten(item));
    }
    const result = {};
    const attrs = data.attributes || data;

    if (data.id) result.id = data.id;
    Object.keys(attrs).forEach(key => {
        if (typeof attrs[key] === 'object' && attrs[key] !== null) {
            result[key] = flatten(attrs[key]);
        } else {
            result[key] = attrs[key];
        }
    });
    return result;
}

function generateCategoryHTML(categories) {
    if (!categories || !Array.isArray(categories)) return '';

    const groups = {};
    categories.forEach(cat => {
        const groupName = cat.group || 'Other';
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(cat.name);
    });

    const columnMapping = [
        ['Core Architecture'],
        ['Infrastructure & Transport', 'Industrial & Logistics'],
        ['Urban Planning & Territorial Development', 'Heritage & Adaptive Reuse'],
        ['Interior Architecture', 'Landscape & Environment', 'Specialist / Strategic Work']
    ];

    let html = '';
    columnMapping.forEach(colGroups => {
        html += '<div class="category-column">';
        colGroups.forEach(groupName => {
            if (groups[groupName]) {
                html += `<div class="category-group">`;
                html += `<div class="category-group-header" onclick="if(window.innerWidth <= 575) this.parentElement.classList.toggle('is-active')">${groupName}</div>`;
                html += `<ul class="category-list">`;
                groups[groupName].forEach(catName => {
                    const safeName = catName.replace(/'/g, "\\'");
                    html += `<li class="category-item" onclick="filterProjectsBy('${safeName}'); document.getElementById('projects-container').scrollIntoView({ behavior: 'smooth' });">${catName}</li>`;
                });
                html += `</ul></div>`;
            }
        });
        html += '</div>';
    });
    return html;
}

function generateProjectRowsHTML(projects) {
    if (!projects || !Array.isArray(projects)) return '';
    return projects.map(project => `
                <tr>
                    <td class="year-col">${project.year}</td>
                    <td class="location-col">${project.location}</td>
                    <td class="name-col">${project.title}</td>
                    <td class="client-col">${project.client}</td>
                    <td class="category-col">${project.category}</td>
                </tr>
    `).join('').trim();
}

function safeInject(content, startMarker, endMarker, injection) {
    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);

    if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
        console.warn(`Markers not found or invalid: ${startMarker}, ${endMarker}`);
        return content;
    }

    const before = content.substring(0, startIdx + startMarker.length);
    const after = content.substring(endIdx);
    return before + '\n' + injection + '\n' + after;
}

async function run() {
    console.log('Fetching data and generating static files...');
    const catFragments = {};
    const projectFragments = {};

    for (const locale of LOCALES) {
        try {
            // 1. Handle Categories
            console.log(`Fetching categories for locale: ${locale}`);
            const categories = await fetchStrapi(`/categories?locale=${locale}&sort=order:asc&pagination[limit]=100`);
            catFragments[locale] = generateCategoryHTML(categories || []);

            // 2. Handle Projects (Selected Strapi List + Legitimate Static List)
            console.log(`Fetching Selected Projects for locale: ${locale}`);

            const selectedList = await fetchStrapi(`/selected-project-list?locale=${locale}&populate[projects]=true`);

            let strapiSelected = [];
            if (selectedList && Array.isArray(selectedList.projects)) {
                strapiSelected = selectedList.projects.map(p => {
                    return {
                        year: p.year || 'Unknown',
                        location: p.location || '',
                        title: p.name || '',
                        client: p.client || '',
                        category: p.category || '',
                        isFromStrapi: true,
                        id: p.id
                    };
                });
            }

            // Merge with INITIAL_PROJECTS
            const finalProjects = [...strapiSelected];
            INITIAL_PROJECTS.forEach(initP => {
                // Determine uniqueness by title
                if (!finalProjects.find(fp => fp.title.trim().toLowerCase() === initP.title.trim().toLowerCase())) {
                    finalProjects.push(initP);
                }
            });

            console.log(`Final list for ${locale}: ${finalProjects.length} projects (${strapiSelected.length} from Strapi, ${finalProjects.length - strapiSelected.length} static)`);

            // Sorting logic: Year DESC
            finalProjects.sort((a, b) => {
                const yearA = parseInt(a.year) || 0;
                const yearB = parseInt(b.year) || 0;
                if (yearB !== yearA) return yearB - yearA;
                return a.title.localeCompare(b.title);
            });

            projectFragments[locale] = generateProjectRowsHTML(finalProjects);

            // Write project fragments to files in selectedprojet/
            const projFilePath = path.join(PROJECT_DIR, `${locale}.html`);
            fs.writeFileSync(projFilePath, projectFragments[locale]);
            console.log(`Generated ${projFilePath}`);

        } catch (e) {
            console.error(`Error processing ${locale}:`, e.message);
        }
    }

    // Inject only CATEGORIES into project/index.html
    if (fs.existsSync(PROJECT_INDEX)) {
        let content = fs.readFileSync(PROJECT_INDEX, 'utf8');

        content = safeInject(content, '<!-- CATEGORIES_EN_START -->', '<!-- CATEGORIES_EN_END -->', catFragments['en']);
        content = safeInject(content, '<!-- CATEGORIES_FR_START -->', '<!-- CATEGORIES_FR_END -->', catFragments['fr']);

        fs.writeFileSync(PROJECT_INDEX, content);
        console.log('Successfully updated categories in index.html');
    }
}

run();
