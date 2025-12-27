/**
 * NEWS DETAIL LOADER
 * Fetches specific news item by slug and populates newsopen.html
 */

document.addEventListener('DOMContentLoaded', initNewsDetail);

async function initNewsDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('news');

    if (!slug) {
        console.warn('No news slug found in URL');
        document.getElementById('news-content').innerHTML = '<p>No article specified.</p>';
        return;
    }

    const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

    try {
        const response = await fetch(`${CONFIG.API_URL}/news?filters[slug][$eq]=${slug}&locale=${lang}&populate=*`, {
            mode: 'cors',
            credentials: 'omit'
        });

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

        const json = await response.json();
        const data = CONFIG.flatten(json);
        const item = Array.isArray(data) ? data[0] : data;

        if (item) {
            renderNewsItem(item);
            document.title = `${item.title} - Visio Architecture`;
        } else {
            document.getElementById('news-content').innerHTML = '<p>Article not found.</p>';
        }

    } catch (error) {
        console.error('Error loading news detail:', error);
        document.getElementById('news-content').innerHTML = `<p style="color:red">Error loading article: ${error.message}</p>`;
    }
}

function renderNewsItem(item) {
    // 1. Title
    const titleEl = document.getElementById('news-title');
    if (titleEl) titleEl.textContent = item.title;

    // 2. Date
    const dateEl = document.getElementById('news-date');
    if (dateEl && item.date) {
        dateEl.textContent = new Date(item.date).toLocaleDateString();
        dateEl.setAttribute('datetime', item.date);
    }

    // 3. Category
    const catEl = document.getElementById('news-category');
    if (catEl && item.category) {
        catEl.textContent = item.category;
    }

    // 4. Main Image (Background)
    const imgEl = document.getElementById('news-main-image');
    if (imgEl && item.main_image?.url) {
        const url = item.main_image.url.startsWith('http') ? item.main_image.url : CONFIG.STRAPI_URL + item.main_image.url;
        imgEl.style.backgroundImage = `url('${url}')`;
    }

    // 5. Content
    const contentEl = document.getElementById('news-content');
    if (contentEl) {
        if (item.content) {
            contentEl.innerHTML = renderRichText(item.content);
        } else if (item.excerpt) {
            contentEl.innerHTML = `<p>${item.excerpt}</p>`;
        }
    }
}

function renderRichText(content) {
    // Handle Markdown string
    if (typeof content === 'string') {
        // Simple trivial markdown parser (replace with a lib if needed, but for now simple checks)
        // Or if Strapi returns markdown, usually we need a markdown parser. 
        // Assuming simple text for now if string.
        return content.replace(/\n/g, '<br>');
    }

    // Handle Strapi Blocks (JSON)
    if (Array.isArray(content)) {
        return content.map(block => {
            if (block.type === 'paragraph') {
                const text = block.children?.map(c => {
                    let t = c.text || '';
                    if (c.bold) t = `<strong>${t}</strong>`;
                    if (c.italic) t = `<em>${t}</em>`;
                    if (c.underline) t = `<u>${t}</u>`;
                    if (c.strikethrough) t = `<s>${t}</s>`;
                    if (c.code) t = `<code>${t}</code>`;
                    return t;
                }).join('') || '';
                // Only render paragraph if it has text
                return text.trim() ? `<p>${text}</p>` : '';
            }
            if (block.type === 'heading') {
                const text = block.children?.map(c => c.text).join('') || '';
                return `<h${block.level}>${text}</h${block.level}>`;
            }
            if (block.type === 'list') {
                const tag = block.format === 'ordered' ? 'ol' : 'ul';
                const items = block.children?.map(li => {
                    const liText = li.children?.map(c => c.text).join('') || '';
                    return `<li>${liText}</li>`;
                }).join('');
                return `<${tag}>${items}</${tag}>`;
            }
            if (block.type === 'quote') {
                const text = block.children?.map(c => c.text).join('') || '';
                return `<blockquote>${text}</blockquote>`;
            }
            if (block.type === 'image') {
                const img = block.image;
                if (!img) return '';
                const url = img.url.startsWith('http') ? img.url : CONFIG.STRAPI_URL + img.url;
                return `<figure><img src="${url}" alt="${img.alternativeText || ''}"><figcaption>${img.caption || ''}</figcaption></figure>`;
            }
            return '';
        }).join('');
    }

    return '';
}
