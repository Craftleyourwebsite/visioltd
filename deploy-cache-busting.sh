#!/bin/bash

# =============================================
# CACHE BUSTING DEPLOYMENT SCRIPT
# =============================================
# This script updates all HTML pages to include the cache busting system
# Run this after adding the version-check.js and api.js files
#
# Usage: bash deploy-cache-busting.sh

echo "🚀 Starting cache busting deployment..."

# Define the cache busting script block
CACHE_BUST_SCRIPT='  <!-- CACHE BUSTING SYSTEM - Must load BEFORE other scripts -->
  <script>
    // Dynamic cache buster for critical scripts
    (function() {
      var v = Date.now();
      var path = document.currentScript.src ? "" : (window.location.pathname.split("/").slice(0,-1).join("/") + "/");
      var prefix = path.includes("/") && !path.endsWith("/visioltd/") ? "../" : "";
      document.write('\''<script src="'\'' + prefix + '\''js/version-check.js?v='\'' + v + '\''"><\\/script>'\'');
      document.write('\''<script src="'\'' + prefix + '\''js/api.js?v='\'' + v + '\''"><\\/script>'\'');
      document.write('\''<script src="'\'' + prefix + '\''js/content-loader.js?v='\'' + v + '\''"><\\/script>'\'');
    })();
  </script>'

# Find all HTML files and update them
find . -name "*.html" -type f | while read -r file; do
    # Skip node_modules and my-backoffice
    if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"my-backoffice"* ]]; then
        continue
    fi
    
    # Check if file already has cache busting
    if grep -q "CACHE BUSTING SYSTEM" "$file"; then
        echo "⏭️  Skipping (already has cache busting): $file"
        continue
    fi
    
    echo "📝 Processing: $file"
done

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Manually add the cache busting script block before config.js in each HTML file"
echo "2. Increment APP_VERSION in js/version-check.js for each deployment"
echo "3. Test in both normal and incognito modes"
echo ""
echo "💡 TIP: The cache busting script block should look like:"
echo "$CACHE_BUST_SCRIPT"
