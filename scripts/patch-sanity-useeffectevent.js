/**
 * Postinstall script to patch Sanity packages to use useEffectEvent from polyfill
 * This fixes the React 19 compatibility issue where useEffectEvent was removed
 */
const fs = require('fs');
const path = require('path');

const patches = [
  // Patch @sanity/vision
  {
    file: path.join(__dirname, '../node_modules/@sanity/vision/lib/_chunks-es/SanityVision.js'),
    // Remove useEffectEvent from React import and add separate import
    find: /import\s+{([^}]*)\buseEffectEvent\b([^}]*)}\s+from\s+['"]react['"]/g,
    replace: (match, before, after) => {
      // Clean up the import list (remove extra commas and spaces)
      const cleanedBefore = before.replace(/,\s*$/, '').trim();
      const cleanedAfter = after.replace(/^\s*,/, '').trim();
      const reactImports = [cleanedBefore, cleanedAfter].filter(Boolean).join(', ').replace(/,\s*,/g, ',').trim();
      return `import { ${reactImports} } from "react";\nimport { useEffectEvent } from 'use-effect-event';`;
    },
  },
  // Patch sanity core pane.js
  {
    file: path.join(__dirname, '../node_modules/sanity/lib/_chunks-es/pane.js'),
    find: /import\s+{([^}]*)\buseEffectEvent\b([^}]*)}\s+from\s+['"]react['"]/g,
    replace: (match, before, after) => {
      const cleanedBefore = before.replace(/,\s*$/, '').trim();
      const cleanedAfter = after.replace(/^\s*,/, '').trim();
      const reactImports = [cleanedBefore, cleanedAfter].filter(Boolean).join(', ').replace(/,\s*,/g, ',').trim();
      return `import { ${reactImports} } from "react";\nimport { useEffectEvent } from 'use-effect-event';`;
    },
  },
  // Patch sanity core index.js (handles React import with multiple lines)
  {
    file: path.join(__dirname, '../node_modules/sanity/lib/index.js'),
    find: /import\s+React,\s*{([^}]*)\buseEffectEvent\b([^}]*)}\s+from\s+['"]react['"]/g,
    replace: (match, before, after) => {
      const cleanedBefore = before.replace(/,\s*$/, '').trim();
      const cleanedAfter = after.replace(/^\s*,/, '').trim();
      const reactImports = [cleanedBefore, cleanedAfter].filter(Boolean).join(', ').replace(/,\s*,/g, ',').trim();
      return `import React, { ${reactImports} } from "react";\nimport { useEffectEvent } from 'use-effect-event';`;
    },
  },
];

let patched = 0;
for (const patch of patches) {
  try {
    if (fs.existsSync(patch.file)) {
      let content = fs.readFileSync(patch.file, 'utf8');
      const originalContent = content;
      content = content.replace(patch.find, patch.replace);
      
      if (content !== originalContent) {
        fs.writeFileSync(patch.file, content, 'utf8');
        console.log(`✅ Patched: ${patch.file}`);
        patched++;
      } else {
        // Check if useEffectEvent is already imported from use-effect-event
        if (content.includes("from 'use-effect-event'") || content.includes('from "use-effect-event"')) {
          console.log(`ℹ️  Already patched: ${patch.file}`);
        } else {
          console.log(`ℹ️  No changes needed (pattern not found): ${patch.file}`);
        }
      }
    } else {
      console.log(`⚠️  File not found: ${patch.file}`);
    }
  } catch (error) {
    console.error(`❌ Error patching ${patch.file}:`, error.message);
  }
}

if (patched > 0) {
  console.log(`\n✅ Successfully patched ${patched} file(s)`);
} else {
  console.log(`\nℹ️  No files needed patching`);
}

