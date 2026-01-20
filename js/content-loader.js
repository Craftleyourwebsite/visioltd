/**
 * CONTENT LOADING SYSTEM
 * Unified cache management and skeleton loading utilities
 * 
 * Features:
 * - Multi-tier caching (Memory -> LocalStorage -> Network)
 * - Skeleton loading with shimmer animation
 * - Anti-infinite loop protection
 * - Retry with exponential backoff
 * - Graceful degradation with expired cache fallback
 */

(function () {
    'use strict';

    // ============================================
    // CACHE CONFIGURATION
    // ============================================
    const CACHE_CONFIG = {
        PREFIX: 'vl_content_cache_',
        TTL: 5 * 60 * 1000, // 5 minutes
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000, // 1 second base delay
        VERSION: 'v1'
    };

    // Memory cache for session-level caching
    const memoryCache = new Map();

    // ============================================
    // CACHE MANAGER
    // ============================================
    const ContentCache = {
        /**
         * Get cache key with prefix
         */
        _getKey(type, lang) {
            return `${CACHE_CONFIG.PREFIX}${CACHE_CONFIG.VERSION}_${type}_${lang}`;
        },

        /**
         * Get data from cache (memory first, then localStorage)
         * @returns {Object|null} { data, isValid, isExpired, source }
         */
        get(type, lang) {
            const key = this._getKey(type, lang);

            // 1. Try memory cache first (fastest)
            if (memoryCache.has(key)) {
                const cached = memoryCache.get(key);
                const now = Date.now();
                const isValid = now - cached.timestamp < CACHE_CONFIG.TTL;

                console.log(`[Cache] Memory hit for ${type}/${lang}, valid: ${isValid}`);
                return {
                    data: cached.data,
                    isValid,
                    isExpired: !isValid,
                    source: 'memory'
                };
            }

            // 2. Try localStorage
            try {
                const stored = localStorage.getItem(key);
                if (stored) {
                    const cached = JSON.parse(stored);
                    const now = Date.now();
                    const isValid = now - cached.timestamp < CACHE_CONFIG.TTL;

                    // Promote to memory cache
                    memoryCache.set(key, cached);

                    console.log(`[Cache] LocalStorage hit for ${type}/${lang}, valid: ${isValid}`);
                    return {
                        data: cached.data,
                        isValid,
                        isExpired: !isValid,
                        source: 'localStorage'
                    };
                }
            } catch (e) {
                console.warn('[Cache] LocalStorage read error:', e);
            }

            return null;
        },

        /**
         * Set data in cache (both memory and localStorage)
         */
        set(type, lang, data) {
            const key = this._getKey(type, lang);
            const cached = {
                data,
                timestamp: Date.now()
            };

            // Set in memory
            memoryCache.set(key, cached);

            // Set in localStorage
            try {
                localStorage.setItem(key, JSON.stringify(cached));
                console.log(`[Cache] Saved ${type}/${lang} to cache`);
            } catch (e) {
                console.warn('[Cache] LocalStorage write error:', e);
            }
        },

        /**
         * Clear cache for a specific type
         */
        clear(type, lang) {
            const key = this._getKey(type, lang);
            memoryCache.delete(key);
            try {
                localStorage.removeItem(key);
            } catch (e) { }
        },

        /**
         * Clear all content caches
         */
        clearAll() {
            memoryCache.clear();
            try {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(CACHE_CONFIG.PREFIX)) {
                        localStorage.removeItem(key);
                    }
                });
            } catch (e) { }
        }
    };

    // ============================================
    // LOADING STATE MANAGER
    // ============================================
    const loadingStates = new Map();

    const LoadingState = {
        /**
         * Check if content is currently loading
         */
        isLoading(type) {
            return loadingStates.get(type)?.loading || false;
        },

        /**
         * Get load count for anti-infinite loop protection
         */
        getLoadCount(type) {
            return loadingStates.get(type)?.count || 0;
        },

        /**
         * Start loading state
         */
        start(type) {
            const current = loadingStates.get(type) || { loading: false, count: 0 };

            if (current.loading) {
                console.warn(`[LoadingState] ${type} is already loading, skipping`);
                return false;
            }

            if (current.count >= CACHE_CONFIG.MAX_RETRIES) {
                console.error(`[LoadingState] ${type} exceeded max retries (${CACHE_CONFIG.MAX_RETRIES})`);
                return false;
            }

            loadingStates.set(type, { loading: true, count: current.count + 1 });
            console.log(`[LoadingState] Started loading ${type} (attempt ${current.count + 1})`);
            return true;
        },

        /**
         * End loading state
         */
        end(type, success = true) {
            const current = loadingStates.get(type) || { loading: false, count: 0 };
            loadingStates.set(type, {
                loading: false,
                count: success ? 0 : current.count // Reset count on success
            });
        },

        /**
         * Reset all states (useful for page navigation)
         */
        resetAll() {
            loadingStates.clear();
        }
    };

    // ============================================
    // SKELETON GENERATOR
    // ============================================
    const SkeletonGenerator = {
        /**
         * Generate grid skeleton cards
         */
        generateGridCards(count = 6, type = 'default') {
            const cards = [];
            for (let i = 0; i < count; i++) {
                cards.push(this.generateCard(type));
            }
            return cards.join('');
        },

        /**
         * Generate a single skeleton card
         */
        generateCard(type = 'default') {
            return `
                <div class="hentry skeleton-card">
                    <div class="hentry-wrap">
                        <div class="featured-image">
                            <div class="skeleton-image content-skeleton"></div>
                        </div>
                        <div class="hentry-middle">
                            <header class="entry-header">
                                <h2 class="entry-title">
                                    <span class="skeleton-title content-skeleton"></span>
                                </h2>
                            </header>
                        </div>
                    </div>
                </div>
            `;
        },

        /**
         * Show skeleton loading in container
         */
        showIn(container, count = 6, type = 'default') {
            if (!container) return;
            container.innerHTML = this.generateGridCards(count, type);
            container.classList.add('is-loading');
        },

        /**
         * Remove skeleton and show content
         */
        hideIn(container) {
            if (!container) return;
            container.classList.remove('is-loading');
            // Skeleton cards will be replaced by real content
        }
    };

    // ============================================
    // FETCH WITH RETRY
    // ============================================
    async function fetchWithRetry(url, options = {}, retries = CACHE_CONFIG.MAX_RETRIES) {
        let lastError;

        // Get anti-cache headers from API module if available
        const antiCacheHeaders = (typeof API !== 'undefined' && API.getAntiCacheHeaders)
            ? API.getAntiCacheHeaders()
            : {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            };

        // Add cache buster to URL
        const cacheBustedUrl = url.includes('?')
            ? `${url}&_cb=${Date.now()}`
            : `${url}?_cb=${Date.now()}`;

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(cacheBustedUrl, {
                    mode: 'cors',
                    credentials: 'omit',
                    headers: {
                        ...antiCacheHeaders,
                        'Accept': 'application/json'
                    },
                    ...options
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return await response.json();
            } catch (error) {
                lastError = error;
                console.warn(`[Fetch] Attempt ${i + 1} failed for ${url}:`, error.message);

                if (i < retries - 1) {
                    // Exponential backoff
                    const delay = CACHE_CONFIG.RETRY_DELAY * Math.pow(2, i);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    // ============================================
    // CONTENT LOADER
    // ============================================
    const ContentLoader = {
        ContentCache,
        LoadingState,
        SkeletonGenerator,
        fetchWithRetry,

        /**
         * Main loading function with cache intelligence
         * 
         * @param {Object} options
         * @param {string} options.type - Content type (e.g., 'rise', 'social', 'news', 'projects')
         * @param {string} options.url - API URL
         * @param {string} options.containerId - Container element ID
         * @param {Function} options.renderFn - Function to render items
         * @param {Function} options.onSuccess - Callback on success
         * @param {Function} options.onError - Callback on error
         * @param {number} options.skeletonCount - Number of skeleton cards to show
         */
        async load(options) {
            const {
                type,
                url,
                containerId,
                renderFn,
                onSuccess,
                onError,
                skeletonCount = 6
            } = options;

            const container = document.getElementById(containerId);
            if (!container) {
                console.warn(`[ContentLoader] Container #${containerId} not found`);
                return;
            }

            const lang = (localStorage.getItem('currentLanguage') || 'en').toLowerCase();

            // Anti-infinite loop protection
            if (!LoadingState.start(type)) {
                return;
            }

            try {
                // 1. Check cache first
                const cached = ContentCache.get(type, lang);

                if (cached?.isValid) {
                    // Use valid cache immediately
                    console.log(`[ContentLoader] Using valid cache for ${type}/${lang}`);
                    this._renderContent(container, cached.data, renderFn);
                    LoadingState.end(type, true);
                    onSuccess?.(cached.data, 'cache');
                    return;
                }

                // 2. Show skeletons while fetching
                SkeletonGenerator.showIn(container, skeletonCount, type);

                // 3. Fetch fresh data
                console.log(`[ContentLoader] Fetching fresh data for ${type}/${lang}`);
                const json = await fetchWithRetry(url);
                const items = CONFIG.flatten(json);

                if (!Array.isArray(items)) {
                    throw new Error('Invalid API response structure');
                }

                // 4. Save to cache
                ContentCache.set(type, lang, items);

                // 5. Render content
                this._renderContent(container, items, renderFn);

                LoadingState.end(type, true);
                onSuccess?.(items, 'network');

            } catch (error) {
                console.error(`[ContentLoader] Error loading ${type}:`, error);

                // Try to use expired cache as fallback
                const cached = ContentCache.get(type, lang);
                if (cached?.isExpired && cached.data?.length > 0) {
                    console.log(`[ContentLoader] Using expired cache as fallback for ${type}`);
                    this._renderContent(container, cached.data, renderFn);
                    LoadingState.end(type, true);
                    onSuccess?.(cached.data, 'expired-cache');
                    return;
                }

                // Show error state
                this._showError(container, error.message);
                LoadingState.end(type, false);
                onError?.(error);
            }
        },

        /**
         * Render content into container
         */
        _renderContent(container, items, renderFn) {
            SkeletonGenerator.hideIn(container);

            if (!items || items.length === 0) {
                container.innerHTML = `
                    <div class="content-empty" style="text-align: center; padding: 40px; width: 100%;">
                        <h3>No items found</h3>
                        <p>Stay tuned for updates.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = '';
            const fragment = document.createDocumentFragment();

            items.forEach(item => {
                const html = renderFn(item);
                const temp = document.createElement('div');
                temp.innerHTML = html.trim();
                if (temp.firstChild) {
                    fragment.appendChild(temp.firstChild);
                }
            });

            container.appendChild(fragment);
        },

        /**
         * Show error state
         */
        _showError(container, message) {
            SkeletonGenerator.hideIn(container);
            container.innerHTML = `
                <div class="content-error" style="text-align: center; padding: 40px; width: 100%; background: #fff3f3; color: #c62828; border-radius: 8px;">
                    <h3 style="margin: 0 0 10px;">Error loading content</h3>
                    <p style="margin: 0; opacity: 0.8;">${message}</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 24px; background: #c62828; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    };

    // Export to global scope
    window.ContentLoader = ContentLoader;
    window.ContentCache = ContentCache;
    window.SkeletonGenerator = SkeletonGenerator;

})();
