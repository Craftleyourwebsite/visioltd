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
    container.innerHTML = '<p style="text-align:center; padding: 40px; width: 100%;">Loading news...</p>';

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
                <div style="text-align: center; padding: 40px; width: 100%;">
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

        // Initialize Isotope after items are loaded and images are ready
        if (typeof imagesLoaded !== 'undefined' && typeof Isotope !== 'undefined') {
            imagesLoaded(container, function () {
                const iso = new Isotope(container, {
                    itemSelector: '.hentry',
                    layoutMode: 'fitRows'
                });

                // Filter logic
                const filters = document.getElementById('filters');
                if (filters) {
                    filters.addEventListener('click', function (e) {
                        const link = e.target.closest('a');
                        if (!link) return;
                        e.preventDefault();

                        // Update current class
                        filters.querySelectorAll('li').forEach(li => li.classList.remove('current'));
                        link.parentElement.classList.add('current');

                        const filterValue = link.getAttribute('data-filter');
                        iso.arrange({ filter: filterValue });
                    });
                }
            });
        }

    } catch (error) {
        console.error('Error loading news:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: red; width: 100%;">
                <h3>Error loading news</h3>
                <p>${error.message}</p>
            </div>`;
    }
}

function renderCategories(newsItems) {
    const container = document.getElementById('filters');
    if (!container) return;

    container.innerHTML = '';

    const categoryMap = new Map();

    newsItems.forEach(item => {
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
                categoryMap.set(slug, name);
            }
        });
    });

    // Add "All"
    const allLi = document.createElement('li');
    allLi.className = 'current';
    allLi.innerHTML = `<a data-filter="*" href="#">all</a>`;
    container.appendChild(allLi);

    categoryMap.forEach((name, slug) => {
        const li = document.createElement('li');
        li.innerHTML = `<a data-filter=".${slug}" href="#">${name}</a>`;
        container.appendChild(li);
    });
}

function createNewsCard(item) {
    const imgUrl = CONFIG.getImageUrl(item.main_image, '../public/section/1.jpeg');

    // Get slugs for filtering classes
    let cats = [];
    const rawCat = item.category || item.categorie || item.categories;
    if (Array.isArray(rawCat)) cats = rawCat;
    else if (rawCat) cats = [rawCat];

    const categoryClasses = cats.map(cat => {
        const slug = typeof cat === 'string' ? cat : (cat.slug || cat.name || cat.Name || '');
        return slug.toLowerCase().replace(/\s+/g, '-');
    }).join(' ');

    return `
    <div id="post-${item.id}" class="post-${item.id} portfolio hentry ${categoryClasses}">
        <div class="hentry-wrap">
            <div class="featured-image">
                <a href="../newsopen/?news=${item.slug}">
                    <img src="${imgUrl}" class="attachment-arkiz_image_size_4 size-arkiz_image_size_4 wp-post-image" alt="${item.title}" />
                </a>
            </div>
            <div class="hentry-middle">
                <header class="entry-header">
                    <h2 class="entry-title">
                        <a href="../newsopen/?news=${item.slug}">${item.title}</a>
                    </h2>
                </header>
            </div>
        </div>
    </div>
    `;
}

