/**
 * SOCIAL DETAIL LOADER
 * Fetches specific social item by slug and populates socialopen.html
 */

document.addEventListener('DOMContentLoaded', initSocialDetail);

async function initSocialDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('social');

    if (!slug) {
        console.warn('No social slug found in URL');
        document.getElementById('news-content').innerHTML = '<p>No article specified.</p>';
        return;
    }

    const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

    try {
        const response = await fetch(`${CONFIG.API_URL}/socials?filters[slug][$eq]=${slug}&locale=${lang}&populate=*`, {
            mode: 'cors',
            credentials: 'omit'
        });

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

        const json = await response.json();
        const data = CONFIG.flatten(json);
        const item = Array.isArray(data) ? data[0] : data;

        if (item) {
            renderSocialItem(item);
            document.title = `${item.title} - Visio Architecture`;
        } else {
            document.getElementById('news-content').innerHTML = '<p>Article not found.</p>';
        }

    } catch (error) {
        console.error('Error loading social detail:', error);
        document.getElementById('news-content').innerHTML = `<p style="color:red">Error loading article: ${error.message}</p>`;
    }
}

function renderSocialItem(item) {
    const titleEl = document.getElementById('news-title');
    if (titleEl) titleEl.textContent = item.title;

    const dateEl = document.getElementById('news-date');
    if (dateEl && item.date) {
        dateEl.textContent = new Date(item.date).toLocaleDateString();
        dateEl.setAttribute('datetime', item.date);
    }

    const catEl = document.getElementById('news-category');
    if (catEl && item.category) {
        catEl.textContent = item.category;
    }

    const imgEl = document.getElementById('news-main-image');
    if (imgEl && item.main_image?.url) {
        const url = CONFIG.getImageUrl(item.main_image);
        imgEl.style.backgroundImage = `url('${url}')`;
    }

    const contentEl = document.getElementById('news-content');
    if (contentEl) {
        if (item.content) {
            contentEl.innerHTML = renderRichText(item.content);
        } else if (item.excerpt) {
            contentEl.innerHTML = `<p>${item.excerpt}</p>`;
        }
    }

    updateSocialSharing(item);
    loadRelatedContent(item);
}

async function loadRelatedContent(item) {
    const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

    try {
        const prevResponse = await fetch(`${CONFIG.API_URL}/socials?filters[date][$lt]=${item.date}&locale=${lang}&sort[0]=date:desc&pagination[limit]=1&populate=*`, {
            mode: 'cors',
            credentials: 'omit'
        });
        if (prevResponse.ok) {
            const prevJson = await prevResponse.json();
            const prevData = CONFIG.flatten(prevJson);
            const prevItem = Array.isArray(prevData) ? prevData[0] : prevData;
            if (prevItem) {
                renderPreviousPost(prevItem);
            }
        }
    } catch (e) {
        console.error('Error loading previous post:', e);
    }

    try {
        const relatedResponse = await fetch(`${CONFIG.API_URL}/socials?filters[category][$eq]=${item.category}&filters[id][$ne]=${item.id}&locale=${lang}&pagination[limit]=3&populate=*`, {
            mode: 'cors',
            credentials: 'omit'
        });
        if (relatedResponse.ok) {
            const relatedJson = await relatedResponse.json();
            const relatedData = CONFIG.flatten(relatedJson);
            const relatedItems = Array.isArray(relatedData) ? relatedData : (relatedData ? [relatedData] : []);
            if (relatedItems.length > 0) {
                renderRelatedPosts(relatedItems);
            }
        }
    } catch (e) {
        console.error('Error loading related posts:', e);
    }
}

function renderPreviousPost(item) {
    const container = document.getElementById('previous-post-container');
    if (!container) return;

    let imageUrl = '';
    if (item.main_image?.url) {
        imageUrl = CONFIG.getImageUrl(item.main_image);
    }

    const html = `
        <div class="nav-previous">
            <a class="nav-image-link" href="./?social=${item.slug}">
                <img src="${imageUrl}" alt="${item.title}">
            </a>
            <div class="nav-desc">
                <h4>Previous Post</h4>
                <a href="./?social=${item.slug}" rel="prev">
                    <span class="meta-nav">&#8592;</span> ${item.title}
                </a>
            </div>
            <a class="nav-overlay-link" href="./?social=${item.slug}" rel="prev">
                ${item.title}
            </a>
        </div>
    `;
    container.innerHTML = html;
    container.style.display = 'block';
}

function renderRelatedPosts(items) {
    const section = document.getElementById('related-posts-section');
    const grid = document.getElementById('related-posts-grid');
    if (!section || !grid) return;

    grid.innerHTML = items.map(item => {
        let imageUrl = '';
        if (item.main_image?.url) {
            imageUrl = CONFIG.getImageUrl(item.main_image);
        }

        return `
            <div class="block">
                <div class="post-thumbnail" style="background-image: url('${imageUrl}');">
                    <div class="post-wrap">
                        <header class="entry-header">
                            <div class="entry-meta">
                                <span class="cat-links"><a href="#">${item.category}</a></span>
                            </div>
                            <h2 class="entry-title">
                                <a href="./?social=${item.slug}">${item.title}</a>
                            </h2>
                            <a class="more-link" href="./?social=${item.slug}">View Post</a>
                        </header>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    section.style.display = 'block';
}

function updateSocialSharing(item) {
    const pageUrl = window.location.href;
    const title = encodeURIComponent(item.title);
    const encodedUrl = encodeURIComponent(pageUrl);
    const excerpt = item.excerpt || '';

    let imageUrl = '';
    if (item.main_image?.url) {
        imageUrl = CONFIG.getImageUrl(item.main_image);
    }

    const setMeta = (id, content) => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('content', content);
    };

    setMeta('og-title', item.title);
    setMeta('og-description', excerpt);
    setMeta('og-image', imageUrl);
    setMeta('og-url', pageUrl);

    setMeta('twitter-title', item.title);
    setMeta('twitter-description', excerpt);
    setMeta('twitter-image', imageUrl);

    const updateLink = (id, href) => {
        const el = document.getElementById(`${id}-bottom`);
        if (el) el.href = href;
    };

    updateLink('share-facebook', `https://www.facebook.com/sharer.php?u=${encodedUrl}`);
    updateLink('share-twitter', `https://twitter.com/intent/tweet?text=${encodeURIComponent('Currently reading: ' + item.title)}&url=${encodedUrl}`);
    updateLink('share-pinterest', `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(imageUrl)}&description=${title}`);
    updateLink('share-mail', `mailto:?subject=${encodeURIComponent('Check out this post: ' + item.title)}&body=${encodeURIComponent('I wanted you to see this: ' + pageUrl)}`);
}

function renderRichText(content) {
    if (typeof content === 'string') {
        return content.replace(/\n/g, '<br>');
    }

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
                const url = CONFIG.getImageUrl(img);
                return `<figure><img src="${url}" alt="${img.alternativeText || ''}"><figcaption>${img.caption || ''}</figcaption></figure>`;
            }
            return '';
        }).join('');
    }

    return '';
}
