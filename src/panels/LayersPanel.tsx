import { useState } from 'react';
import { DndContext, PointerSensor, closestCenter, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, Eye, EyeOff, File, GripVertical, Layers, LockKeyhole, Plus, Search, Shapes, UnlockKeyhole } from 'lucide-react';
import { useEditor } from '../store/editor';
import { definition, isContainer, registry } from '../registry/components';
import { Icon } from '../components/Icon';
import type { UINode } from '../model/types';
import { IconPicker } from '../components/IconPicker';

function NestTarget({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `inside:${id}` });
  return <div ref={setNodeRef} className={`nest-target ${isOver ? 'is-over' : ''}`}>Вложить в контейнер</div>;
}
function LayerRow({ node, depth, collapsed, toggle, dragging }: { node: UINode; depth: number; collapsed: boolean; toggle: () => void; dragging: string | null }) {
  const selected = useEditor(s => s.selection.includes(node.id));
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
  const update = useEditor(s => s.updateNode);
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : node.hidden ? 0.45 : 1 }}>
    <div className={`layer-row ${selected ? 'selected' : ''}`} style={{ paddingLeft: 7 + depth * 15 }} onClick={e => useEditor.getState().select([node.id], e.shiftKey)}>
      <button className="layer-grip" aria-label={`Перетащить ${node.name}`} {...attributes} {...listeners}><GripVertical size={12} /></button>
      <button className="layer-expand" aria-label={collapsed ? 'Развернуть слой' : 'Свернуть слой'} onClick={e => { e.stopPropagation(); toggle(); }}>{node.children.length ? collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} /> : null}</button>
      <span className="layer-type"><Icon name={definition(node.type).icon} size={14} /></span>
      <span className="layer-name" title={node.name}>{node.name}</span>
      <button className={`layer-action ${node.hidden ? 'pinned' : ''}`} aria-label={node.hidden ? `Показать ${node.name}` : `Скрыть ${node.name}`} onClick={e => { e.stopPropagation(); update(node.id, { hidden: !node.hidden }); }}>{node.hidden ? <EyeOff size={12} /> : <Eye size={12} />}</button>
      <button className={`layer-action ${node.locked ? 'pinned' : ''}`} aria-label={node.locked ? `Разблокировать ${node.name}` : `Заблокировать ${node.name}`} onClick={e => { e.stopPropagation(); update(node.id, { locked: !node.locked }); }}>{node.locked ? <LockKeyhole size={12} /> : <UnlockKeyhole size={12} />}</button>
    </div>
    {dragging && dragging !== node.id && isContainer(node) && <NestTarget id={node.id} />}
  </div>;
}
export function LayersPanel() {
  const project = useEditor(s => s.project); const tab = useEditor(s => s.leftTab);
  const [search, setSearch] = useState(''); const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState<string | null>(null);
  const [iconPicker, setIconPicker] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const rows: { node: UINode; depth: number }[] = [];
  function flatten(id: string, depth: number) {
    const n = project.nodes[id];
    if (!search || n.name.toLowerCase().includes(search.toLowerCase()) || n.type.includes(search.toLowerCase())) rows.push({ node: n, depth });
    if (!collapsed.has(id) || search) n.children.forEach(child => flatten(child, depth + 1));
  }
  project.rootIds.forEach(id => flatten(id, 0));
  function onDragEnd(e: DragEndEvent) {
    setDragging(null); if (!e.over || e.active.id === e.over.id) return;
    const id = String(e.active.id), target = String(e.over.id);
    if (target.startsWith('inside:')) { useEditor.getState().reparent(id, target.slice(7)); return; }
    const over = project.nodes[target]; if (!over) return;
    const siblings = over.parentId ? project.nodes[over.parentId].children : project.rootIds;
    useEditor.getState().reparent(id, over.parentId, siblings.indexOf(target));
  }
  const library = registry.filter(d => `${d.label} ${d.type}`.toLowerCase().includes(search.toLowerCase()));
  return <aside className="left-panel panel" aria-label="Слои и компоненты">
    <div className="panel-tabs"><button className={tab === 'layers' ? 'active' : ''} onClick={() => { useEditor.setState({ leftTab: 'layers' }); setSearch(''); }}><Layers size={14} />Слои</button><button className={tab === 'library' ? 'active' : ''} onClick={() => { useEditor.setState({ leftTab: 'library' }); setSearch(''); }}><Shapes size={14} />Элементы</button></div>
    <div className="search-box"><Search size={14} /><input aria-label="Поиск компонентов" placeholder={tab === 'layers' ? 'Найти слой…' : 'Найти элемент…'} value={search} onChange={e => setSearch(e.target.value)} /><kbd>⌕</kbd></div>
    {tab === 'layers' ? <>
      <div className="section-heading"><span>СТРАНИЦА</span><span className="tiny-tag">01</span></div>
      <div className="page-item"><File size={14} /><span>Главная страница</span><span className="green-dot" /></div>
      <div className="section-heading mt-5"><span>СЛОИ</span><button aria-label="Добавить фрейм" onClick={() => useEditor.getState().add('frame')}><Plus size={14} /></button></div>
      <div className="layers-scroll">
        {!rows.length && <div className="empty-state"><Layers size={28} /><strong>{search ? 'Ничего не найдено' : 'Чистый холст'}</strong><p>{search ? 'Попробуйте другое название.' : 'Добавьте первый элемент\nиз библиотеки.'}</p>{!search && <button className="soft-button" onClick={() => useEditor.setState({ leftTab: 'library' })}>Открыть элементы</button>}</div>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={e => setDragging(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
          <SortableContext items={rows.map(r => r.node.id)} strategy={verticalListSortingStrategy}>{rows.map(({ node, depth }) => <LayerRow key={node.id} node={node} depth={depth} collapsed={collapsed.has(node.id)} toggle={() => setCollapsed(s => { const next = new Set(s); if (next.has(node.id)) next.delete(node.id); else next.add(node.id); return next; })} dragging={dragging} />)}</SortableContext>
        </DndContext>
      </div>
    </> : <div className="library-scroll">{['Структура', 'Базовые', 'Формы', 'Данные'].map(category => {
      const items = library.filter(d => d.category === category); if (!items.length) return null;
      return <section key={category}><div className="section-heading"><span>{category.toUpperCase()}</span><span>{items.length}</span></div><div className="library-grid">{items.map(d => <button key={d.type} className={`library-item ${d.type === 'icon' ? 'library-icon-feature' : ''}`} draggable onDragStart={e => { e.dataTransfer.setData('application/forma-component', d.type); e.dataTransfer.effectAllowed = 'copy'; }} onClick={() => d.type === 'icon' ? setIconPicker(true) : useEditor.getState().add(d.type)} title={d.type === 'icon' ? '120 бесплатных иконок Lucide' : 'Нажмите для добавления или перетащите на холст'} aria-label={`Добавить: ${d.label}`}><div className="library-icon"><Icon name={d.icon} size={23} /></div><span>{d.label}{d.type === 'icon' && <small>120</small>}</span></button>)}</div></section>;
    })}{!library.length && <div className="empty-state">Ничего не найдено</div>}<p className="library-hint">Нажмите на элемент или перетащите его на холст. Выбранный фрейм станет родителем.</p></div>}
    <div className="panel-bottom"><span><span className="green-dot" /> Локальный проект</span><span>{Object.keys(project.nodes).length} слоёв</span></div>
    {iconPicker && <IconPicker onClose={() => setIconPicker(false)} />}
  </aside>;
}
