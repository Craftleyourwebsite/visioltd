/**
 * PREVIOUS TEAM LOADER
 * Fetches previous/former team members from Strapi and renders them into the About Us page
 * Uses the same card design as the main team section
 */

(function () {
    'use strict';

    const CONTENT_TYPE = 'previous_team_members';
    const CACHE_TTL = 300000; // 5 minutes
    const ITEMS_PER_PAGE = 4; // Show 4 members initially (1 row, same as Team section)

    /**
     * Initialize Previous Team Loading
     */
    async function initPreviousTeam() {
        const container = document.getElementById('previous-team-grid');
        if (!container) return;

        const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

        try {
            let cachedMembers = null;

            // Try to show cached data FIRST for instant display
            if (typeof ContentCache !== 'undefined') {
                const cached = ContentCache.get(CONTENT_TYPE, lang);
                if (cached && cached.data && cached.data.length > 0) {
                    cachedMembers = cached.data;
                    console.log('[PreviousTeam] Showing cached data instantly');
                    renderPreviousTeam(cachedMembers);
                }
            }

            // ALWAYS fetch fresh data from Strapi
            const url = `${CONFIG.API_URL}/previous-team-members?populate=*&sort=order:asc`;
            const response = await (typeof ContentLoader !== 'undefined'
                ? ContentLoader.fetchWithRetry(url)
                : fetch(url).then(r => r.json()));
            const freshMembers = CONFIG.flatten(response);

            if (Array.isArray(freshMembers) && freshMembers.length > 0) {
                // Update cache with fresh data
                if (typeof ContentCache !== 'undefined') {
                    ContentCache.set(CONTENT_TYPE, lang, freshMembers);
                }

                // Check if data changed - if so, update display
                const dataChanged = !cachedMembers ||
                    JSON.stringify(freshMembers) !== JSON.stringify(cachedMembers);

                if (dataChanged) {
                    console.log('[PreviousTeam] Fresh data received, updating display');
                    renderPreviousTeam(freshMembers);
                } else {
                    console.log('[PreviousTeam] Data unchanged, no update needed');
                }
            } else if (!cachedMembers) {
                // No data from API and no cache - hide section
                const section = document.getElementById('previous-team-section');
                if (section) section.style.display = 'none';
            }

        } catch (error) {
            console.error('[PreviousTeam] Initialization error:', error);

            // Fallback: Show cached data if network fails
            if (typeof ContentCache !== 'undefined') {
                const cached = ContentCache.get(CONTENT_TYPE, lang);
                if (cached && cached.data) {
                    console.log('[PreviousTeam] Using cache as fallback');
                    renderPreviousTeam(cached.data);
                }
            }
        }
    }

    /**
     * Render previous team members into the grid
     */
    function renderPreviousTeam(members) {
        const container = document.getElementById('previous-team-grid');

        if (!container) return;

        // Remove existing member cards and buttons
        const existingCards = container.querySelectorAll('.team-member-card');
        existingCards.forEach(card => card.remove());

        // Remove old see-more button if exists
        const oldSeeMoreBtn = container.querySelector('.qodef-m-see-more');
        if (oldSeeMoreBtn) oldSeeMoreBtn.remove();

        if (!members || members.length === 0) {
            const section = document.getElementById('previous-team-section');
            if (section) section.style.display = 'none';
            return;
        }

        const hasMoreThanFour = members.length > ITEMS_PER_PAGE;

        // Create cards for each member
        members.forEach((member, index) => {
            const card = createMemberCard(member);

            // IMPORTANT: Hide members beyond initial 4 with !important to override CSS
            if (index >= ITEMS_PER_PAGE) {
                card.classList.add('previous-team-hidden');
                card.style.setProperty('display', 'none', 'important');
            }

            // Add "See More" button on the 4th card (same design as Team section)
            if (index === ITEMS_PER_PAGE - 1 && hasMoreThanFour) {
                // Create the same button structure as Team section
                const seeMoreWrapper = document.createElement('div');
                seeMoreWrapper.className = 'qodef-m-see-more previous-see-more-btn';
                seeMoreWrapper.innerHTML = `
                    <a href="#" class="qodef-see-more-link" onclick="togglePreviousTeamExpansion(event)">
                        <span>+ see more</span>
                    </a>
                `;

                // Add button to the card's inner container (same position as Team section)
                const innerDiv = card.querySelector('.qodef-m-inner');
                if (innerDiv) {
                    innerDiv.appendChild(seeMoreWrapper);
                }
            }

            container.appendChild(card);
        });

        // Expose toggle function globally
        window.togglePreviousTeamExpansion = function (e) {
            if (e) e.preventDefault();

            const seeMoreLink = e.target.closest('.qodef-see-more-link');
            const hiddenMembers = container.querySelectorAll('.previous-team-hidden');

            if (hiddenMembers.length > 0) {
                // EXPAND: Show all hidden members with staggered animation
                hiddenMembers.forEach((member, idx) => {
                    setTimeout(() => {
                        member.classList.remove('previous-team-hidden');
                        member.style.removeProperty('display');
                        member.style.animation = 'slideInUp 0.5s ease-out forwards';

                        // Ensure display is correct for grid layout
                        if (getComputedStyle(member).display === 'none') {
                            member.style.display = 'flex';
                        }
                    }, idx * 100); // Stagger each card by 100ms
                });

                // Update button text to "see less"
                if (seeMoreLink) {
                    seeMoreLink.innerHTML = '<span>- see less</span>';
                }
            } else {
                // COLLAPSE: Re-hide members beyond the first 4
                const allCards = container.querySelectorAll('.team-member-card');
                allCards.forEach((member, index) => {
                    if (index >= ITEMS_PER_PAGE) {
                        member.classList.add('previous-team-hidden');
                        member.style.setProperty('display', 'none', 'important');
                    }
                });

                // Update button text to "see more"
                if (seeMoreLink) {
                    seeMoreLink.innerHTML = '<span>+ see more</span>';
                }
            }
        };
    }

    /**
     * Create a team member card element
     */
    function createMemberCard(member) {
        const photoUrl = CONFIG.getOptimizedImageUrl
            ? CONFIG.getOptimizedImageUrl(member.photo, 'medium')
            : CONFIG.getImageUrl(member.photo);

        const div = document.createElement('div');
        div.className = 'team-member-card elementor-element elementor-widget elementor-widget-qi_addons_for_elementor_team_member';

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
                            ${member.description ? `<p class="qodef-m-description">${member.description}</p>` : ''}
                            <div class="qodef-m-social-icons">
                                ${generateSocialLinkHTML(member.facebook_link, 'facebook')}
                                ${generateSocialLinkHTML(member.twitter_link, 'twitter')}
                                ${generateSocialLinkHTML(member.instagram_link, 'instagram')}
                                ${generateSocialLinkHTML(member.email, 'envelope', true)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return div;
    }

    /**
     * Generate HTML for social links
     */
    function generateSocialLinkHTML(link, type, isEmail = false) {
        if (!link) return '';
        const href = isEmail ? `mailto:${link}` : link;
        const iconPaths = {
            facebook: "M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z",
            twitter: "M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z",
            instagram: "M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z",
            envelope: "M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm0 48v40.805c-22.422 18.259-58.168 46.651-134.587 106.49-16.841 13.247-50.201 45.072-73.413 44.701-23.208.375-56.579-31.459-73.413-44.701C106.18 199.465 70.425 171.067 48 152.805V112h416zM48 400V214.398c22.914 18.251 55.409 43.862 104.938 82.646 21.857 17.205 60.134 55.186 103.062 54.955 42.717.231 80.509-37.199 103.053-54.947 49.528-38.783 82.032-64.401 104.947-82.653V400H48z"
        };
        const iconClass = (type === 'envelope') ? 'e-far-envelope' : `e-fab-${type}`;
        const vb = (type === 'instagram') ? "0 0 448 512" : "0 0 512 512";
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

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPreviousTeam);
    } else {
        initPreviousTeam();
    }

})();
