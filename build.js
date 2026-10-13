// Builds index.html from index.template.html + tekstid.json.
// Usage: node build.js   (no npm packages needed)
//
// Placeholders in the template:
//   {{group.key}}     text, HTML-escaped (for page text and attributes)
//   {{js:group.key}}  text as a quoted JavaScript/JSON string (inside <script>)
//
// The build stops with an error if a placeholder has no text, and warns about
// texts in tekstid.json that are not used anywhere.

const fs = require('fs');
const path = require('path');

const dir = __dirname;
const texts = JSON.parse(fs.readFileSync(path.join(dir, 'tekstid.json'), 'utf8'));
const template = fs.readFileSync(path.join(dir, 'index.template.html'), 'utf8');

function lookup(key) {
  const value = key.split('.').reduce((obj, part) => (obj == null ? undefined : obj[part]), texts);
  if (typeof value !== 'string') throw new Error(`tekstid.json: missing text "${key}"`);
  return value;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const used = new Set();
const output = template.replace(/\{\{(js:)?([\w.]+)\}\}/g, (match, js, key) => {
  used.add(key);
  const value = lookup(key);
  return js ? JSON.stringify(value) : escapeHtml(value);
});

// Warn about texts that are defined but not used (keys starting with "_" are notes)
(function walk(obj, prefix) {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('_')) continue;
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') { if (!used.has(key)) console.warn(`warning: "${key}" is not used`); }
    else walk(v, key);
  }
})(texts, '');

fs.writeFileSync(path.join(dir, 'index.html'), output);
console.log(`index.html built (${used.size} texts from tekstid.json)`);
