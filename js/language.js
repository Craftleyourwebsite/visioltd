(function(){
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
    const languageBtn = document.getElementById('language-btn');
    const languageMenuItem = document.querySelector('.menu-item-language a');

    const btnEn = languageBtn ? languageBtn.querySelector('.lang-en') : null;
    const btnFr = languageBtn ? languageBtn.querySelector('.lang-fr') : null;
    const menuEn = languageMenuItem ? languageMenuItem.querySelector('.lang-en') : null;
    const menuFr = languageMenuItem ? languageMenuItem.querySelector('.lang-fr') : null;

    [btnEn, menuEn].forEach(function(el) { if (el) el.classList.toggle('active', lang === 'EN'); });
    [btnFr, menuFr].forEach(function(el) { if (el) el.classList.toggle('active', lang === 'FR'); });

    if (languageBtn) {
      languageBtn.classList.toggle('active', lang === 'FR');
    }
  }

  function toggleLanguage() {
    const next = getCurrentLanguage() === 'EN' ? 'FR' : 'EN';
    setCurrentLanguage(next);
    updateLanguageUI();
  }

  document.addEventListener('DOMContentLoaded', function() {
    updateLanguageUI();

    const languageBtn = document.getElementById('language-btn');
    if (languageBtn) {
      languageBtn.addEventListener('click', function(e){
        toggleLanguage();
      });
    }
    const languageMenuItem = document.querySelector('.menu-item-language a');
    if (languageMenuItem) {
      languageMenuItem.addEventListener('click', function(e){
        e.preventDefault();
        toggleLanguage();
      });
    }
  });
})();
