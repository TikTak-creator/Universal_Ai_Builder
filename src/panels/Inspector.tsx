import { useRef } from 'react';
import { AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignStartHorizontal, AlignStartVertical, ArrowDownUp, ArrowLeftRight, ChevronDown, ImagePlus, LockKeyhole, MousePointer2, Settings2, Trash2, Type } from 'lucide-react';
import type { Alignment } from '../model/types';
import { useEditor } from '../store/editor';
import { isContainer, definition, registry } from '../registry/components';
import { isUnavailable } from '../engine/geometry';
import { Field, ColorField } from './Fields';
import { Icon } from '../components/Icon';
import { CornerEditor } from './CornerEditor';
import { FillPanel, StrokePanel, EffectsPanel, IconPanel } from './AppearancePanels';
import { TypographyPanel } from './TypographyPanel';

const alignments = [
  ['left', AlignStartVertical, 'По левому краю'], ['center', AlignCenterVertical, 'По центру горизонтально'], ['right', AlignEndVertical, 'По правому краю'],
  ['top', AlignStartHorizontal, 'По верхнему краю'], ['middle', AlignCenterHorizontal, 'По центру вертикально'], ['bottom', AlignEndHorizontal, 'По нижнему краю'],
] as const;
export function Inspector({ onOpenFonts }: { onOpenFonts: () => void }) {
  const project = useEditor(s => s.project); const selection = useEditor(s => s.selection);
  const update = useEditor(s => s.updateNode); const inputRef = useRef<HTMLInputElement>(null);
  const n = selection.length === 1 ? project.nodes[selection[0]] : undefined;
  const geometry = (key: string, v: string) => n && update(n.id, {}, 'geometry', { [key]: Number(v) });
  const style = (key: string, v: string | number) => n && update(n.id, {}, 'styles', { [key]: v });
  const property = (key: string, v: unknown) => n && update(n.id, {}, 'properties', { [key]: v });
  function parentOptions() {
    return Object.values(project.nodes).filter(candidate => {
      if (!n || !isContainer(candidate) || candidate.id === n.id) return false;
      let parent: string | null = candidate.parentId; while (parent) { if (parent === n.id) return false; parent = project.nodes[parent].parentId; } return true;
    });
  }
  return <aside className="inspector panel" aria-label="Инспектор свойств"><div className="inspector-title"><Settings2 size={14} /><span>Свойства</span><span className="tiny-tag">{selection.length ? selection.length : 'Холст'}</span></div>
    <div className="inspector-scroll">
      {selection.length > 0 && <div className="alignment-toolbar">{alignments.map(([key, Component, title]) => <button key={key} title={title} aria-label={title} onClick={() => useEditor.getState().align(key as Alignment)}><Component size={16} /></button>)}<span /><button title="Распределить по горизонтали" aria-label="Распределить по горизонтали" disabled={selection.length < 3} onClick={() => useEditor.getState().distribute('x')}><ArrowLeftRight size={15} /></button><button title="Распределить по вертикали" aria-label="Распределить по вертикали" disabled={selection.length < 3} onClick={() => useEditor.getState().distribute('y')}><ArrowDownUp size={15} /></button></div>}
      {!selection.length && <>
        <section className="inspector-section"><h3>Холст <span>Desktop</span></h3><div className="field-grid"><Field label="Ширина холста" value={project.canvas.width} number min={100} max={10000} suffix="W" onChange={v => useEditor.getState().mutate(p => { p.canvas.width = Number(v); })} /><Field label="Высота холста" value={project.canvas.height} number min={100} max={10000} suffix="H" onChange={v => useEditor.getState().mutate(p => { p.canvas.height = Number(v); })} /></div><ColorField label="Фон холста" value={project.canvas.background} onChange={v => useEditor.getState().mutate(p => { p.canvas.background = v; })} /></section>
        <div className="inspector-welcome"><div className="welcome-pointer"><MousePointer2 size={26} /></div><h3>От идеи к интерфейсу</h3><p>Выберите элемент на холсте, чтобы настроить его свойства.</p><div className="shortcut-line"><kbd>Shift + клик</kbd><span>Мультивыбор</span></div><div className="shortcut-line"><kbd>Ctrl + D</kbd><span>Дубликат</span></div><div className="shortcut-line"><kbd>Ctrl + G</kbd><span>Группа</span></div></div>
        <div className="phase-card"><span className="tiny-tag purple">VISUAL TOOLKIT</span><strong>У каждой идеи свой характер</strong><p>{registry.length} элементов · 120 иконок · ваши шрифты</p><button className="soft-button w-full mt-3" onClick={onOpenFonts}><Type size={13} />Шрифты проекта</button></div>
      </>}
      {selection.length > 1 && <section className="inspector-section"><h3>Выбрано элементов: {selection.length}</h3><p className="muted text-xs leading-6">Перемещайте элементы вместе. Используйте панель сверху для выравнивания и распределения.</p><button className="soft-button w-full mt-3" onClick={() => useEditor.getState().group()}>Сгруппировать <kbd>Ctrl G</kbd></button></section>}
      {n && <>
        <section className="inspector-section node-header"><div className="node-type-badge"><Icon name={definition(n.type).icon} size={17} /></div><div><span>{definition(n.type).label}</span><input aria-label="Имя элемента" value={n.name} disabled={n.locked} onFocus={() => useEditor.getState().beginGesture()} onBlur={() => useEditor.getState().endGesture()} onChange={e => update(n.id, { name: e.target.value })} /></div><button aria-label="Удалить выбранный элемент" disabled={isUnavailable(project, n.id)} onClick={() => useEditor.getState().remove()}><Trash2 size={14} /></button></section>
        {isUnavailable(project, n.id) && <div className="locked-note"><LockKeyhole size={13} />Элемент скрыт или заблокирован. Настройте его в слоях.</div>}
        <fieldset disabled={isUnavailable(project, n.id)}>
          <section className="inspector-section"><h3>Положение <ChevronDown size={12} /></h3><div className="field-grid"><Field label="X" value={n.geometry.x} number onChange={v => geometry('x', v)} /><Field label="Y" value={n.geometry.y} number onChange={v => geometry('y', v)} /><Field label="W" value={n.geometry.width} number min={1} suffix="px" onChange={v => geometry('width', v)} /><Field label="H" value={n.geometry.height} number min={1} suffix="px" onChange={v => geometry('height', v)} /><Field label="Поворот" value={n.geometry.rotation} number suffix="°" onChange={v => geometry('rotation', v)} /></div>
            <div className="select-property"><label htmlFor="parent-select">Родитель</label><select id="parent-select" value={n.parentId ?? ''} onChange={e => useEditor.getState().reparent(n.id, e.target.value || null)}><option value="">Холст</option>{parentOptions().map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          </section>
          <CornerEditor key={n.id} node={n} />
          {n.type === 'icon' && <IconPanel key={`icon-${n.id}`} node={n} />}
          {['text','button','badge','checkbox'].includes(n.type) && <section className="inspector-section"><h3>Содержимое</h3><textarea id="property-text" aria-label="Текст элемента" className="property-textarea" value={n.properties.text} onFocus={() => useEditor.getState().beginGesture()} onBlur={() => useEditor.getState().endGesture()} onChange={e => property('text', e.target.value)} /></section>}
          {['text','button','badge','input','textarea','checkbox','select'].includes(n.type) && <TypographyPanel node={n} onOpenFonts={onOpenFonts} />}
          <FillPanel node={n} /><StrokePanel node={n} /><EffectsPanel node={n} />
          {isContainer(n) && <section className="inspector-section"><h3>Контейнер</h3><div className="select-property"><label>Переполнение</label><select aria-label="Переполнение" value={n.styles.overflow} onChange={e => style('overflow', e.target.value)}><option value="visible">Показывать</option><option value="hidden">Обрезать</option><option value="auto">Прокрутка</option></select></div><small className="muted">Free Design · абсолютные координаты</small></section>}
          {['input','textarea'].includes(n.type) && <section className="inspector-section"><h3>Поле ввода</h3><Field label="Подсказка" value={n.properties.placeholder} onChange={v => property('placeholder', v)} /></section>}
          {n.type === 'checkbox' && <section className="inspector-section"><label className="checkbox-setting"><input type="checkbox" checked={n.properties.checked} onChange={e => property('checked', e.target.checked)} />Отмечен по умолчанию</label></section>}
          {n.type === 'select' && <section className="inspector-section"><h3>Варианты, по одному в строке</h3><textarea className="property-textarea" aria-label="Варианты списка" value={n.properties.options.join('\n')} onFocus={() => useEditor.getState().beginGesture()} onBlur={() => useEditor.getState().endGesture()} onChange={e => property('options', e.target.value.split('\n'))} /></section>}
          {n.type === 'image' && <section className="inspector-section"><h3>Изображение</h3><button className="soft-button w-full" onClick={() => inputRef.current?.click()}><ImagePlus size={14} />Загрузить изображение</button><input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml" onChange={e => {
            const file = e.target.files?.[0]; if (!file) return; if (file.size > 8_000_000) return useEditor.getState().notify('Максимальный размер — 8 МБ.');
            const id = n.id; const reader = new FileReader(); reader.onload = () => update(id, {}, 'properties', { src: String(reader.result), alt: file.name }); reader.onerror = () => useEditor.getState().notify('Не удалось прочитать изображение.'); reader.readAsDataURL(file); e.target.value = '';
          }} /><div className="mt-2"><Field label="URL" value={n.properties.src.startsWith('data:') ? '[Встроенное изображение]' : n.properties.src} onChange={v => property('src', v)} /><Field label="Alt" value={n.properties.alt} onChange={v => property('alt', v)} /></div><div className="select-property"><label>Заполнение изображения</label><select aria-label="Заполнение изображения" value={n.styles.objectFit} onChange={e => style('objectFit', e.target.value)}><option value="cover">Заполнить · Cover</option><option value="contain">Вместить · Contain</option><option value="fill">Растянуть · Fill</option><option value="scale-down">Уменьшить при необходимости</option></select></div></section>}
        </fieldset>
        <section className="inspector-section"><h3>Порядок слоя</h3><div className="field-grid"><button className="soft-button" onClick={() => useEditor.getState().reorder(n.id, -1)}>На слой ниже</button><button className="soft-button" onClick={() => useEditor.getState().reorder(n.id, 1)}>На слой выше</button></div><p className="node-id">ID {n.id.slice(0, 8)}</p></section>
      </>}
    </div>
    <div className="panel-bottom"><span>Free Design</span><span className="mono">PX</span></div>
  </aside>;
}
