const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const files = [
  'index.html', 'app.js', 'map.js', 'style.css', 'mobile.css',
  'data/facilities.js', 'data/scenic.js', 'data/planning.js', 'data/stamps.js', 'assets/favicon.svg', 'assets/lucide-0.468.0.min.js',
  'assets/LUCIDE-LICENSE', 'assets/huanglong-five-colored-pond.jpg',
  'assets/huanglong-welcome-ponds.jpg',
  'follow.js', 'follow-state.js', 'follow.css', 'assets/water-scene.js',
  'assets/THREE-LICENSE', 'assets/models/huanglong-water-landscape.glb',
  'assets/models/huanglong-flow.glb', 'assets/models/huanglong-dissolution.glb', 'assets/models/huanglong-emergence.glb',
];

// Only this explicit public-file list is deployed. No recursive project upload.
fs.mkdirSync(output, { recursive: true });
for (const filename of files) {
  const destination = path.join(output, filename);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(root, filename), destination);
}
function listFiles(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = prefix + entry.name;
    return entry.isDirectory() ? listFiles(path.join(directory, entry.name), relative + '/') : [relative];
  });
}
const unexpected = listFiles(output).filter(file => !files.includes(file));
if (unexpected.length) throw new Error('Unexpected files in public output: ' + unexpected.join(', '));
for (const file of files.filter(file => /\.(js|html|css)$/.test(file))) {
  const source = fs.readFileSync(path.join(output, file), 'utf8');
  for (const [name, value] of Object.entries(process.env)) {
    if (/TOKEN|SECRET|SECURITY.*CODE|API.*KEY|KEY.*API/i.test(name) && value?.trim().length >= 12 && source.includes(value)) {
      throw new Error('Credential found in public output: ' + name);
    }
  }
}
console.log(`Cloudflare public assets ready: ${files.length} files. No credentials included.`);
