/**
 * TESTIMONIAL LOADER
 * Fetches dynamic testimonials from Strapi and appends them to the existing slider
 * Static testimonials are preserved, dynamic ones are added after
 */

(function () {
    'use strict';

    const QUOTE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" height="24" stroke-width="1.5" viewBox="0 0 24 24" width="24">
        <path d="M10 12H5C4.44772 12 4 11.5523 4 11V7.5C4 6.94772 4.44772 6.5 5 6.5H9C9.55228 6.5 10 6.94772 10 7.5V12ZM10 12C10 14.5 9 16 6 17.5" stroke="currentColor" stroke-linecap="round"></path>
        <path d="M20 12H15C14.4477 12 14 11.5523 14 11V7.5C14 6.94772 14.4477 6.5 15 6.5H19C19.5523 6.5 20 6.94772 20 7.5V12ZM20 12C20 14.5 19 16 16 17.5" stroke="currentColor" stroke-linecap="round"></path>
    </svg>`;

    /**
     * Create a testimonial slide element
     */
    function createSlide(testimonial) {
        const div = document.createElement('div');
        div.className = 'qodef-e swiper-slide elementor-repeater-item-dynamic';
        div.innerHTML = `
            <div class="qodef-e-inner">
                <div class="qodef-e-content">
                    <div class="qodef-e-quote">${QUOTE_SVG}</div>
                    <h3 itemprop="description" class="qodef-e-text">"${testimonial.quote}"</h3>
                </div>
            </div>
        `;
        return div;
    }

    /**
     * Reinitialize Swiper with infinite loop and autoplay
     */
    function reinitializeSwiper(swiperContainer) {
        if (!swiperContainer) {
            console.log('[Testimonials] Swiper container not found');
            return;
        }

        // Get the existing Swiper instance
        const existingSwiper = swiperContainer.swiper;

        if (existingSwiper) {
            // Destroy existing Swiper
            existingSwiper.destroy(true, true);
        }

        // Reinitialize Swiper with loop and autoplay
        const newSwiper = new Swiper(swiperContainer, {
            direction: 'horizontal',
            slidesPerView: 3,
            spaceBetween: 80,
            loop: true,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            speed: 500,
            centeredSlides: false,
            navigation: {
                nextEl: '.swiper-button-next-1',
                prevEl: '.swiper-button-prev-1',
            },
            pagination: {
                el: '.swiper-pagination-1',
                clickable: true,
            },
            breakpoints: {
                0: {
                    slidesPerView: 1,
                    spaceBetween: 20,
                },
                768: {
                    slidesPerView: 2,
                    spaceBetween: 40,
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 80,
                },
            },
        });

        console.log('[Testimonials] Swiper reinitialized with infinite loop and autoplay');
        return newSwiper;
    }

    /**
     * Initialize testimonials loading
     */
    async function initTestimonials() {
        // Find the testimonial slider container
        const swiperContainer = document.querySelector('.elementor-element-68f1e7ac .qodef-qi-testimonials-slider');
        const swiperWrapper = document.querySelector('.elementor-element-68f1e7ac .swiper-wrapper');

        if (!swiperWrapper || !swiperContainer) {
            console.log('[Testimonials] Slider not found');
            return;
        }

        try {
            // Use simple API call without complex filters
            const url = `${CONFIG.API_URL}/testimonials?sort=order:asc`;
            console.log('[Testimonials] Fetching from:', url);

            const response = await fetch(url);

            if (!response.ok) {
                console.log('[Testimonials] API response not OK:', response.status);
                // Still reinitialize Swiper for infinite loop
                reinitializeSwiper(swiperContainer);
                return;
            }

            const json = await response.json();
            console.log('[Testimonials] API response:', json);

            const testimonials = CONFIG.flatten(json);
            console.log('[Testimonials] Flattened data:', testimonials);

            if (Array.isArray(testimonials) && testimonials.length > 0) {
                console.log(`[Testimonials] Adding ${testimonials.length} dynamic testimonials`);

                // Create fragment for performance
                const fragment = document.createDocumentFragment();
                testimonials.forEach(testimonial => {
                    if (testimonial.quote) {
                        fragment.appendChild(createSlide(testimonial));
                    }
                });

                // Append to slider
                swiperWrapper.appendChild(fragment);
            } else {
                console.log('[Testimonials] No dynamic testimonials found');
            }

            // Always reinitialize Swiper for infinite loop
            reinitializeSwiper(swiperContainer);

        } catch (error) {
            console.error('[Testimonials] Error loading testimonials:', error);
            // Still try to reinitialize Swiper
            reinitializeSwiper(swiperContainer);
        }
    }

    // Wait for page to be fully loaded including Swiper library
    window.addEventListener('load', function () {
        // Additional delay to ensure all scripts are ready
        setTimeout(initTestimonials, 1000);
    });

})();
