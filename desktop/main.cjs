const { app, BrowserWindow, Menu, dialog, net, protocol, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { assetPath, externalAllowed, downloadName, CSP } = require('./security.cjs');

// A standard secure origin keeps IndexedDB stable across installs and upgrades.
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
app.setAppUserModelId('com.tiktakcreator.forma');
app.setName('Forma');
const profile = process.env.FORMA_PROFILE || path.join(app.getPath('appData'), 'Forma');
if (!path.isAbsolute(profile)) throw new Error('FORMA_PROFILE must be an absolute path.');
fs.mkdirSync(profile, { recursive: true });
app.setPath('userData', profile);
let window;
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.show(); window.focus(); } });
  app.whenReady().then(() => {
    const dist = path.join(app.getAppPath(), 'dist');
    protocol.handle('app', async request => {
      if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
      const file = assetPath(request.url, dist);
      if (!file) return new Response('Forbidden', { status: 403 });
      try {
        if (!fs.statSync(file).isFile()) return new Response('Not found', { status: 404 });
        const response = await net.fetch(pathToFileURL(file).href, { method: request.method });
        const headers = new Headers(response.headers);
        headers.set('Content-Security-Policy', CSP);
        headers.set('X-Content-Type-Options', 'nosniff');
        return new Response(response.body, { status: response.status, headers });
      } catch { return new Response('Not found', { status: 404 }); }
    });
    window = new BrowserWindow({ width: 1500, height: 960, minWidth: 800, minHeight: 600, show: false,
      title: `Forma ${app.getVersion()}`, backgroundColor: '#111217', icon: path.join(__dirname, 'icon.png'),
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, webviewTag: false, spellcheck: false }
    });
    window.removeMenu();
    const session = window.webContents.session;
    session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    session.setPermissionCheckHandler(() => false);
    session.on('will-download', (event, item, contents) => {
      if (contents !== window?.webContents || !item.getURL().startsWith('blob:app://forma/')) { event.preventDefault(); return; }
      item.setSaveDialogOptions({ title: 'Сохранить проект Forma', defaultPath: path.join(app.getPath('downloads'), downloadName(item.getFilename())), filters: [{ name: 'Forma project', extensions: ['forma.json'] }] });
    });
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (externalAllowed(url)) void shell.openExternal(url).catch(() => {});
      return { action: 'deny' };
    });
    window.webContents.on('will-navigate', event => event.preventDefault());
    window.webContents.on('will-attach-webview', event => event.preventDefault());
    window.webContents.on('will-prevent-unload', event => {
      const choice = dialog.showMessageBoxSync(window, { type: 'question', buttons: ['Продолжить работу', 'Закрыть без сохранения'], defaultId: 0, cancelId: 0, title: 'Forma', message: 'Последние изменения ещё не сохранены.', detail: 'Подождите появления «Сохранено» или скачайте JSON через Экспорт.' });
      if (choice === 1) event.preventDefault();
    });
    window.once('ready-to-show', () => window.show());
    window.webContents.on('did-fail-load', (_event, code, description) => {
      if (code !== -3) dialog.showErrorBox('Forma — ошибка запуска', `${description}\nПопробуйте переустановить приложение. Ваши проекты находятся в ${profile}.`);
    });
    window.on('closed', () => { window = null; });
    Menu.setApplicationMenu(null);
    void window.loadURL('app://forma/');
  }).catch(error => { dialog.showErrorBox('Forma — ошибка запуска', error.message); app.quit(); });
  app.on('window-all-closed', () => app.quit());
}
