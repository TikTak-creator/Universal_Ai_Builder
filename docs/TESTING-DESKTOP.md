# Desktop verification / Проверка Windows-версии

Release preparation: **18 October 2026**, Windows 11 x64 (build 26200), Node.js 24.16.0, Electron 44.9.0 / Chromium 152.0.7977.167.

## Automated source checks

- `npm test`: **80 tests in 8 files pass**, using Vitest 5.0.5. Existing model, geometry, operations, history, assets, renderer and IndexedDB tests are unchanged.
- `npm run test:desktop`: **7 tests pass**: asset mapping, origin/credential/port rejection, encoded Windows traversal, normalized paths, exact external-link allowlist, download filenames and CSP policy.
- `npm run build`: strict TypeScript and production Vite build pass.
- `npm audit`: **0 known reported vulnerabilities** at verification time, including development dependencies. This is a registry advisory check, not a security audit.

## Packaged application: 12 scenario groups

A separate QA profile was used; existing personal projects were not loaded or modified. The actual packaged and installed `Forma.exe` was controlled through Chrome DevTools Protocol for this verification.

| Scenario | Result |
| --- | --- |
| Start at stable `app://forma/` origin | Pass |
| `require` and `process` absent in renderer; secure context enabled | Pass |
| Built assets and font available; CSP present; outside file path unavailable; POST rejected | Pass |
| Install bundled Manrope through font manager without CDN | Pass |
| Change project name and wait for IndexedDB autosave | Pass |
| Fully close and restart: changed project restored | Pass |
| Import Visual Toolkit v2 document, load embedded font and save | Pass |
| Open/close shared-renderer Preview | Pass |
| Export JSON: 27 nodes, schema v2 and embedded font preserved | Pass |
| Unlisted external popup denied | Pass |
| Fully restart again: imported document restored | Pass |
| No renderer exceptions or unexpected console errors; no HTTP requests in tested workflows | Pass |

Security probes intentionally trigger blocked-origin/404/405 responses; these expected failures are separate from application errors. JSON export was checked with an automated download directory through CDP; the interactive Windows Save dialog and its cancellation were not automated. No external image was present in these offline scenarios. External links/images naturally may use the network.

## Installer and uninstaller

The real NSIS installer completed a silent per-user installation into a separate test directory with exit code 0. The installed EXE, version 0.3.0 registration, desktop shortcut and Start menu shortcut were checked. The installed app passed all 12 scenario groups above. Its uninstaller completed with exit code 0, removed application files, shortcuts and registration, and retained the separate test profile containing saved IndexedDB data.

English/Russian installer resources are configured; the interactive wizard language-selection flow was not automated. The EXE and installer have no publisher signature (`NotSigned`).

## Documentation

Both READMEs were processed by GitHub's Markdown API and inspected locally with a GitHub-like dark stylesheet at widths 1440 and 390 px. All four local images loaded; the page itself had no horizontal overflow. Local documentation links were checked, including filename case. The supplied banner is byte-identical to the owner's image. This preview checks Markdown output and a local layout, not every detail of the GitHub website stylesheet.

## Boundaries and repeating the checks

These are targeted release smoke checks. Windows 10, ARM emulation, other operating systems, proxy-specific downloads, a real device upgrade from a previous desktop release, interactive wizard navigation, stress workloads, and every editing gesture were not tested here. This is the first desktop release. Existing detailed web-editor checks remain in [TESTING.md](TESTING.md).

For a new release: run the commands above and [Build-Release.ps1](../scripts/Build-Release.ps1), install its resulting EXE, reproduce the scenario table, export backups, then uninstall the test installation and verify profile preservation. The source test suites are in the repository; the release-session CDP harness is local QA tooling rather than an installed product feature. [Release packaging guide](RELEASES.md).

## Кратко по-русски

Прошли 80 тестов редактора, 7 проверок desktop-политик, TypeScript и production-сборка. `npm audit` на момент проверки не сообщает об известных уязвимостях. Готовая и установленная программа прошла 12 групп сценариев: запуск, шрифты, импорт/экспорт, автосохранение, два полных перезапуска, Preview и ограничения оболочки. Проверены установка, ярлыки, версия, удаление файлов программы и сохранение тестовой базы.

Это ограниченная проверка релиза на Windows 11 x64, не полный аудит. Экспорт проверен автоматической загрузкой файла; клики по системному диалогу сохранения, мастер установки вручную, Windows 10 и предельные нагрузки в эту проверку не входили.
