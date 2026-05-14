const fs = require('fs');
const path = require('path');

const hooksDir = path.join(__dirname, 'apps/frontend/src/hooks');
const files = fs.readdirSync(hooksDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(hooksDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace fetch(`${process.env.NEXT_PUBLIC_API_URL}...`) with fetch(..., { credentials: 'include' })
  // Case 1: fetch(url)
  content = content.replace(/fetch\((`\$\{process\.env\.NEXT_PUBLIC_API_URL\}[^`]+`)\)/g, 'fetch($1, { credentials: "include" })');
  
  // Case 2: fetch(url, { ... })
  content = content.replace(/fetch\((`\$\{process\.env\.NEXT_PUBLIC_API_URL\}[^`]+`),\s*\{/g, 'fetch($1, { credentials: "include",');

  fs.writeFileSync(filePath, content);
}
console.log('Fixed fetch calls in hooks');
