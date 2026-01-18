(function () {
  const LANGUAGE_STORAGE_KEY = 'currentLanguage';

  function getCurrentLanguage() {
    try {
      return localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'EN';
    } catch (e) {
      return 'EN';
    }
  }

  function setCurrentLanguage(lang) {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      // ignore
    }
  }

  function updateLanguageUI() {
    const lang = getCurrentLanguage();

    // Target ALL language buttons and menu items (including clones)
    // Theme may create cloned headers, resulting in multiple buttons
    const allEnParts = document.querySelectorAll('.lang-en');
    const allFrParts = document.querySelectorAll('.lang-fr');

    allEnParts.forEach(function (el) {
      if (el) {
        el.classList.toggle('active', lang === 'EN');
      }
    });
    allFrParts.forEach(function (el) {
      if (el) {
        el.classList.toggle('active', lang === 'FR');
      }
    });
  }

  function toggleLanguage() {
    const next = getCurrentLanguage() === 'EN' ? 'FR' : 'EN';
    setCurrentLanguage(next);
    updateLanguageUI();
    // Dispatch event for other scripts (like projects loaders) to react
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: next } }));
  }

  document.addEventListener('DOMContentLoaded', function () {
    updateLanguageUI();

    // Use event delegation to handle clicks on ANY language button (original or cloned)
    document.body.addEventListener('click', function (e) {
      // Check if clicked element is inside a language button or menu item
      const langBtn = e.target.closest('#language-btn, .language-btn');
      const langMenuItem = e.target.closest('.menu-item-language a');

      if (langBtn || langMenuItem) {
        e.preventDefault();
        toggleLanguage();
      }
    });

    // Refresh language UI on scroll to handle cloned headers from theme
    // Use throttled scroll to avoid performance issues
    let scrollTimeout;
    window.addEventListener('scroll', function () {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(function () {
        updateLanguageUI();
        scrollTimeout = null;
      }, 50); // Reduced to 50ms for faster response
    });

    // Also use MutationObserver to catch when theme creates cloned header
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.addedNodes.length) {
          // A node was added, refresh language UI in case it's a cloned header
          updateLanguageUI();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})();
