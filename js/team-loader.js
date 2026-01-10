/**
 * TEAM LOADER
 * Fetches team members from Strapi and renders them into the About Us page
 * Uses ContentLoader for intelligent caching and robust loading
 */

(function () {
    'use strict';

    // Cache configuration
    const CONTENT_TYPE = 'team_members';
    // No specific local direct cache used here as ContentLoader handles it

    /**
     * Initialize Team Loading
     */
    async function initTeam() {
        // First, hide all main team slots immediately to prevent flash of empty content
        hideAllMainTeamSlots();

        // Load content via ContentLoader
        if (typeof ContentLoader !== 'undefined') {
            await ContentLoader.load({
                type: CONTENT_TYPE,
                // We use a general URL without language if team is not localized, 
                // but if localized team members are needed, we can add ?locale=${lang}
                url: `${CONFIG.API_URL}/team-members?populate=*&sort=order:asc`,
                containerId: 'team-section-trigger', // Dummy ID or wrapper if needed, but we handle rendering manually
                renderFn: (items) => {
                    // This is a custom render path since we have a specific slot-based layout for the first 4 members
                    if (Array.isArray(items) && items.length > 0) {
                        updateMainTeam(items.slice(0, 4));
                        updateExtendedTeam(items.slice(4));
                    }
                    return ''; // ContentLoader handles DOM if we return HTML, but we do it manually for slots
                },
                skeletonCount: 0, // We handle our own layout for slots
                onSuccess: (items, source) => {
                    console.log(`[Team] Loaded ${items.length} members from ${source}`);
                },
                onError: (error) => {
                    console.error('[Team] Load error:', error);
                }
            });
        } else {
            // Fallback to direct fetch (as previously implemented but optimized)
            await fetchTeamMembersDirect();
        }
    }

    /**
     * Hide the initial 4 slots
     */
    function hideAllMainTeamSlots() {
        for (let i = 1; i <= 4; i++) {
            const slot = document.getElementById(`team-slot-${i}`);
            if (slot) {
                slot.style.display = 'none';
                const parentContainer = slot.closest('.e-con.e-child');
                if (parentContainer) {
                    parentContainer.style.display = 'none';
                }
            }
        }
    }

    /**
     * Direct Fetch Fallback
     */
    async function fetchTeamMembersDirect() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/team-members?populate=*&sort=order:asc`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const members = data.data;

            if (members && members.length > 0) {
                updateMainTeam(members.slice(0, 4));
                updateExtendedTeam(members.slice(4));
            }
        } catch (error) {
            console.error('[Team] Direct fetch error:', error);
        }
    }

    /**
     * Update the first 4 slots
     */
    function updateMainTeam(members) {
        const maxSlots = 4;

        for (let i = 0; i < maxSlots; i++) {
            const slotId = `team-slot-${i + 1}`;
            const slot = document.getElementById(slotId);

            if (slot) {
                if (i < members.length) {
                    const attr = members[i];

                    // Show the slot and parent
                    slot.style.display = 'block';
                    slot.classList.remove('elementor-invisible');
                    const parentContainer = slot.closest('.e-con.e-child');
                    if (parentContainer) {
                        parentContainer.style.display = 'flex';
                    }

                    // Populate data
                    populateMemberData(slot, attr);
                } else {
                    // Hide unused slots
                    slot.style.display = 'none';
                    const parentContainer = slot.closest('.e-con.e-child');
                    if (parentContainer) {
                        parentContainer.style.display = 'none';
                    }
                }
            }
        }
    }

    /**
     * Helper to populate a slot with data
     */
    function populateMemberData(slot, attr) {
        // Image
        const img = slot.querySelector('.qodef-m-media-image img');
        if (img && attr.photo) {
            img.src = CONFIG.getImageUrl(attr.photo);
            img.srcset = '';
            img.alt = attr.name;
        }

        // Name
        const title = slot.querySelector('.qodef-m-title');
        if (title) title.innerHTML = `<strong>${attr.name}</strong>`;

        // Role
        const role = slot.querySelector('.qodef-m-role');
        if (role) role.innerHTML = `<strong>${attr.role}</strong>`;

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

    /**
     * Update social links for a member
     */
    function updateSocialLinks(container, attr) {
        const socialLinks = container.querySelectorAll('.qodef-e-social-icon-link');

        socialLinks.forEach(link => {
            const svg = link.querySelector('svg');
            if (!svg) return;

            let shouldShow = false;
            let href = '#';

            if (svg.classList.contains('e-fab-facebook')) {
                if (attr.facebook_link) { href = attr.facebook_link; shouldShow = true; }
            } else if (svg.classList.contains('e-fab-twitter')) {
                if (attr.twitter_link) { href = attr.twitter_link; shouldShow = true; }
            } else if (svg.classList.contains('e-fab-instagram')) {
                if (attr.instagram_link) { href = attr.instagram_link; shouldShow = true; }
            } else if (svg.classList.contains('e-far-envelope')) {
                if (attr.email) { href = `mailto:${attr.email}`; shouldShow = true; }
            }

            if (shouldShow) {
                link.href = href;
                link.style.display = 'inline-flex';
            } else {
                link.style.display = 'none';
            }
        });
    }

    /**
     * Update the extended grid for extra members
     */
    function updateExtendedTeam(members) {
        const gridContainer = document.querySelector('.team-grid-container');
        if (!gridContainer) return;

        if (!members || members.length === 0) {
            // Hide see-more button if no extra members
            const seeMoreWrapper = document.querySelector('.qodef-m-see-more');
            if (seeMoreWrapper) seeMoreWrapper.style.display = 'none';
            return;
        }

        gridContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();

        members.forEach(member => {
            const photoUrl = CONFIG.getImageUrl(member.photo, 'public/team/placeholder.jpeg');

            const div = document.createElement('div');
            div.className = 'team-member-card';
            div.innerHTML = `
                <div class="qodef-shortcode qodef-m qodef-qi-team-member qodef-item-layout--info-from-bottom qodef-image--hover-zoom">
                    <div class="qodef-m-inner">
                        <div class="qodef-m-image">
                            <div class="qodef-m-media-image">
                                <img loading="lazy" decoding="async" src="${photoUrl}" class="attachment-full size-full" alt="${member.name}" style="width: 100%; height: auto; object-fit: cover; aspect-ratio: 1080/1215;">
                            </div>
                        </div>
                        <div class="qodef-m-content">
                            <h4 itemprop="name" class="qodef-m-title"><strong>${member.name}</strong></h4>
                            <p class="qodef-m-role"><strong>${member.role}</strong></p>
                            <p class="qodef-m-description">${member.description || ''}</p>
                            <div class="qodef-m-social-icons">
                                ${generateSocialLinkHTML(member.facebook_link, 'facebook')}
                                ${generateSocialLinkHTML(member.twitter_link, 'twitter')}
                                ${generateSocialLinkHTML(member.instagram_link, 'instagram')}
                                ${generateSocialLinkHTML(member.email, 'envelope', true)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            fragment.appendChild(div);
        });

        gridContainer.appendChild(fragment);
    }

    /**
     * Helper to generate social link HTML for dynamic grid
     */
    function generateSocialLinkHTML(link, type, isEmail = false) {
        if (!link) return '';

        const href = isEmail ? `mailto:${link}` : link;
        const svgMap = {
            facebook: {
                viewBox: "0 0 512 512",
                path: "M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z",
                class: "e-fab-facebook"
            },
            twitter: {
                viewBox: "0 0 512 512",
                path: "M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z",
                class: "e-fab-twitter"
            },
            instagram: {
                viewBox: "0 0 448 512",
                path: "M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z",
                class: "e-fab-instagram"
            },
            envelope: {
                viewBox: "0 0 512 512",
                path: "M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm0 48v40.805c-22.422 18.259-58.168 46.651-134.587 106.49-16.841 13.247-50.201 45.072-73.413 44.701-23.208.375-56.579-31.459-73.413-44.701C106.18 199.465 70.425 171.067 48 152.805V112h416zM48 400V214.398c22.914 18.251 55.409 43.862 104.938 82.646 21.857 17.205 60.134 55.186 103.062 54.955 42.717.231 80.509-37.199 103.053-54.947 49.528-38.783 82.032-64.401 104.947-82.653V400H48z",
                class: "e-far-envelope"
            }
        };

        const icon = svgMap[type];
        if (!icon) return '';

        return `
            <a class="qodef-e-social-icon-link" itemprop="url" href="${href}" target="_blank">
                <span class="qodef-e-social-icon">
                    <svg aria-hidden="true" class="e-font-icon-svg ${icon.class}" viewBox="${icon.viewBox}" xmlns="http://www.w3.org/2000/svg">
                        <path d="${icon.path}"></path>
                    </svg>
                </span>
            </a>
        `;
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTeam);
    } else {
        initTeam();
    }

})();
