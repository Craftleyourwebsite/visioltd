/**
 * PROJECT DETAIL LOADER - PRODUCTION VERSION
 * Injects Strapi data into the existing HTML structure by targeting specific IDs.
 */

document.addEventListener('DOMContentLoaded', () => {
    initProjectDetail();
});

async function initProjectDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('project');

    if (!slug) {
        console.warn('No project slug found.');
        return;
    }

    // Language detection
    const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

    try {
        // Use simpler populate to ensure reliability
        const apiUrl = `${CONFIG.API_URL}/projects?filters[slug][$eq]=${slug}&locale=${lang}&populate=*`;

        const response = await fetch(apiUrl, {
            mode: 'cors',
            credentials: 'omit'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();
        const data = CONFIG.flatten(json);
        const project = Array.isArray(data) ? data[0] : data;

        if (project) {
            injectProjectData(project);
            document.title = `${project.title} - Visio Architecture`;
        } else {
            console.error('Project not found with slug:', slug);
        }

    } catch (error) {
        console.error('Error loading project:', error);
    }
}

function injectProjectData(project) {
    // Helper to safely set text content
    const setText = (id, content) => {
        const el = document.getElementById(id);
        if (!el) return;

        // Handle Strapi v5 Rich Text (Blocks)
        if (Array.isArray(content)) {
            const text = content
                .filter(block => block.type === 'paragraph' || block.type === 'heading')
                .map(block => block.children?.map(c => c.text).join('') || '')
                .join('\n\n');
            el.textContent = text || '';
            return;
        }

        if (content) el.textContent = content;
    };

    // Helper for images (handling both <img> src and background-image)
    const setImage = (id, content, isBackground = false) => {
        const el = document.getElementById(id);

        if (!el || !content?.url) {
            if (el && el.tagName === 'IMG' && !content) el.style.opacity = '0.5';
            return;
        }

        const url = content.url.startsWith('http') ? content.url : CONFIG.STRAPI_URL + content.url;

        if (isBackground) {
            el.style.backgroundImage = `url('${url}')`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            el.style.cssText += `background-image: url('${url}') !important; background-size: cover !important;`;
        } else {
            el.src = url;
            el.alt = content.alternativeText || project.title || 'Project Image';
            el.srcset = '';
        }
    };

    // --- INJECTION MAPPING ---

    // 1. Header / Hero
    setText('project-subtitle', project.subtitle);
    setText('project-title', project.title);
    setText('project-welcome', project.welcome_text);

    // 2. Meta Info
    setText('project-client', project.client);
    setText('project-date', project.date);

    // 3. Main Image (Background Parallax)
    setImage('project-main-image', project.main_image, true);

    // 4. "The Idea" Section
    setText('project-idea-title', project.idea_title);
    setText('project-idea-author', project.idea_author);
    setText('project-idea-description', project.idea_description);

    // 5. "Vision" Section
    setText('project-vision-title', project.vision_title);
    setText('project-vision-description', project.vision_description);
    setImage('project-vision-image', project.vision_image);

    // 6. "Fundamentals" Section
    setText('project-fundamentals-title', project.fundamentals_title);
    setText('project-fundamentals-description', project.fundamentals_description);
    setImage('project-fundamentals-image', project.fundamentals_image);

    // 7. Gallery
    const galleryGrid = document.getElementById('project-gallery-grid');
    const gallerySection = document.getElementById('project-gallery-section');

    let galleryItems = [];
    if (Array.isArray(project.gallery)) {
        galleryItems = project.gallery;
    } else if (project.gallery && project.gallery.data) {
        galleryItems = Array.isArray(project.gallery.data) ? project.gallery.data : [project.gallery.data];
    } else if (project.gallery) {
        galleryItems = [project.gallery];
    }

    if (galleryGrid && galleryItems.length > 0) {
        gallerySection.style.display = 'block';
        galleryGrid.innerHTML = '';

        galleryItems.forEach((img, index) => {
            const item = img.attributes ? { ...img.attributes, id: img.id } : img;
            const rawUrl = item.url || (item.data && item.data.attributes && item.data.attributes.url);

            if (!rawUrl) return;

            const imageUrl = rawUrl.startsWith('http') ? rawUrl : CONFIG.STRAPI_URL + rawUrl;

            const itemHTML = `
                <div class="qodef-e qodef-image-wrapper qodef-grid-item">
                    <div class="qodef-e-inner">
                        <a class="qodef-popup-item" data-fslightbox="project-gallery" data-type="image" href="${imageUrl}">
                            <img src="${imageUrl}" alt="${item.alternativeText || ''}">
                        </a>
                    </div>
                </div>
            `;
            galleryGrid.insertAdjacentHTML('beforeend', itemHTML);
        });

        setTimeout(() => {
            if (typeof refreshFsLightbox === 'function') {
                refreshFsLightbox();
            } else if (window.refreshFsLightbox) {
                window.refreshFsLightbox();
            }
        }, 500);
    } else {
        if (gallerySection) gallerySection.style.display = 'none';
    }
}
