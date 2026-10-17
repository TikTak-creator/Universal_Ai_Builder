# Forma for Windows / Forma для Windows

## English

### Install and start

1. Download `Forma-0.3.0-Setup-win-x64.exe` from the [official release](https://github.com/TikTak-creator/Universal_Ai_Builder/releases/latest).
2. Run it, choose English or Russian, select a folder and finish installation. It installs for the current user; administrator rights are not required.
3. Open **Forma** from the desktop or Start menu. Node.js, npm and a separate browser are not required. Windows 10/11 x64 is the target platform. ARM64 and macOS/Linux packages are not provided.
4. Explore Orbit, or choose **Файл → Новый проект**. The editor itself is currently in Russian.
5. Wait for **Сохранено** after editing. Use **Экспорт → Скачать JSON** for a portable backup; the desktop app opens a Windows save dialog. If you cancel that dialog, no file is saved.

The installer and application are unsigned. Windows may show an unknown-publisher/SmartScreen prompt. Verify the official repository and SHA-256 hash before deciding whether to run the file. No signing certificate is bundled or claimed.

### Projects, backups and updates

- Projects live in IndexedDB under `%APPDATA%\Forma`, at the stable internal origin `app://forma/`. They are local and not encrypted by Forma; use your Windows account/device protection for sensitive work.
- The same store is used by the installed app and the Windows ZIP edition. Browser projects are separate: transfer them via `.forma.json` export/import.
- Copy the whole profile directory only while Forma is fully closed. For routine backups, use JSON. External image URLs stay external; embed local image files for a more self-contained document.
- To update, export important projects, close Forma, then install the new release into the same folder. Keep the same profile. There is no automatic updater.
- Uninstall through Windows Settings → Apps. The application files and shortcuts are removed; the project profile is preserved. Deleting `%APPDATA%\Forma` yourself permanently removes those local projects.
- To use the ZIP edition, extract **all** files from `Forma-0.3.0-Windows-x64.zip` and open `Forma.exe`. Do not extract only the EXE. This is a no-install edition, not a USB profile: data still lives in AppData.
- Advanced: set `FORMA_PROFILE` to a distinct absolute directory before launch to use a separate workspace. The directory is created if missing. Concurrent instances for the same profile are prevented. Back up the correct profile.

### Troubleshooting

| Symptom | Action |
| --- | --- |
| App does not start | Re-extract the entire Windows ZIP, or reinstall into the same folder; keep the profile intact |
| Empty project list after switching edition | Check Windows account, `FORMA_PROFILE`, and whether the previous project was in a browser; import its JSON |
| External image is absent offline | Import a local image instead of keeping its URL |
| Save error | Export JSON, check free disk space and profile access; do not delete storage before backing up |
| Closing warns about unsaved edits | Continue editing and wait for “Сохранено”, or export JSON before closing |

## Русский

### Установка и первый запуск

1. Скачайте `Forma-0.3.0-Setup-win-x64.exe` из [официального релиза](https://github.com/TikTak-creator/Universal_Ai_Builder/releases/latest).
2. Запустите установщик, выберите русский или английский язык и папку. Установка идёт для текущего пользователя, без прав администратора.
3. Откройте **Forma** через рабочий стол или меню «Пуск». Node.js, npm и отдельный браузер не нужны. Целевая платформа — Windows 10/11 x64; сборок ARM64, Linux и macOS нет.
4. Изучите Orbit или создайте работу через **Файл → Новый проект**. Сам редактор пока русскоязычный.
5. Дождитесь **Сохранено** после изменений. Через **Экспорт → Скачать JSON** откроется системный диалог сохранения резервной копии. При отмене диалога файл не создаётся.

У установщика и приложения нет цифровой подписи. Windows может показать SmartScreen или неизвестного издателя. Проверьте официальный репозиторий и SHA-256 перед запуском. Подпись издателя не заявляется.

### Данные, перенос и обновления

- Проекты хранятся в IndexedDB внутри `%APPDATA%\Forma`, с постоянным внутренним адресом `app://forma/`. Forma не шифрует эти данные: защита учётной записи и диска остаётся на уровне Windows.
- У установленной версии и ZIP-версии общее хранилище. У браузера отдельное: переносите проекты экспортом и импортом `.forma.json`.
- Полную копию папки профиля делайте только при закрытой Forma. Для повседневных копий используйте JSON. Внешние картинки остаются ссылками; локально импортированные изображения входят в документ.
- Перед обновлением экспортируйте важные проекты, закройте Forma и установите новую версию в ту же папку. Сохраните прежний профиль. Автообновления нет.
- Удаление через «Параметры Windows → Приложения» убирает программу и ярлыки, но сохраняет профиль с проектами. Ручное удаление `%APPDATA%\Forma` уничтожит локальные работы.
- Для запуска без установки распакуйте **весь** `Forma-0.3.0-Windows-x64.zip` и откройте `Forma.exe`. Одного EXE недостаточно. Данные этой версии тоже находятся в AppData, а не на флешке рядом с программой.
- Для отдельного рабочего пространства можно перед запуском задать `FORMA_PROFILE` — абсолютный путь к отдельной папке. Она создастся автоматически; второй экземпляр с тем же профилем не запускается. Копируйте именно тот профиль, которым пользуетесь.

### Если что-то не работает

| Проблема | Решение |
| --- | --- |
| Не запускается | Распакуйте все файлы ZIP или переустановите программу; не удаляйте профиль с проектами |
| После смены версии нет работ | Проверьте учётную запись, `FORMA_PROFILE` и прежний браузер; импортируйте JSON |
| Картинка исчезла без интернета | Импортируйте локальный файл вместо внешней ссылки |
| Ошибка сохранения | Скачайте JSON, проверьте место на диске и доступ к профилю; не очищайте его до резервной копии |
| При закрытии есть предупреждение | Продолжите работу, дождитесь «Сохранено» или экспортируйте JSON |
