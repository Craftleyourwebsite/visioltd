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
            // ALWAYS fetch fresh data from Strapi
            const url = `${CONFIG.API_URL}/previous-team-members?populate=*&sort=order:asc`;
            console.log('[PreviousTeam] Fetching from:', url);

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
                console.log('[PreviousTeam] Members sorted by order:');
                freshMembers.forEach((m, i) => console.log(`  ${i}: ${m.name} (order: ${m.order})`));
            }

            if (Array.isArray(freshMembers) && freshMembers.length > 0) {
                // Update cache with fresh data
                if (typeof ContentCache !== 'undefined') {
                    ContentCache.set(CONTENT_TYPE, lang, freshMembers);
                }

                // ALWAYS update display with fresh data
                console.log('[PreviousTeam] Updating display with fresh data');
                renderPreviousTeam(freshMembers);
            } else {
                // No data from API - hide section
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
                                ${generateSocialLinkHTML(member.linkedin_link, 'linkedin')}
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

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPreviousTeam);
    } else {
        initPreviousTeam();
    }

})();
