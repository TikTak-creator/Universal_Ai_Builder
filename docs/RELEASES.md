# Building and publishing releases / Сборка релиза

## Reproduce the Windows release

Use Windows x64, Git, Node.js 22.12+ (22.x), 24.x, or 26+ with npm and PowerShell 5.1+. Internet is required for initial npm, Electron and NSIS downloads. Runtime is bundled in the resulting app.

```powershell
git switch redbox/desktop-release
npm ci
npm run release:win
```

The working tree must be clean. [Build-Release.ps1](../scripts/Build-Release.ps1) exports HEAD with `git archive`, extracts it into a new ignored directory, installs the exact lockfile, runs editor and desktop tests, audits runtime dependencies, and builds the installer from that isolated snapshot. It stops on failures; it never publishes automatically.

Outputs are in a fresh `release/v<version>-<timestamp>/`:

| Asset | Purpose |
| --- | --- |
| `Forma-<version>-Setup-win-x64.exe` | Assisted, per-user EN/RU installer and uninstaller |
| `Forma-<version>-Windows-x64.zip` | Whole Windows app, no install; projects still use AppData |
| `Forma-<version>-Source.zip` | Exact tracked Git source at the release commit, no dependencies or personal projects |
| `Forma-<version>-Web.zip` | Static web build; serve over HTTP(S) from the origin root |
| `release-manifest.json` | Version, source commit, Electron version, platform, build time |
| `SHA256SUMS.txt` | SHA-256 for every preceding asset |

The same manifest is inside each Windows app at `resources/release-manifest.json`. The isolated build is kept under `.artifacts/build-…` for inspection; dependencies and artifacts are ignored by Git.

`npm run desktop` builds and starts the desktop app locally. `npm run package:win` packages the working directory for development; the reproducible release command above additionally enforces a clean committed snapshot and creates source/web/Windows ZIPs and checksums.

Versions are pinned for Electron, electron-builder, Vite and Vitest; other resolved packages are pinned by `package-lock.json`. The `global-agent: 4.1.3` override removes the vulnerable legacy logging dependency used transitively by the packaging downloader. Windows packaging exercises this download path; a proxy-specific environment is not part of the smoke tests. Review the override on future builder updates.

## Verify and publish

1. Run the release script from the final commit. Test the actual installer and packaged app: fresh startup, edit, save, exit/reopen, import/export, bundled font, Preview, uninstall without deleting the profile. See [TESTING-DESKTOP.md](TESTING-DESKTOP.md).
2. Inspect source ZIP contents and the manifest commit. Do not package `.env`, credentials, `node_modules`, local profiles, or `.artifacts`.
3. Verify file hashes with `Get-FileHash -Algorithm SHA256 <file>` against `SHA256SUMS.txt`.
4. Create an annotated `v<version>` tag on the tested commit and push the release branch and tag. Keep `main` and earlier history.
5. Create a GitHub release for that tag and upload the six files listed above. Verify uploaded hashes/sizes and publish it. Record actual supported platforms, changes and test limits.

No signing identity, certificate or auto-update feed is configured. Production signing can be added later through electron-builder's documented Windows signing configuration and private CI secrets; never commit a certificate or its password. The Windows EXE presently has no publisher signature. Electron/Chromium license files are preserved in the Windows distribution, and public asset notices are bundled in `dist/`.

Official references: [Electron security](https://www.electronjs.org/docs/latest/tutorial/security), [custom protocols](https://www.electronjs.org/docs/latest/api/protocol/), [NSIS options](https://www.electron.build/docs/nsis/).

## По-русски

Релиз собирается командой `npm run release:win` на Windows из чистого Git-коммита. Скрипт сам экспортирует точные исходники, устанавливает lock-файл в отдельную папку, запускает тесты, проверяет runtime-зависимости и делает установщик, Windows ZIP, Source ZIP, Web ZIP, манифест и SHA256SUMS. В GitHub он ничего не отправляет.

Для проверки хеша: `Get-FileHash -Algorithm SHA256 .\Forma-0.3.0-Setup-win-x64.exe`. Сверьте результат с `SHA256SUMS.txt` официального релиза. Перед публикацией проверьте установленное приложение, данные после перезапуска и удаление программы с сохранением профиля. Ветка релиза — `redbox/desktop-release`; `main` и предыдущие коммиты сохраняются.

Среда Electron входит в пакет. Интернет нужен при сборке, а при использовании — только для внешних изображений и открытия справочных ссылок. Автообновления и подписи издателя сейчас нет. Уведомление Windows об неизвестном издателе нужно учитывать при распространении.
