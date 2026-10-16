import { useState } from 'react';
import { ArrowUpRight, Search, Sparkles } from 'lucide-react';
import { iconLibrary, searchIcons } from '../assets/iconLibrary';
import { useEditor } from '../store/editor';
import { Modal } from './Modal';
import type { LibraryIcon } from '../assets/iconLibrary';

const colors = ['#c4b5fd','#f5b5cf','#fdba9a','#e1d798','#a6dfbf','#9acff2','#f5f4fb'];
export function IconPicker({ onClose, targetId }: { onClose: () => void; targetId?: string }) {
  const target = useEditor.getState().project.nodes[targetId ?? ''];
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('Все');
  const [color, setColor] = useState(target?.styles.color ?? colors[0]); const [soft, setSoft] = useState(false);
  const [stroke, setStroke] = useState(target?.properties.iconStrokeWidth ?? 1.75);
  const results = searchIcons(query, category);
  function choose(icon: LibraryIcon) {
    const s = useEditor.getState();
    if (!targetId && Object.keys(s.project.nodes).length >= 5000) { s.notify('Лимит — 5000 компонентов.'); return; }
    s.beginGesture();
    try {
      if (!targetId) s.add('icon');
      const id = targetId ?? useEditor.getState().selection[0];
      if (!id || useEditor.getState().project.nodes[id]?.type !== 'icon') return;
      s.updateNode(id, { name: icon.label }, 'properties', { iconName: icon.id, iconStrokeWidth: stroke });
      s.updateNode(id, {}, 'styles', { color, ...(!targetId && soft ? { background: `color-mix(in srgb, ${color} 12%, transparent)`, padding: 12, borderRadius: 16 } : {}) });
      if (!targetId && soft) s.updateNode(id, {}, 'geometry', { width: 64, height: 64 });
    } finally { s.endGesture(); }
    onClose();
  }
  return <Modal title="Маленькие детали. Большой характер." subtitle={`${iconLibrary.length} красивых иконок Lucide. Бесплатно, встроено в редактор, доступно офлайн.`} onClose={onClose} wide>
    <div className="icon-picker-tools"><div className="search-box"><Search size={15} /><input autoFocus aria-label="Поиск иконок" placeholder="Сердце, поиск, rocket…" value={query} onChange={e => setQuery(e.target.value)} /><kbd>⌕</kbd></div><div className="icon-picker-options"><div className="icon-palette">{colors.map(c => <button key={c} style={{ background: c }} className={color === c ? 'active' : ''} aria-label={`Цвет иконок ${c}`} onClick={() => setColor(c)} />)}</div><select aria-label="Толщина линий в библиотеке" value={stroke} onChange={e => setStroke(Number(e.target.value))}><option value={1.25}>Тонкие</option><option value={1.75}>Обычные</option><option value={2.5}>Выразительные</option></select>{!targetId && <button className={`soft-button ${soft ? 'active' : ''}`} aria-pressed={soft} onClick={() => setSoft(v => !v)}>Мягкий фон</button>}</div></div>
    <div className="icon-categories">{['Все', ...new Set(iconLibrary.map(i => i.category))].map(c => <button key={c} className={c === category ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div>
    <div className="icon-results"><div className="icon-result-count"><span>{query ? 'РЕЗУЛЬТАТЫ ПОИСКА' : category === 'Все' ? 'НАЙДИТЕ СВОЙ СИМВОЛ' : category.toUpperCase()}</span><span>{results.length} иконок</span></div><div className="icon-catalog">{results.map(icon => <button key={icon.id} aria-label={`${targetId ? 'Заменить на' : 'Вставить иконку'}: ${icon.label}`} className="catalog-icon" onClick={() => choose(icon)} title={`${icon.label} · ${icon.id}`}><span className={soft ? 'catalog-glyph soft' : 'catalog-glyph'} style={{ color, background: soft ? `color-mix(in srgb, ${color} 12%, transparent)` : undefined }}><icon.Component size={28} strokeWidth={stroke} /></span><small>{icon.label}</small></button>)}</div>{!results.length && <div className="empty-state"><Sparkles size={28} /><strong>Такой иконки пока нет</strong><p>Попробуйте название на русском или английском.</p></div>}</div>
    <div className="icon-picker-footer"><span>Векторные · Масштабируются без потери качества</span><a href="https://lucide.dev/license" target="_blank" rel="noreferrer">Lucide · ISC / MIT <ArrowUpRight size={11} /></a></div>
  </Modal>;
}
