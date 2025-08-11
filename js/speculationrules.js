// Programmatically inject speculationrules JSON (was inline)
(function(){
  try {
    var s = document.createElement('script');
    s.type = 'speculationrules';
    s.textContent = JSON.stringify({
      prefetch: [
        {
          source: 'document',
          where: {
            and: [
              { href_matches: '/arkiz/demo-01/*' },
              { not: { href_matches: [
                '/arkiz/demo-01/wp-*.php',
                '/arkiz/demo-01/wp-admin/*',
                '/arkiz/demo-01/wp-content/uploads/sites/3/*',
                '/arkiz/demo-01/wp-content/*',
                '/arkiz/demo-01/wp-content/plugins/*',
                '/arkiz/demo-01/wp-content/themes/arkiz/*',
                '/arkiz/demo-01/*\\?(.+)'
              ]}},
              { not: { selector_matches: 'a[rel~="nofollow"]' } },
              { not: { selector_matches: '.no-prefetch, .no-prefetch a' } }
            ]
          },
          eagerness: 'conservative'
        }
      ]
    });
    document.head.appendChild(s);
  } catch(e) {
    // no-op
  }
})();
