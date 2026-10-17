# Forma — web build / веб-сборка

This folder contains a static production build, not the editable source.
Serve the entire folder at the root of an HTTP(S) origin. Do not double-click index.html: file:// is not supported.
For example, with Python installed, run `python -m http.server 8080 --bind 127.0.0.1` in this folder, then visit http://127.0.0.1:8080.
Use a stable hostname and port: IndexedDB belongs to the browser profile and origin. A new port means a different project store.
Export `.forma.json` backups before clearing browser storage. No backend is required. Remote image URLs need internet access.
For ordinary Windows users, the separate Setup EXE is the easier choice and includes its runtime.

В этой папке — готовая статическая веб-сборка, не исходный код.
Подавайте всю папку с корня HTTP(S)-сайта. Открытие index.html двойным кликом через file:// не поддерживается.
Например, при установленном Python выполните здесь `python -m http.server 8080 --bind 127.0.0.1` и откройте http://127.0.0.1:8080.
Не меняйте адрес и порт без переноса JSON: IndexedDB привязана к профилю браузера и origin.
Экспортируйте `.forma.json` перед очисткой данных браузера. Серверная логика не нужна; внешним изображениям нужен интернет.
Для обычной установки Windows используйте отдельный Setup EXE: он уже содержит среду запуска.
