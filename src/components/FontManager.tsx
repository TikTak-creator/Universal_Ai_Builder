import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Download, Loader2, Plus, Trash2, Type, Upload } from 'lucide-react';
import { useEditor } from '../store/editor';
import type { FontAsset } from '../model/types';
import { fontFamilyValue, loadFontAsset, prepareFontFile, validateFontAssets } from '../assets/fonts';
import { isUnavailable } from '../engine/geometry';
import { Field } from '../panels/Fields';
import { Modal } from './Modal';

const textTypes = ['text','button','badge','input','textarea','checkbox','select'];
export function FontManager({ onClose }: { onClose: () => void }) {
  const project = useEditor(s => s.project); const selection = useEditor(s => s.selection); const input = useRef<HTMLInputElement>(null);
  const alive = useRef(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [dragging, setDragging] = useState(false);
  const [sample, setSample] = useState('Ваши идеи обретают форму.');
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const applicable = selection.filter(id => textTypes.includes(project.nodes[id]?.type) && !isUnavailable(project, id));
  function apply(font: FontAsset) {
    useEditor.getState().mutate(p => applicable.forEach(id => { if (p.nodes[id]) p.nodes[id].styles.fontFamily = fontFamilyValue(font); }));
    useEditor.getState().notify(`Шрифт «${font.name}» применён`);
  }
  async function install(file: File, builtinLicense?: string) {
    if (busy) return; setBusy(true); setError(''); const projectId = useEditor.getState().project.id;
    try {
      const asset = await prepareFontFile(file); if (builtinLicense) { asset.name = 'Manrope'; asset.weight = '200 800'; asset.license = builtinLicense; }
      await loadFontAsset(asset);
      if (!alive.current || useEditor.getState().project.id !== projectId) return;
      const current = useEditor.getState().project;
      const existing = current.fonts.find(f => f.dataUrl === asset.dataUrl);
      if (!existing) validateFontAssets([...current.fonts, asset]);
      const font = existing ?? asset;
      useEditor.getState().mutate(p => {
        if (!existing) p.fonts.push(asset);
        applicable.forEach(id => { if (p.nodes[id] && !isUnavailable(p, id)) p.nodes[id].styles.fontFamily = fontFamilyValue(font); });
      });
      useEditor.getState().notify(`${existing ? 'Уже доступен' : 'Загружен'} шрифт «${font.name}»${applicable.length ? ' и применён к выбранному тексту' : ''}`);
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : 'Не удалось загрузить шрифт.'); }
    finally { if (alive.current) setBusy(false); }
  }
  async function installManrope() {
    try {
      const [response, license] = await Promise.all([fetch('/fonts/Manrope-Variable.ttf'), fetch('/fonts/OFL.txt')]);
      if (!response.ok || !license.ok) throw new Error('Не найден файл встроенного шрифта или его лицензия.');
      await install(new File([await response.blob()], 'Manrope-Variable.ttf', { type: 'font/ttf' }), await license.text());
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось загрузить Manrope.'); }
  }
  function update(id: string, values: Partial<FontAsset>) {
    useEditor.getState().mutate(p => { const font = p.fonts.find(f => f.id === id); if (font) Object.assign(font, values); });
  }
  function remove(font: FontAsset) {
    useEditor.getState().mutate(p => {
      p.fonts = p.fonts.filter(f => f.id !== font.id);
      Object.values(p.nodes).forEach(n => { if (n.styles.fontFamily.includes(font.family)) n.styles.fontFamily = 'Inter, system-ui, sans-serif'; });
    });
  }
  return <Modal title="Типографика с вашим характером" subtitle="Загрузите любимый шрифт. Он сохранится внутри проекта и будет доступен офлайн." onClose={onClose} wide><div className="modal-body font-manager">
    <input ref={input} hidden type="file" accept=".ttf,.otf,.woff,.woff2" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void install(file); }} />
    <button className={`font-dropzone ${dragging ? 'is-over' : ''}`} disabled={busy} onClick={() => input.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file) void install(file); }}><span className="font-upload-symbol">{busy ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}</span><strong>{busy ? 'Проверяем и загружаем шрифт…' : 'Перетащите файл шрифта сюда'}</strong><small>или нажмите, чтобы выбрать · TTF, OTF, WOFF, WOFF2 · до 4 МБ</small></button>
    <div className="bundled-font"><div className="manrope-symbol">Aa</div><div><strong>Manrope</strong><p>Бесплатный вариативный шрифт · кириллица · 200–800</p></div><button className="soft-button" disabled={busy} onClick={() => void installManrope()}><Plus size={13} />Установить</button></div>
    {error && <p className="font-error" role="alert">{error}</p>}
    <div className="font-list-heading"><span>ШРИФТЫ ПРОЕКТА</span><span>{project.fonts.length} / 30</span></div>
    {project.fonts.length > 0 && <input className="font-sample-input" aria-label="Текст образца шрифтов" value={sample} onChange={e => setSample(e.target.value)} placeholder="Текст для проверки шрифтов…" />}
    <div className="font-asset-list">{project.fonts.map(font => <article key={font.id} className="font-asset"><div className="font-asset-heading"><Type size={15} /><Field label="Имя" ariaLabel={`Название шрифта ${font.name}`} value={font.name} onChange={v => update(font.id, { name: v })} /><span className="tiny-tag">{font.format === 'truetype' ? 'TTF' : font.format.toUpperCase()}</span><button aria-label={`Удалить шрифт ${font.name}`} onClick={() => remove(font)}><Trash2 size={14} /></button></div><div className="font-asset-sample" style={{ fontFamily: fontFamilyValue(font), fontWeight: font.weight.includes(' ') ? 500 : Number(font.weight), fontStyle: font.style }}>{sample || 'Aa Бб 123'}</div><div className="font-asset-controls"><select aria-label={`Начертание шрифта ${font.name}`} value={font.weight} onChange={e => update(font.id, { weight: e.target.value })}>{['100','200','300','400','500','600','700','800','900','100 900','200 800'].map(weight => <option key={weight} value={weight}>{weight.includes(' ') ? `Variable ${weight.replace(' ', '–')}` : `Вес ${weight}`}</option>)}</select><select aria-label={`Стиль шрифта ${font.name}`} value={font.style} onChange={e => update(font.id, { style: e.target.value as FontAsset['style'] })}><option value="normal">Обычный</option><option value="italic">Курсив</option></select><button className="soft-button" disabled={!applicable.length} onClick={() => apply(font)}><Check size={12} />Применить</button></div></article>)}</div>
    {!project.fonts.length && <p className="font-empty">Здесь появятся ваши шрифты. При загрузке шрифт автоматически применяется к выбранным текстовым элементам.</p>}
    <div className="font-manager-bottom"><span><Download size={12} />Шрифты включаются в JSON проекта.</span><a href="https://fonts.google.com/" target="_blank" rel="noreferrer">Найти шрифты <ArrowUpRight size={11} /></a></div><small className="font-limit-note">До 16 МБ шрифтов на проект. Удаление шрифта заменит его в элементах на системный; действие можно отменить.</small>
  </div></Modal>;
}
