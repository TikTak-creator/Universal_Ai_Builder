import { useState } from 'react';
import { ArrowDownUp, ArrowLeftRight, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { Gradient, Shadow, UINode } from '../model/types';
import { uid } from '../model/types';
import { useEditor } from '../store/editor';
import { gradientCSS } from '../model/customization';
import { findLibraryIcon } from '../assets/iconLibrary';
import { IconPicker } from '../components/IconPicker';
import { Field, ColorField } from './Fields';

const gradientPresets: { name: string; from: string; to: string }[] = [
  { name: 'Лавандовый закат', from: '#a18af2', to: '#f4b8ba' }, { name: 'Северное сияние', from: '#78d8c7', to: '#859cf2' },
  { name: 'Персиковый свет', from: '#ffcb95', to: '#f382a0' }, { name: 'Синий час', from: '#5965dc', to: '#b199eb' },
  { name: 'Свежая зелень', from: '#d4e598', to: '#72bfa6' },
];
export function FillPanel({ node }: { node: UINode }) {
  const s = node.styles; const g = s.gradient; const set = (values: Record<string, unknown>) => useEditor.getState().updateNode(node.id, {}, 'styles', values);
  const setGradient = (values: Partial<Gradient>) => set({ gradient: { ...g!, ...values } });
  return <section className="inspector-section"><h3>Заливка <span>Fill</span></h3><div className="segmented-control"><button className={!g ? 'active' : ''} onClick={() => set({ gradient: null })}>Цвет</button><button className={g ? 'active' : ''} onClick={() => set({ gradient: g ?? { type: 'linear', from: '#a18af2', to: '#f4b8ba', angle: 135 } })}>Градиент</button></div>
    {g ? <><div className="gradient-presets">{gradientPresets.map(preset => <button key={preset.name} aria-label={`Градиент: ${preset.name}`} title={preset.name} style={{ background: gradientCSS({ ...preset, type: 'linear', angle: 135 }) }} onClick={() => setGradient({ from: preset.from, to: preset.to })} />)}</div><div className="select-property"><select aria-label="Тип градиента" value={g.type} onChange={e => setGradient({ type: e.target.value as Gradient['type'] })}><option value="linear">Линейный</option><option value="radial">Радиальный</option><option value="conic">Конический</option></select></div><ColorField label="Начало градиента" value={g.from} onChange={v => setGradient({ from: v })} /><ColorField label="Конец градиента" value={g.to} onChange={v => setGradient({ to: v })} />{g.type !== 'radial' && <Field label="Угол градиента" value={g.angle} number min={-3600} max={3600} suffix="°" onChange={v => setGradient({ angle: Number(v) })} />}</> : <ColorField label="Фон" value={s.background} onChange={v => set({ background: v })} />}
    <div className="field-grid mt-2"><Field label="Непрозр." value={Math.round(s.opacity * 100)} number min={0} max={100} suffix="%" onChange={v => set({ opacity: Number(v) / 100 })} /><Field label="Отступ" value={s.padding} number min={0} suffix="px" onChange={v => set({ padding: Number(v) })} /></div>
  </section>;
}
export function StrokePanel({ node }: { node: UINode }) {
  const s = node.styles; const set = (values: Record<string, unknown>) => useEditor.getState().updateNode(node.id, {}, 'styles', values);
  return <section className="inspector-section"><h3>Обводка <span>Stroke</span></h3><ColorField label="Цвет рамки" value={s.borderColor} onChange={v => set({ borderColor: v })} /><div className="field-grid"><Field label="Толщина" value={s.borderWidth} number min={0} suffix="px" onChange={v => set({ borderWidth: Number(v) })} /><select className="property-select" aria-label="Стиль обводки" value={s.borderStyle} onChange={e => set({ borderStyle: e.target.value })}><option value="solid">Сплошная</option><option value="dashed">Штрихи</option><option value="dotted">Точки</option></select></div></section>;
}
export function EffectsPanel({ node }: { node: UINode }) {
  const s = node.styles; const set = (values: Record<string, unknown>) => useEditor.getState().updateNode(node.id, {}, 'styles', values);
  function add(kind = 'soft') {
    if (s.shadows.length >= 8) return;
    const shadow: Shadow = { id: uid(), x: 0, y: kind === 'glow' || kind === 'inner' ? 0 : 12, blur: kind === 'inner' ? 16 : 32, spread: 0, color: kind === 'glow' ? '#a18af2' : '#000000', opacity: kind === 'glow' ? 0.5 : 0.25, inset: kind === 'inner' };
    set({ shadows: [...s.shadows, shadow] });
  }
  const updateShadow = (id: string, values: Partial<Shadow>) => set({ shadows: s.shadows.map(shadow => shadow.id === id ? { ...shadow, ...values } : shadow) });
  return <section className="inspector-section effects-section"><h3>Эффекты <button aria-label="Добавить тень" disabled={s.shadows.length >= 8} onClick={() => add()}><Plus size={14} /></button></h3>
    <div className="effect-presets"><button disabled={s.shadows.length >= 8} onClick={() => add('soft')}>Мягкая тень</button><button disabled={s.shadows.length >= 8} onClick={() => add('glow')}>Свечение</button><button disabled={s.shadows.length >= 8} onClick={() => add('inner')}>Внутренняя</button></div>
    {s.shadows.map((shadow, index) => <div key={shadow.id} className="shadow-card"><div className="shadow-card-title"><span>Тень {index + 1}</span><label><input type="checkbox" checked={shadow.inset} onChange={e => updateShadow(shadow.id, { inset: e.target.checked })} />Внутри</label><button aria-label={`Удалить тень ${index + 1}`} onClick={() => set({ shadows: s.shadows.filter(v => v.id !== shadow.id) })}><Trash2 size={12} /></button></div><div className="field-grid"><Field label="X" ariaLabel={`X тени ${index + 1}`} value={shadow.x} number min={-1000} max={1000} onChange={v => updateShadow(shadow.id, { x: Number(v) })} /><Field label="Y" ariaLabel={`Y тени ${index + 1}`} value={shadow.y} number min={-1000} max={1000} onChange={v => updateShadow(shadow.id, { y: Number(v) })} /><Field label="Blur" ariaLabel={`Размытие тени ${index + 1}`} value={shadow.blur} number min={0} max={1000} onChange={v => updateShadow(shadow.id, { blur: Number(v) })} /><Field label="Spread" ariaLabel={`Расширение тени ${index + 1}`} value={shadow.spread} number min={-1000} max={1000} onChange={v => updateShadow(shadow.id, { spread: Number(v) })} /></div><div className="mt-2"><ColorField label={`Цвет тени ${index + 1}`} value={shadow.color} onChange={v => updateShadow(shadow.id, { color: v })} /><Field label="Прозрачн." ariaLabel={`Непрозрачность тени ${index + 1}`} value={Math.round(shadow.opacity * 100)} number min={0} max={100} suffix="%" onChange={v => updateShadow(shadow.id, { opacity: Number(v) / 100 })} /></div></div>)}
    <div className="field-grid mt-3"><Field label="Blur" ariaLabel="Размытие элемента" value={s.blur} number min={0} max={100} suffix="px" onChange={v => set({ blur: Number(v) })} /><Field label="Фон blur" ariaLabel="Размытие фона" value={s.backdropBlur} number min={0} max={100} suffix="px" onChange={v => set({ backdropBlur: Number(v) })} /></div><div className="select-property"><label>Наложение</label><select aria-label="Режим наложения" value={s.blendMode} onChange={e => set({ blendMode: e.target.value })}><option value="normal">Обычное</option><option value="multiply">Умножение · Multiply</option><option value="screen">Экран · Screen</option><option value="overlay">Перекрытие · Overlay</option><option value="darken">Затемнение · Darken</option><option value="lighten">Осветление · Lighten</option></select></div>
  </section>;
}
export function IconPanel({ node }: { node: UINode }) {
  const [picker, setPicker] = useState(false); const glyph = findLibraryIcon(node.properties.iconName); const Glyph = glyph?.Component ?? Sparkles;
  const set = (values: Record<string, unknown>) => useEditor.getState().updateNode(node.id, {}, 'properties', values);
  return <section className="inspector-section"><h3>Иконка <span>Lucide</span></h3><button className="replace-icon-button" onClick={() => setPicker(true)}><span style={{ color: node.styles.color }}><Glyph size={26} strokeWidth={node.properties.iconStrokeWidth} /></span><div><strong>{glyph?.label}</strong><small>Выбрать другую иконку →</small></div></button><ColorField label="Цвет иконки" value={node.styles.color} onChange={v => useEditor.getState().updateNode(node.id, {}, 'styles', { color: v })} /><Field label="Линии" ariaLabel="Толщина линий иконки" value={node.properties.iconStrokeWidth} number min={0.5} max={4} step={0.25} onChange={v => set({ iconStrokeWidth: Number(v) })} /><div className="field-grid mt-2"><button className={`soft-button ${node.properties.iconFlipX ? 'active' : ''}`} aria-label="Отразить иконку горизонтально" aria-pressed={node.properties.iconFlipX} onClick={() => set({ iconFlipX: !node.properties.iconFlipX })}><ArrowLeftRight size={13} />По X</button><button className={`soft-button ${node.properties.iconFlipY ? 'active' : ''}`} aria-label="Отразить иконку вертикально" aria-pressed={node.properties.iconFlipY} onClick={() => set({ iconFlipY: !node.properties.iconFlipY })}><ArrowDownUp size={13} />По Y</button></div>{picker && <IconPicker targetId={node.id} onClose={() => setPicker(false)} />}</section>;
}
