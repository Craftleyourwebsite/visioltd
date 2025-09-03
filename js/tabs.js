// Tabs controller extracted from inline script
(function () {
  function hideAll() {
    const ids = ['history', 'mission', 'visio'];
    ids.forEach((name) => {
      const el = document.getElementById('tab-' + name);
      if (el) {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('opacity', '0', 'important');
      }
    });
  }

  function setActiveLink(tabName) {
    document.querySelectorAll('.qodef-tabs-horizontal-navigation a').forEach((link) => {
      link.classList.remove('tab-link--active');
    });
    const active = document.querySelector('.qodef-tabs-horizontal-navigation a[data-tab="' + tabName + '"]');
    if (active) {
      active.classList.add('tab-link--active');
    }
  }

  function showTab(tabName) {
    hideAll();
    setActiveLink(tabName);
    setTimeout(() => {
      const target = document.getElementById('tab-' + tabName);
      if (target) {
        target.style.setProperty('display', 'block', 'important');
        setTimeout(() => {
          target.style.setProperty('opacity', '1', 'important');
        }, 50);
      }
    }, 250);
  }

  function onClick(e) {
    const tab = this.getAttribute('data-tab');
    if (!tab) return;
    e.preventDefault();
    showTab(tab);
  }

  function init() {
    // Bind click handlers
    document.querySelectorAll('.qodef-tabs-horizontal-navigation a[data-tab]').forEach((a) => {
      a.addEventListener('click', onClick);
    });

    // Ensure initial state consistent with CSS defaults
    // History should be visible by default per CSS; ensure classes match
    setActiveLink('history');
    
    // Force initial state to match CSS
    hideAll();
    setTimeout(() => {
      const historyTab = document.getElementById('tab-history');
      if (historyTab) {
        historyTab.style.setProperty('display', 'block', 'important');
        historyTab.style.setProperty('opacity', '1', 'important');
      }
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
