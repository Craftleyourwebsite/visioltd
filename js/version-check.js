/**
 * VERSION CHECK & CACHE BUSTING SYSTEM
 * =====================================
 * This script MUST be loaded FIRST on every page.
 * 
 * Purpose:
 * - Detect version changes between deployments
 * - Automatically clear all browser caches when version changes
 * - Prevent stale JavaScript from causing 404 errors
 * - Unregister any rogue service workers
 * 
 * IMPORTANT: Increment APP_VERSION on every deployment!
 */

(function () {
    'use strict';

    // ============================================
    // CONFIGURATION - UPDATE ON EVERY DEPLOYMENT
    // ============================================
    const APP_VERSION = '1.0.0'; // INCREMENT THIS ON EVERY DEPLOYMENT!
    const VERSION_KEY = 'app_version';
    const LAST_CACHE_CLEAR_KEY = 'app_last_cache_clear';

    // ============================================
    // VERSION CHECK & CACHE MANAGEMENT
    // ============================================
    const VersionCheck = {
        /**
         * Initialize version check
         * Should be called immediately on page load
         */
        init() {
            console.log(`[VersionCheck] Current version: ${APP_VERSION}`);

            const storedVersion = localStorage.getItem(VERSION_KEY);

            if (!storedVersion) {
                // First visit - just store the version
                console.log('[VersionCheck] First visit, storing version');
                this._storeVersion();
                return;
            }

            if (storedVersion !== APP_VERSION) {
                // Version changed - clear everything!
                console.log(`[VersionCheck] Version changed: ${storedVersion} → ${APP_VERSION}`);
                this.clearAllCaches().then(() => {
                    this._storeVersion();
                    // Force a hard reload to get fresh resources
                    console.log('[VersionCheck] Forcing hard reload');
                    window.location.reload(true);
                });
                return; // Stop here - page will reload
            }

            console.log('[VersionCheck] Version unchanged, continuing normally');
        },

        /**
         * Store current version
         */
        _storeVersion() {
            try {
                localStorage.setItem(VERSION_KEY, APP_VERSION);
                localStorage.setItem(LAST_CACHE_CLEAR_KEY, Date.now().toString());
            } catch (e) {
                console.warn('[VersionCheck] Could not store version:', e);
            }
        },

        /**
         * Clear ALL browser caches
         * This is the nuclear option for when version changes
         */
        async clearAllCaches() {
            console.log('[VersionCheck] Clearing all caches...');

            const results = {
                localStorage: false,
                sessionStorage: false,
                cacheAPI: false,
                serviceWorkers: false
            };

            // 1. Clear localStorage (except version key)
            try {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key !== VERSION_KEY && key !== LAST_CACHE_CLEAR_KEY) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
                results.localStorage = true;
                console.log(`[VersionCheck] Cleared ${keysToRemove.length} localStorage items`);
            } catch (e) {
                console.warn('[VersionCheck] Error clearing localStorage:', e);
            }

            // 2. Clear sessionStorage completely
            try {
                sessionStorage.clear();
                results.sessionStorage = true;
                console.log('[VersionCheck] Cleared sessionStorage');
            } catch (e) {
                console.warn('[VersionCheck] Error clearing sessionStorage:', e);
            }

            // 3. Clear Cache API (for PWAs and cached resources)
            try {
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                    results.cacheAPI = true;
                    console.log(`[VersionCheck] Cleared ${cacheNames.length} Cache API entries`);
                }
            } catch (e) {
                console.warn('[VersionCheck] Error clearing Cache API:', e);
            }

            // 4. Unregister all Service Workers
            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map(reg => reg.unregister()));
                    results.serviceWorkers = true;
                    console.log(`[VersionCheck] Unregistered ${registrations.length} service workers`);
                }
            } catch (e) {
                console.warn('[VersionCheck] Error unregistering service workers:', e);
            }

            console.log('[VersionCheck] Cache clearing complete:', results);
            return results;
        },

        /**
         * Force clear caches (can be called manually)
         * Useful for debugging or forcing a refresh
         */
        async forceClearAndReload() {
            await this.clearAllCaches();
            this._storeVersion();
            window.location.reload(true);
        },

        /**
         * Get current app version
         */
        getVersion() {
            return APP_VERSION;
        },

        /**
         * Get version info for debugging
         */
        getVersionInfo() {
            return {
                currentVersion: APP_VERSION,
                storedVersion: localStorage.getItem(VERSION_KEY),
                lastCacheClear: localStorage.getItem(LAST_CACHE_CLEAR_KEY),
                isMatch: localStorage.getItem(VERSION_KEY) === APP_VERSION
            };
        }
    };

    // ============================================
    // AUTO-INITIALIZE
    // ============================================
    // Run immediately when script loads
    VersionCheck.init();

    // ============================================
    // EXPOSE GLOBALLY
    // ============================================
    window.VersionCheck = VersionCheck;
    window.APP_VERSION = APP_VERSION;

    // Debug helper
    console.log('[VersionCheck] Available methods: VersionCheck.getVersionInfo(), VersionCheck.forceClearAndReload()');

})();
