/**
 * PROJECT DETAIL LOADER - RESTORED DESIGN VERSION
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
        // Fetch project data
        const response = await fetch(`${CONFIG.API_URL}/projects?filters[slug][$eq]=${slug}&locale=${lang}&populate=*`, {
            mode: 'cors',
            credentials: 'omit'
        });
        const json = await response.json();
        const data = CONFIG.flatten(json);
        const project = Array.isArray(data) ? data[0] : data;

        if (project) {
            injectProjectData(project);
            document.title = `${project.title} - Visio Architecture`;
        } else {
            console.error('Project not found');
            // Optional: Redirect or show simple alert
        }

    } catch (error) {
        console.error('Error loading project:', error);
    }
}

function injectProjectData(project) {
    // Debug: Log received data to help troubleshoot
    console.log('Antigravity: Injecting Project Data', project);

    // Helper to safely set text content
    const setText = (id, content) => {
        const el = document.getElementById(id);
        if (!el) return;

        // Handle Strapi v5 Rich Text (Blocks)
        if (Array.isArray(content)) {
            // Simple extractor for Blocks: grab text from first paragraph
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
        // Debug
        // console.log(`Setting Image ${id}:`, content);

        if (!el || !content?.url) {
            // If content is missing, maybe hide the element or leave placeholder?
            // Leaving placeholder (Loading...) might be confusing if data never comes.
            // Let's clear the placeholder if no image.
            if (el.tagName === 'IMG' && !content) el.style.opacity = '0.5';
            return;
        }

        const url = content.url.startsWith('http') ? content.url : CONFIG.STRAPI_URL + content.url;

        if (isBackground) {
            // Safer style injection that preserves existing layout styles
            // We use cssText to append or safely overwrite known properties
            el.style.backgroundImage = `url('${url}')`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            // Force it with !important using a trick if normal style assignment fails due to CSS specificity
            el.style.cssText += `background-image: url('${url}') !important; background-size: cover !important;`;
        } else {
            // Standard <img> tags
            el.src = url;
            el.alt = content.alternativeText || project.title || 'Project Image';
            el.srcset = ''; // Clear hardcoded srcset from Elementor if present
        }
    };

    // --- INJECTION MAPPING ---

    // 1. Header / Hero
    setText('project-subtitle', project.subtitle); // <h3>
    setText('project-title', project.title);       // <h1>
    setText('project-welcome', project.welcome_text); // <p>

    // 2. Meta Info
    setText('project-client', project.client);     // <h4>
    setText('project-date', project.date);         // <h4>

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

    // 7. Collaboration / Footer Quote
    if (project.collaboration_quote) {
        const quoteEl = document.getElementById('project-collaboration-quote');
        // Handle potentially rich text quote or simple string
        if (quoteEl) quoteEl.textContent = project.collaboration_quote;
    }
}
