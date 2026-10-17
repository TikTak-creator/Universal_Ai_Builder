# Changelog

## 0.3.0 — Desktop release

- Windows x64 desktop edition using Electron, with the existing React editor and document schema v2.
- Per-user English/Russian installer, shortcuts and uninstaller; separate no-install Windows ZIP.
- Stable `app://forma/` origin and persistent `%APPDATA%\Forma` profile; data retained after uninstall.
- Sandboxed renderer with Node integration disabled, context isolation, CSP, bounded asset access, denied permission requests, and an exact allowlist for external documentation links. JSON downloads use a system save dialog.
- Explicit Tailwind source scanning, independent of nearby documentation and generated output.
- Reproducible release script, exact source archive, static web archive, build manifest and SHA-256 checksums.
- English and Russian READMEs with the supplied decorative banner, plus installation, backup and release guides.
- Updated Vitest to 5.0.5 and pinned Vite 6.4.4; packaging downloader uses a patched global-agent override.

Canvas behavior, document model, JSON schema, layout, and editor controls remain the v0.2 Visual Toolkit implementation. No AI generation, application backend, code generator, cloud sync, or automatic updater is introduced.

## 0.2.0 — Visual Toolkit

Existing web editor with local IndexedDB projects, nested canvas elements, geometry/history commands, icons, project fonts, effects and JSON import/export. Source baseline: `ed71108` on `main`.
