/**
 * SECURE API FETCH WRAPPER
 * =========================
 * This module provides a robust fetch wrapper for API calls.
 * 
 * Features:
 * - Anti-cache headers on all requests
 * - Intelligent retry with exponential backoff
 * - Automatic 404 detection and cache clearing
 * - Centralized API configuration
 * - Request timeout handling
 * 
 * Usage:
 *   const data = await API.fetch('/team-members?populate=*');
 *   const data = await API.get('team-members', { populate: '*' });
 */

(function () {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const API_CONFIG = {
        MAX_RETRIES: 3,
        RETRY_DELAY_BASE: 1000, // 1 second, doubles each retry
        REQUEST_TIMEOUT: 30000, // 30 seconds
        CACHE_BUST_PARAM: '_cb', // Cache bust query param name
    };

    // ============================================
    // SECURE API MODULE
    // ============================================
    const API = {
        /**
         * Get the base API URL from CONFIG
         * Falls back to localhost if CONFIG not available
         */
        getBaseUrl() {
            if (typeof CONFIG !== 'undefined' && CONFIG.API_URL) {
                return CONFIG.API_URL;
            }
            // Fallback - should not happen in production
            console.warn('[API] CONFIG.API_URL not found, using fallback');
            return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:1337/api'
                : 'https://visiostrapi-production.up.railway.app/api';
        },

        /**
         * Get anti-cache headers
         * These headers prevent browsers and CDNs from caching API responses
         */
        getAntiCacheHeaders() {
            return {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            };
        },

        /**
         * Add cache busting query parameter to URL
         */
        addCacheBuster(url) {
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}${API_CONFIG.CACHE_BUST_PARAM}=${Date.now()}`;
        },

        /**
         * Main fetch method with all protections
         * 
         * @param {string} endpoint - API endpoint (e.g., '/team-members' or 'team-members')
         * @param {Object} options - Fetch options
         * @returns {Promise<Object>} Parsed JSON response
         */
        async fetch(endpoint, options = {}) {
            // Normalize endpoint
            const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
            const baseUrl = this.getBaseUrl();
            let url = `${baseUrl}${cleanEndpoint}`;

            // Add cache buster
            url = this.addCacheBuster(url);

            // Merge headers with anti-cache headers
            const headers = {
                ...this.getAntiCacheHeaders(),
                'Accept': 'application/json',
                ...(options.headers || {})
            };

            const fetchOptions = {
                method: options.method || 'GET',
                mode: 'cors',
                credentials: 'omit',
                headers,
                ...options
            };

            // Remove headers from options to avoid duplication
            delete fetchOptions.headers;
            fetchOptions.headers = headers;

            return this._fetchWithRetry(url, fetchOptions);
        },

        /**
         * Convenience GET method
         * 
         * @param {string} endpoint - API endpoint
         * @param {Object} params - Query parameters
         * @returns {Promise<Object>} Parsed JSON response
         */
        async get(endpoint, params = {}) {
            let url = endpoint;

            // Build query string from params
            if (Object.keys(params).length > 0) {
                const queryParts = [];
                for (const [key, value] of Object.entries(params)) {
                    if (value !== undefined && value !== null) {
                        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
                    }
                }
                if (queryParts.length > 0) {
                    url += (url.includes('?') ? '&' : '?') + queryParts.join('&');
                }
            }

            return this.fetch(url);
        },

        /**
         * Fetch with retry logic and 404 detection
         */
        async _fetchWithRetry(url, options, attempt = 1) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT);

            try {
                console.log(`[API] Fetch attempt ${attempt}: ${url.split('?')[0]}...`);

                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                // Handle non-OK responses
                if (!response.ok) {
                    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                    error.status = response.status;
                    error.response = response;

                    // Special handling for 404 - might indicate stale cache
                    if (response.status === 404) {
                        console.warn('[API] 404 received - possible stale cache issue');
                        this._handle404(url);
                    }

                    throw error;
                }

                const data = await response.json();
                console.log(`[API] Success: ${url.split('?')[0]}`);
                return data;

            } catch (error) {
                clearTimeout(timeoutId);

                // Handle timeout
                if (error.name === 'AbortError') {
                    error.message = 'Request timeout';
                }

                console.warn(`[API] Attempt ${attempt} failed:`, error.message);

                // Retry logic
                if (attempt < API_CONFIG.MAX_RETRIES) {
                    const delay = API_CONFIG.RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
                    console.log(`[API] Retrying in ${delay}ms...`);
                    await this._sleep(delay);
                    return this._fetchWithRetry(url, options, attempt + 1);
                }

                // All retries exhausted
                console.error(`[API] All ${API_CONFIG.MAX_RETRIES} attempts failed for:`, url.split('?')[0]);
                throw error;
            }
        },

        /**
         * Handle 404 errors - might indicate stale cache
         */
        _handle404(url) {
            // Log for debugging
            console.warn('[API] 404 detected. URL:', url.split('?')[0]);

            // If we get multiple 404s, suggest cache clear
            const key = 'api_404_count';
            try {
                const count = parseInt(sessionStorage.getItem(key) || '0', 10) + 1;
                sessionStorage.setItem(key, count.toString());

                if (count >= 3) {
                    console.error('[API] Multiple 404 errors detected. This may indicate stale JavaScript.');
                    console.log('[API] Suggestion: Call VersionCheck.forceClearAndReload() to clear caches');

                    // Auto-trigger cache clear if VersionCheck is available
                    if (typeof VersionCheck !== 'undefined' && typeof VersionCheck.forceClearAndReload === 'function') {
                        console.log('[API] Automatically triggering cache clear...');
                        VersionCheck.forceClearAndReload();
                    }
                }
            } catch (e) {
                // Ignore storage errors
            }
        },

        /**
         * Sleep utility for retry delays
         */
        _sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        /**
         * Check API health
         * Useful for debugging connection issues
         */
        async healthCheck() {
            try {
                const startTime = Date.now();
                const url = this.addCacheBuster(this.getBaseUrl());
                const response = await fetch(url, {
                    method: 'HEAD',
                    mode: 'cors',
                    credentials: 'omit',
                    headers: this.getAntiCacheHeaders()
                });
                const duration = Date.now() - startTime;

                return {
                    ok: response.ok,
                    status: response.status,
                    latency: duration,
                    url: this.getBaseUrl()
                };
            } catch (error) {
                return {
                    ok: false,
                    error: error.message,
                    url: this.getBaseUrl()
                };
            }
        }
    };

    // ============================================
    // EXPOSE GLOBALLY
    // ============================================
    window.API = API;

    console.log('[API] Secure fetch wrapper loaded. Base URL:', API.getBaseUrl());
    console.log('[API] Available: API.fetch(), API.get(), API.healthCheck()');

})();
