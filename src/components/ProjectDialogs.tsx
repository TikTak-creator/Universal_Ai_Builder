import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, File, FileJson, FolderOpen, Layers, Loader2, Plus, Trash2 } from 'lucide-react';
import { createDemo, createProject, serializeProject } from '../model/document';
import { useEditor } from '../store/editor';
import { deleteProject, listProjects, loadProject } from '../storage/projects';
import { persistNow } from '../hooks/usePersistence';
import { Modal } from './Modal';

export function downloadProject() {
  const p = useEditor.getState().project;
  const url = URL.createObjectURL(new Blob([serializeProject(p)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `${p.name.replace(/[^\p{L}\p{N} _.-]/gu, '').slice(0, 80) || 'project'}.forma.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); useEditor.getState().notify('JSON проекта сохранён в загрузки');
}
export function NewProjectDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('Новый проект'); const [template, setTemplate] = useState('blank');
  const [width, setWidth] = useState(1120); const [height, setHeight] = useState(780); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function create() {
    setBusy(true); setError('');
    try {
      await persistNow(); const p = template === 'demo' ? createDemo() : createProject(name.trim()); p.name = name.trim(); p.canvas.width = width; p.canvas.height = height;
      useEditor.getState().setProject(p); onClose();
    } catch { setError('Не удалось сохранить текущий проект. Скачайте его JSON перед созданием нового.'); } finally { setBusy(false); }
  }
  return <Modal title="Начните с новой идеи" subtitle="Каждый большой проект начинается с чистого холста." onClose={onClose}><div className="modal-body"><label className="dialog-label">Название проекта<input autoFocus value={name} onChange={e => setName(e.target.value)} maxLength={100} /></label><div className="template-grid"><button className={`template-card ${template === 'blank' ? 'active' : ''}`} onClick={() => setTemplate('blank')}><div className="template-preview blank-preview"><Plus size={24} /></div><strong>Чистый холст</strong><span>Ваша следующая идея</span>{template === 'blank' && <Check size={14} className="template-check" />}</button><button className={`template-card ${template === 'demo' ? 'active' : ''}`} onClick={() => setTemplate('demo')}><div className="template-preview orbit-preview"><span>orbit</span><i /><b /><em /></div><strong>Orbit workspace</strong><span>Демонстрационный проект</span>{template === 'demo' && <Check size={14} className="template-check" />}</button></div><div className="field-grid"><label className="dialog-label">Ширина, px<input aria-label="Ширина нового проекта" type="number" min={100} max={10000} value={width} onChange={e => setWidth(Number(e.target.value))} /></label><label className="dialog-label">Высота, px<input aria-label="Высота нового проекта" type="number" min={100} max={10000} value={height} onChange={e => setHeight(Number(e.target.value))} /></label></div>{error && <p className="error-text">{error}</p>}</div><footer><button className="soft-button" onClick={onClose}>Отмена</button><button className="primary-button" disabled={busy || !name.trim() || width < 100 || height < 100 || width > 10000 || height > 10000} onClick={() => void create()}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}Создать проект</button></footer></Modal>;
}
export function OpenProjectDialog({ onClose }: { onClose: () => void }) {
  const [projects, setProjects] = useState<{ id: string; name: string; updatedAt: string }[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const refresh = () => listProjects().then(setProjects).catch(() => setError('Хранилище недоступно.')).finally(() => setLoading(false));
  useEffect(() => { void refresh(); }, []);
  async function open(id: string) {
    setBusy(true); try { await persistNow(); const p = await loadProject(id); if (!p) throw new Error('Проект не найден.'); useEditor.getState().setProject(p); onClose(); } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось открыть проект.'); } finally { setBusy(false); }
  }
  return <Modal title="Ваши пространства" subtitle="Проекты сохранены в этом браузере на вашем компьютере." onClose={onClose}><div className="modal-body project-list">
    {loading ? <div className="empty-state"><Loader2 className="animate-spin" /></div> : !projects.length ? <div className="empty-state"><FolderOpen size={30} /><p>Сохранённых проектов пока нет.</p></div> : projects.map(p => <div key={p.id} className="project-list-item"><button disabled={busy} onClick={() => void open(p.id)}><div className="project-icon"><Layers size={19} /></div><div><strong>{p.name}</strong><small>{new Date(p.updatedAt).toLocaleString('ru-RU')}</small></div><ArrowUpRight size={16} /></button>{p.id !== useEditor.getState().project.id && <button aria-label={`Удалить проект ${p.name}`} className="delete-project" disabled={busy} onClick={() => { if (window.confirm(`Удалить локальную копию «${p.name}»?`)) void deleteProject(p.id).then(refresh).catch(() => setError('Не удалось удалить проект.')); }}><Trash2 size={14} /></button>}</div>)}{error && <p className="error-text">{error}</p>}
  </div></Modal>;
}
export function ExportDialog({ onClose }: { onClose: () => void }) {
  const p = useEditor(s => s.project);
  return <Modal title="Экспорт проекта" subtitle="Сохраните редактируемый исходник и перенесите его в другой браузер." onClose={onClose}>
    <div className="modal-body">
      <div className="export-option"><div className="project-icon"><FileJson size={24} /></div><div><strong>Forma JSON</strong><p>Все слои · иконки · шрифты · изображения</p></div><span className="tiny-tag purple">v{p.schemaVersion}</span></div>
      <div className="export-stats"><span><Layers size={14} />{Object.keys(p.nodes).length} компонентов</span>{p.fonts.length > 0 && <span>Шрифты: {p.fonts.length}</span>}<span><File size={14} />{(new Blob([serializeProject(p)]).size / 1024).toFixed(1)} КБ</span></div>
      <div className="info-note">JSON сохраняет редактируемый документ и встроенные ресурсы. Генераторы HTML, React и Flutter относятся к следующему этапу экспорта и пока не реализованы.</div>
    </div>
    <footer><button className="soft-button" onClick={onClose}>Закрыть</button><button className="primary-button" onClick={downloadProject}>Скачать JSON <ArrowUpRight size={14} /></button></footer>
  </Modal>;
}
