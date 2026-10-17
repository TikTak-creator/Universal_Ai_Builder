const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { assetPath, externalAllowed, downloadName, CSP } = require('./security.cjs');
const root = path.resolve('dist');
test('serves entry point, hashed assets and bundled fonts within dist', () => {
  assert.equal(assetPath('app://forma/', root), path.join(root, 'index.html'));
  assert.equal(assetPath('app://forma/assets/editor.js?v=1', root), path.join(root, 'assets', 'editor.js'));
  assert.equal(assetPath('app://forma/fonts/OFL.txt', root), path.join(root, 'fonts', 'OFL.txt'));
});
test('rejects other origins, credentials and ports', () => {
  for (const url of ['file:///etc/passwd', 'https://forma/', 'app://other/index.html', 'app://user:pass@forma/', 'app://forma:90/']) assert.equal(assetPath(url, root), null, url);
});
test('rejects encoded Windows traversal, drive names and malformed escapes', () => {
  for (const url of ['app://forma/%2e%2e%5csecret', 'app://forma/assets/%2e%2e%5c%2e%2e%5csecret', 'app://forma/C%3A/secret', 'app://forma/%00', 'app://forma/%zz', 'app://forma/assets/%2e%2e%2f%2e%2e%2fsecret']) assert.equal(assetPath(url, root), null, url);
});
test('URL-normalized traversal remains inside the public dist directory', () => {
  assert.equal(assetPath('app://forma/../../secret', root), path.join(root, 'secret'));
});
test('external links use an exact allowlist', () => {
  assert.equal(externalAllowed('https://fonts.google.com/'), true);
  assert.equal(externalAllowed('https://lucide.dev/license'), true);
  for (const url of ['file:///C:/Windows/system32/cmd.exe', 'javascript:alert(1)', 'https://fonts.google.com.evil/', 'https://fonts.google.com/?redirect=evil']) assert.equal(externalAllowed(url), false);
});
test('downloads keep JSON extension and cannot escape chosen folder', () => {
  assert.equal(downloadName('../../mock.forma.json'), 'mock.forma.json');
  assert.equal(downloadName('C:\\tmp\\mock.forma.json'), 'mock.forma.json');
  assert.equal(downloadName('program.exe'), 'project.forma.json');
  assert.equal(downloadName('Пример.forma.json'), 'Пример.forma.json');
});
test('CSP blocks injected scripts, frames, network API calls and plugins', () => {
  for (const rule of ["script-src 'self'", "connect-src 'self'", "object-src 'none'", "frame-src 'none'"]) assert.ok(CSP.includes(rule));
  assert.ok(!CSP.includes('unsafe-eval'));
});
