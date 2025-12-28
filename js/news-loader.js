/**
 * NEWS LOADER
 * Fetches news from Strapi and renders them into #news-container
 */

document.addEventListener('DOMContentLoaded', () => {
    loadNews();
});

async function loadNews() {
    const container = document.getElementById('news-container');
    if (!container) return;

    // Optional: add a loader
    container.innerHTML = '<p style="text-align:center; padding: 40px;">Loading news...</p>';

    const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

    try {
        // Ensure we populate all relations to get the category
        const response = await fetch(`${CONFIG.API_URL}/news?locale=${lang}&populate=*&sort=date:desc`, {
            mode: 'cors',
            credentials: 'omit'
        });

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        const json = await response.json();
        const newsItems = CONFIG.flatten(json);

        if (!Array.isArray(newsItems) || newsItems.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h3>No news found</h3>
                    <p>Stay tuned for updates.</p>
                </div>`;
            renderCategories([]); // Clear categories if no news
            return;
        }

        container.innerHTML = ''; // Clear loader

        newsItems.forEach(item => {
            const html = createNewsCard(item);
            container.insertAdjacentHTML('beforeend', html);
        });

        // Extract and render categories based on the fetched news
        renderCategories(newsItems);

    } catch (error) {
        console.error('Error loading news:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: red;">
                <h3>Error loading news</h3>
                <p>${error.message}</p>
            </div>`;
    }
}

function renderCategories(newsItems) {
    const container = document.getElementById('gt-categories-list');
    if (!container) return;

    container.innerHTML = '';

    const categoryMap = new Map();

    newsItems.forEach(item => {
        // Check for 'category', 'categorie', 'categories'
        // Strapi might return it as an object (relation) or string
        let cats = [];

        const rawCat = item.category || item.categorie || item.categories;

        if (Array.isArray(rawCat)) {
            cats = rawCat;
        } else if (rawCat) {
            cats = [rawCat];
        }

        cats.forEach(cat => {
            let name = '';
            let slug = '';

            if (typeof cat === 'string') {
                name = cat;
                slug = cat.toLowerCase().replace(/\s+/g, '-');
            } else if (typeof cat === 'object' && cat !== null) {
                name = cat.name || cat.Name || cat.title || cat.Title || 'Untitled';
                slug = cat.slug || name.toLowerCase().replace(/\s+/g, '-');
            }

            if (name) {
                if (categoryMap.has(slug)) {
                    categoryMap.get(slug).count++;
                } else {
                    categoryMap.set(slug, { name, slug, count: 1 });
                }
            }
        });
    });

    if (categoryMap.size === 0) {
        container.innerHTML = '<li style="color:#999; font-size: 13px;">No categories found in news items.</li>';
        return;
    }

    // Add "All"
    const allLi = document.createElement('li');
    allLi.innerHTML = `<a href="news.html" class="gt-cat-active">All</a> <span class="gt-count">(${newsItems.length})</span>`;
    container.appendChild(allLi);

    categoryMap.forEach((val) => {
        const li = document.createElement('li');
        // Currently just a link, we can add filtering logic if needed later
        li.innerHTML = `<a href="news.html?category=${val.slug}">${val.name}</a> <span class="gt-count">(${val.count})</span>`;
        container.appendChild(li);
    });
}


function createNewsCard(item) {
    const imgUrl = CONFIG.getImageUrl(item.main_image, 'public/section/1.jpeg');

    // Format date
    const dateStr = item.date ? new Date(item.date).toLocaleDateString() : '';

    return `
    <div class="gt-blog-list-item gt-style-2">
        <div class="gt-img">
            <a href="newsopen.html?news=${item.slug}">
                <img src="${imgUrl}" alt="${item.title}" style="width: 100%; height: auto;">
                <div class="gt-overlay">
                    <div class="gt-overlay-color"></div>
                    <div class="gt-overlay-icon">
                        <svg xmlns="https://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
                            class="feather feather-arrow-right">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </div>
                </div>
            </a>
        </div>
        <div class="gt-content">
            <h3 class="gt-title">
                <a href="newsopen.html?news=${item.slug}">${item.title}</a>
            </h3>
            <p class="gt-excerpt">${item.excerpt || ''}</p>
            <span>
                <div class="gt-date">${dateStr}</div>
            </span>
        </div>
    </div>
    `;
}
