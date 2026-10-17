const fs = require('node:fs');
const cp = require('node:child_process');
const pkg = require('../package.json');
let sourceCommit = process.env.FORMA_SOURCE_COMMIT || null;
if (!sourceCommit) {
  try { sourceCommit = cp.execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* extracted source */ }
}
const manifest = { product: 'Forma', version: pkg.version, sourceCommit, platform: 'win32', arch: 'x64', electron: pkg.devDependencies.electron, builtAt: new Date().toISOString() };
fs.writeFileSync('release-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
