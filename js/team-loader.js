/**
 * TEAM LOADER
 * Fetches team members from Strapi and renders them into the About Us page
 * Optimized for production with intelligent caching and error handling
 */

(function () {
    'use strict';

    const CONTENT_TYPE = 'team_members';
    const CACHE_TTL = 300000; // 5 minutes

    /**
     * Initialize Team Loading
     */
    async function initTeam() {
        // Expose toggle function globally for the See More button
        window.toggleTeamExpansion = function (e) {
            if (e) e.preventDefault();

            // Show all hidden members
            const hiddenMembers = document.querySelectorAll('.team-member-hidden');
            hiddenMembers.forEach(member => {
                member.classList.remove('team-member-hidden');
                // Remove inline display:none and verify display:flex is active (from CSS or added)
                member.style.display = '';
                member.style.removeProperty('display');

                // If CSS isn't loading, fallback to inline flex
                if (getComputedStyle(member).display === 'none') {
                    member.style.display = 'flex';
                }
            });

            // Hide the button itself
            const btnWrapper = document.querySelector('.qodef-m-see-more');
            if (btnWrapper) btnWrapper.style.display = 'none';
        };

        const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

        // 1. Hide slots immediately
        hideAllMainTeamSlots();

        try {
            // 2. ALWAYS fetch fresh data from Strapi
            const url = `${CONFIG.API_URL}/team-members?populate=*&sort=order:asc`;
            console.log('[Team] Fetching from:', url);

            const response = await (typeof ContentLoader !== 'undefined'
                ? ContentLoader.fetchWithRetry(url)
                : fetch(url).then(r => r.json()));
            let freshMembers = CONFIG.flatten(response);

            // IMPORTANT: Sort by order to ensure correct display order
            if (Array.isArray(freshMembers)) {
                freshMembers = freshMembers.sort((a, b) => {
                    const orderA = a.order !== undefined && a.order !== null ? a.order : 9999;
                    const orderB = b.order !== undefined && b.order !== null ? b.order : 9999;
                    return orderA - orderB;
                });
                console.log('[Team] Members sorted by order:');
                freshMembers.forEach((m, i) => console.log(`  ${i}: ${m.name} (order: ${m.order})`));
            }

            if (Array.isArray(freshMembers) && freshMembers.length > 0) {
                // Update cache with fresh sorted data
                if (typeof ContentCache !== 'undefined') {
                    ContentCache.set(CONTENT_TYPE, lang, freshMembers);
                }

                // ALWAYS update display with fresh data
                console.log('[Team] Updating display with fresh data');
                updateMainTeam(freshMembers.slice(0, 4));
                updateExtendedTeam(freshMembers.slice(4));
            }

        } catch (error) {
            console.error('[Team] Initialization error:', error);

            // Fallback: Show cached data if network fails
            if (typeof ContentCache !== 'undefined') {
                const cached = ContentCache.get(CONTENT_TYPE, lang);
                if (cached && cached.data) {
                    console.log('[Team] Using cache as fallback');
                    updateMainTeam(cached.data.slice(0, 4));
                    updateExtendedTeam(cached.data.slice(4));
                }
            }
        }
    }

    function hideAllMainTeamSlots() {
        for (let i = 1; i <= 4; i++) {
            const slot = document.getElementById(`team-slot-${i}`);
            if (slot) {
                slot.style.display = 'none';
                const parentContainer = slot.closest('.e-con.e-child');
                if (parentContainer) parentContainer.style.display = 'none';
            }
        }
    }

    function updateMainTeam(members) {
        members.forEach((member, i) => {
            const slot = document.getElementById(`team-slot-${i + 1}`);
            if (slot) {
                slot.style.display = 'block';
                slot.classList.remove('elementor-invisible');
                const parentContainer = slot.closest('.e-con.e-child');
                if (parentContainer) parentContainer.style.display = 'flex';
                populateMemberData(slot, member);
            }
        });
    }

    function populateMemberData(slot, attr) {
        // Image
        const img = slot.querySelector('.qodef-m-media-image img');
        if (img && attr.photo) {
            // Use optimized URL if possible
            const photoUrl = CONFIG.getOptimizedImageUrl ? CONFIG.getOptimizedImageUrl(attr.photo, 'large') : CONFIG.getImageUrl(attr.photo);
            img.src = photoUrl;
            img.srcset = '';
            img.alt = attr.name || '';
        }

        // Name
        const title = slot.querySelector('.qodef-m-title');
        if (title) title.innerHTML = `<strong>${attr.name || ''}</strong>`;

        // Role
        const role = slot.querySelector('.qodef-m-role');
        if (role) role.innerHTML = `<strong>${attr.role || ''}</strong>`;

        // Description
        let desc = slot.querySelector('.qodef-m-description');
        if (!desc && role) {
            desc = document.createElement('p');
            desc.className = 'qodef-m-description';
            role.parentNode.insertBefore(desc, role.nextSibling);
        }
        if (desc) desc.innerText = attr.description || '';

        // Socials
        updateSocialLinks(slot, attr);
    }

    function updateSocialLinks(container, attr) {
        const socialLinksContainer = container.querySelector('.qodef-m-social-icons');
        if (!socialLinksContainer) return;

        // Clear all existing links first, then rebuild based on available data
        const existingLinks = socialLinksContainer.querySelectorAll('.qodef-e-social-icon-link');
        existingLinks.forEach(link => link.style.display = 'none');

        // Define icon paths
        const iconPaths = {
            facebook: "M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z",
            twitter: "M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z",
            linkedin: "M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z",
            envelope: "M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm0 48v40.805c-22.422 18.259-58.168 46.651-134.587 106.49-16.841 13.247-50.201 45.072-73.413 44.701-23.208.375-56.579-31.459-73.413-44.701C106.18 199.465 70.425 171.067 48 152.805V112h416zM48 400V214.398c22.914 18.251 55.409 43.862 104.938 82.646 21.857 17.205 60.134 55.186 103.062 54.955 42.717.231 80.509-37.199 103.053-54.947 49.528-38.783 82.032-64.401 104.947-82.653V400H48z"
        };

        // Helper to create a new social link
        function createSocialLink(href, type) {
            const vb = (type === 'linkedin') ? "0 0 448 512" : "0 0 512 512";
            const iconClass = (type === 'envelope') ? 'e-far-envelope' : `e-fab-${type}`;
            const a = document.createElement('a');
            a.className = 'qodef-e-social-icon-link';
            a.setAttribute('itemprop', 'url');
            a.href = href;
            a.target = '_blank';
            a.style.display = 'inline-flex';
            a.innerHTML = `
                <span class="qodef-e-social-icon">
                    <svg aria-hidden="true" class="e-font-icon-svg ${iconClass}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">
                        <path d="${iconPaths[type]}"></path>
                    </svg>
                </span>
            `;
            return a;
        }

        // Add social links based on available data
        if (attr.facebook_link) {
            socialLinksContainer.appendChild(createSocialLink(attr.facebook_link, 'facebook'));
        }
        if (attr.twitter_link) {
            socialLinksContainer.appendChild(createSocialLink(attr.twitter_link, 'twitter'));
        }
        if (attr.linkedin_link) {
            socialLinksContainer.appendChild(createSocialLink(attr.linkedin_link, 'linkedin'));
        }
        if (attr.email) {
            socialLinksContainer.appendChild(createSocialLink(`mailto:${attr.email}`, 'envelope'));
        }
    }

    function updateExtendedTeam(members) {
        // Target the MAIN container now
        const mainContainer = document.querySelector('.elementor-element-af195fa');
        if (!mainContainer) return;

        // Hide the old separate container (and the see more button from that section if it was separate)
        const oldGridContainer = document.querySelector('.team-grid-container');
        if (oldGridContainer) oldGridContainer.style.display = 'none';

        const seeMoreWrapper = document.querySelector('.qodef-m-see-more');

        // Remove any previously added extended members to avoid duplicates
        const existingExtended = mainContainer.querySelectorAll('.team-member-card');
        existingExtended.forEach(el => el.remove());

        if (!members || members.length === 0) {
            if (seeMoreWrapper) seeMoreWrapper.style.display = 'none';
            return;
        } else {
            if (seeMoreWrapper) seeMoreWrapper.style.display = 'block';
        }

        const fragment = document.createDocumentFragment();

        members.forEach(member => {
            const photoUrl = CONFIG.getOptimizedImageUrl ? CONFIG.getOptimizedImageUrl(member.photo, 'medium') : CONFIG.getImageUrl(member.photo);
            const div = document.createElement('div');
            // Added 'elementor-element' to ensure it matches the CSS selector if needed, 
            // though we will also update CSS to be sure.
            // Added 'team-member-hidden' class for reference
            div.className = 'team-member-card elementor-element elementor-widget elementor-widget-qi_addons_for_elementor_team_member team-member-hidden';

            // FORCE HIDE using inline style to bypass any CSS caching issues
            div.style.display = 'none';
            div.style.setProperty('display', 'none', 'important'); // Double enforcement

            div.innerHTML = `
                <div class="elementor-widget-container">
                    <div class="qodef-shortcode qodef-m qodef-qi-team-member qodef-item-layout--info-from-bottom qodef-image--hover-zoom">
                        <div class="qodef-m-inner">
                            <div class="qodef-m-image">
                                <div class="qodef-m-media-image">
                                    <img loading="lazy" decoding="async" src="${photoUrl}" class="attachment-full size-full" alt="${member.name}" style="width: 100%; height: auto; object-fit: cover; aspect-ratio: 1080/1215;">
                                </div>
                            </div>
                            <div class="qodef-m-content">
                                <h4 itemprop="name" class="qodef-m-title"><strong>${member.name || ''}</strong></h4>
                                <p class="qodef-m-role"><strong>${member.role || ''}</strong></p>
                                <p class="qodef-m-description">${member.description || ''}</p>
                                <div class="qodef-m-social-icons">
                                    ${generateSocialLinkHTML(member.facebook_link, 'facebook')}
                                    ${generateSocialLinkHTML(member.twitter_link, 'twitter')}
                                    ${generateSocialLinkHTML(member.linkedin_link, 'linkedin')}
                                    ${generateSocialLinkHTML(member.email, 'envelope', true)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            fragment.appendChild(div);
        });

        // Append to the main container (making them siblings of the first 4 items)
        mainContainer.appendChild(fragment);
    }

    function generateSocialLinkHTML(link, type, isEmail = false) {
        if (!link) return '';
        const href = isEmail ? `mailto:${link}` : link;
        const iconPaths = {
            facebook: "M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z",
            twitter: "M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z",
            linkedin: "M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z",
            envelope: "M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm0 48v40.805c-22.422 18.259-58.168 46.651-134.587 106.49-16.841 13.247-50.201 45.072-73.413 44.701-23.208.375-56.579-31.459-73.413-44.701C106.18 199.465 70.425 171.067 48 152.805V112h416zM48 400V214.398c22.914 18.251 55.409 43.862 104.938 82.646 21.857 17.205 60.134 55.186 103.062 54.955 42.717.231 80.509-37.199 103.053-54.947 49.528-38.783 82.032-64.401 104.947-82.653V400H48z"
        };
        const iconClass = (type === 'envelope') ? 'e-far-envelope' : `e-fab-${type}`;
        const vb = (type === 'linkedin') ? "0 0 448 512" : "0 0 512 512";
        return `
            <a class="qodef-e-social-icon-link" itemprop="url" href="${href}" target="_blank">
                <span class="qodef-e-social-icon">
                    <svg aria-hidden="true" class="e-font-icon-svg ${iconClass}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">
                        <path d="${iconPaths[type]}"></path>
                    </svg>
                </span>
            </a>
        `;
    }

    // Run
    initTeam();

})();
