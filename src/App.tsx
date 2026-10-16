import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, Check, CheckCircle2, ChevronDown, CircleHelp, Command, FilePlus2, Focus, FolderOpen, Grid2X2, Keyboard, Layers, Loader2, Magnet, Monitor, MoreHorizontal, Play, Redo2, Ruler, Save, SaveAll, Settings2, Type, Undo2, Upload, X } from 'lucide-react';
import { useEditor, saveAsCopy } from './store/editor';
import { usePersistence, persistNow } from './hooks/usePersistence';
import { useShortcuts } from './hooks/useShortcuts';
import { parseProject } from './model/document';
import { Canvas } from './canvas/Canvas';
import { LayersPanel } from './panels/LayersPanel';
import { Inspector } from './panels/Inspector';
import { NewProjectDialog, OpenProjectDialog, ExportDialog } from './components/ProjectDialogs';
import { Modal } from './components/Modal';
import { Preview } from './components/Preview';
import { FontManager } from './components/FontManager';
import { useProjectFonts } from './hooks/useProjectFonts';

const shortcuts = [['V / H','Выделение / рука'],['Space + drag','Перемещение холста'],['Ctrl + колесо','Масштабирование'],['Shift + 1','Вместить холст'],['Shift + клик','Выделить несколько'],['Стрелки / Shift','Сдвиг на 1 / 10 px'],['Shift + resize','Сохранять пропорции'],['Shift + rotate','Поворот с шагом 15°'],['Alt + drag','Отключить привязки'],['Ctrl + Z / Shift Z','Отменить / повторить'],['Ctrl + C / X / V','Буфер редактора'],['Ctrl + D','Дублировать'],['Ctrl + G / Shift G','Группировать / разобрать'],['Ctrl + S / Shift S','Сохранить / копию'],['Ctrl + O / N','Открыть / создать'],['Ctrl + E','Экспорт JSON'],['Delete','Удалить'],['Escape','Отменить жест / снять выбор']];
export default function App() {
  const [dialog, setDialog] = useState<string | null>(null); const [fileMenu, setFileMenu] = useState(false);
  const [compactPanel, setCompactPanel] = useState<'layers' | 'inspector' | null>(null);
  const importRef = useRef<HTMLInputElement>(null); const menuRef = useRef<HTMLDivElement>(null);
  const project = useEditor(s => s.project); const revision = useEditor(s => s.revision); const savedRevision = useEditor(s => s.savedRevision);
  const saving = useEditor(s => s.saving); const saveError = useEditor(s => s.saveError); const ready = useEditor(s => s.ready);
  const past = useEditor(s => s.past.length); const future = useEditor(s => s.future.length); const toast = useEditor(s => s.toast);
  const grid = useEditor(s => s.grid); const snap = useEditor(s => s.snap); const rulers = useEditor(s => s.rulers); const smart = useEditor(s => s.smart); const preview = useEditor(s => s.preview);
  usePersistence();
  const fontError = useProjectFonts(project.fonts);
  useEffect(() => { if (fontError) useEditor.getState().notify(fontError); }, [fontError]);
  const command = useCallback((name: string) => {
    setFileMenu(false);
    if (name === 'save') { void persistNow().then(() => useEditor.getState().notify('Проект сохранён на этом устройстве')).catch(() => {}); return; }
    if (name === 'saveAs') { void persistNow().then(() => { saveAsCopy(); useEditor.getState().notify('Создана отдельная копия проекта'); }).catch(() => {}); return; }
    if (name === 'import') { importRef.current?.click(); return; }
    if (name === 'fit') { const el = document.querySelector('[data-testid="canvas"]'); if (el) useEditor.getState().fit(el.clientWidth, el.clientHeight); return; }
    setDialog(name);
  }, []);
  useShortcuts(command);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => useEditor.setState({ toast: '' }), 3400); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    const close = (e: PointerEvent) => { if (!menuRef.current?.contains(e.target as Node)) setFileMenu(false); };
    window.addEventListener('pointerdown', close); return () => window.removeEventListener('pointerdown', close);
  }, []);
  return <div className="app-shell">
    <header className="app-header"><div className="brand"><div className="brand-mark"><span /><span /><span /></div><span>forma<span className="brand-dot">.</span></span><span className="beta-label">LOCAL</span></div><div className="header-divider" />
      <div className="file-menu-container" ref={menuRef}><button className={`file-menu-trigger ${fileMenu ? 'active' : ''}`} onClick={() => setFileMenu(v => !v)} aria-label="Меню файла" aria-expanded={fileMenu}>Файл <ChevronDown size={12} /></button>{fileMenu && <div className="file-menu context-menu"><button onClick={() => command('new')}><FilePlus2 size={14} />Новый проект<kbd>Ctrl N</kbd></button><button onClick={() => command('open')}><FolderOpen size={14} />Открыть<kbd>Ctrl O</kbd></button><hr /><button onClick={() => command('save')}><Save size={14} />Сохранить<kbd>Ctrl S</kbd></button><button onClick={() => command('saveAs')}><SaveAll size={14} />Сохранить копию</button><hr /><button onClick={() => command('import')}><Upload size={14} />Импорт JSON</button><button onClick={() => command('export')}><ArrowDownToLine size={14} />Экспорт JSON<kbd>Ctrl E</kbd></button></div>}</div>
      <div className="project-breadcrumb"><span className="muted">Проекты</span><span className="breadcrumb-slash">/</span><input aria-label="Название текущего проекта" value={project.name} maxLength={100} onFocus={() => useEditor.getState().beginGesture()} onBlur={() => useEditor.getState().endGesture()} onChange={e => useEditor.getState().mutate(p => { p.name = e.target.value; })} /><ChevronDown size={12} /></div>
      <div className={`save-indicator ${saveError ? 'error-text' : ''}`} title={saveError || 'Автосохранение в IndexedDB'}>{saving ? <Loader2 size={13} className="animate-spin" /> : saveError ? <X size={13} /> : <CheckCircle2 size={13} />}<span>{saveError ? 'Ошибка сохранения' : saving ? 'Сохранение…' : savedRevision === revision ? 'Сохранено' : 'Изменено'}</span></div>
      <div className="header-actions"><button className="icon-button" aria-label="Открыть шрифты проекта" title="Шрифты проекта" onClick={() => command('fonts')}><Type size={16} /></button><button className="icon-button" aria-label="Сохранить проект" onClick={() => command('save')}><Save size={16} /></button><button className="soft-button preview-button" aria-label="Предпросмотр" onClick={() => useEditor.setState({ preview: true })}><Play size={13} fill="currentColor" /><span>Предпросмотр</span></button><button className="primary-button" onClick={() => command('export')}>Экспорт <ArrowDownToLine size={14} /></button></div>
    </header>
    <div className="workspace-toolbar"><div className="document-tab"><div className="tab-dot" />Главная страница <span className="tiny-tag">01</span></div><div className="toolbar-center"><span className="mode-pill"><Monitor size={13} />Free Design</span><span className="toolbar-description">Ваше пространство для идей</span></div><div className="toolbar-actions"><button className="icon-button" aria-label="Отменить (Ctrl+Z)" disabled={!past} onClick={() => useEditor.getState().undo()}><Undo2 size={16} /></button><button className="icon-button" aria-label="Повторить (Ctrl+Shift+Z)" disabled={!future} onClick={() => useEditor.getState().redo()}><Redo2 size={16} /></button><span className="control-separator" /><button className={`icon-button ${grid ? 'active' : ''}`} aria-label="Сетка" title="Сетка" aria-pressed={grid} onClick={() => useEditor.setState({ grid: !grid })}><Grid2X2 size={15} /></button><button className={`icon-button ${snap ? 'active' : ''}`} aria-label="Привязка к сетке" title="Привязка к сетке 8 px" aria-pressed={snap} onClick={() => useEditor.setState({ snap: !snap })}><Magnet size={15} /></button><button className={`icon-button ${smart ? 'active' : ''}`} aria-label="Умные направляющие" title="Умные направляющие" aria-pressed={smart} onClick={() => useEditor.setState({ smart: !smart })}><Focus size={15} /></button><button className={`icon-button ${rulers ? 'active' : ''}`} aria-label="Линейки" title="Линейки: потяните для создания направляющей" aria-pressed={rulers} onClick={() => useEditor.setState({ rulers: !rulers })}><Ruler size={15} /></button><span className="control-separator" /><button className="icon-button" aria-label="Горячие клавиши" onClick={() => command('help')}><CircleHelp size={16} /></button></div></div>
    <div className="compact-panel-bar"><button className={compactPanel === 'layers' ? 'active' : ''} onClick={() => setCompactPanel(v => v === 'layers' ? null : 'layers')}><Layers size={13} />Слои и элементы</button><span>FREE DESIGN</span><button className={compactPanel === 'inspector' ? 'active' : ''} onClick={() => setCompactPanel(v => v === 'inspector' ? null : 'inspector')}><Settings2 size={13} />Свойства</button></div>
    <div className={`workspace ${compactPanel ? `show-${compactPanel}` : ''}`}><LayersPanel /><Canvas /><Inspector onOpenFonts={() => setDialog('fonts')} /></div>
    <footer className="app-status"><span><span className="status-dot" />{saveError ? <button className="error-text" onClick={() => command('save')}>{saveError} · Повторить</button> : 'Все данные остаются на вашем устройстве'}</span><div><span className="phase-status">Visual Toolkit <span>v0.2</span></span><button onClick={() => command('help')}><Keyboard size={12} />Горячие клавиши</button><MoreHorizontal size={15} /></div></footer>
    <input ref={importRef} type="file" accept=".json,application/json" hidden onChange={e => {
      const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
      if (file.size > 25_000_000) return useEditor.getState().notify('Максимальный размер проекта — 25 МБ.');
      void file.text().then(async text => { const p = parseProject(text); await persistNow(); useEditor.getState().setProject(p); useEditor.getState().notify('Проект импортирован'); }).catch((error: unknown) => useEditor.getState().notify(error instanceof Error ? error.message : 'Не удалось импортировать проект.'));
    }} />
    {dialog === 'new' && <NewProjectDialog onClose={() => setDialog(null)} />}{dialog === 'open' && <OpenProjectDialog onClose={() => setDialog(null)} />}{dialog === 'export' && <ExportDialog onClose={() => setDialog(null)} />}
    {dialog === 'fonts' && <FontManager onClose={() => setDialog(null)} />}
    {dialog === 'help' && <Modal title="Меньше кликов, больше идей" subtitle="Горячие клавиши и инструменты первого этапа." wide onClose={() => setDialog(null)}><div className="modal-body shortcut-grid">{shortcuts.map(([key, label]) => <div key={key} className="shortcut-line"><span>{label}</span><kbd>{key}</kbd></div>)}</div><div className="help-note"><Command size={15} /><p>Потяните из линейки, чтобы добавить направляющую. Двойной клик по ней удаляет её. В дереве слоёв перетаскивайте за ⋮⋮; область «Вложить в контейнер» меняет родителя. Все размеры заданы в px.</p></div></Modal>}
    {preview && <Preview />}
    {toast && <div className="toast" role="status"><Check size={15} /><span>{toast}</span><button aria-label="Скрыть уведомление" onClick={() => useEditor.setState({ toast: '' })}><X size={13} /></button></div>}
    {!ready && <div className="loading-screen"><Loader2 className="animate-spin" size={28} /><span>Открываем ваше пространство…</span></div>}
  </div>;
}
