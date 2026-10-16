import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Crosshair, Hand, Maximize, Minus, MousePointer2, Plus } from 'lucide-react';
import { useEditor } from '../store/editor';
import { clone, uid } from '../model/types';
import type { ComponentType, Geometry, Rect } from '../model/types';
import { bounds, intersects, isHidden, isUnavailable, resizeGeometry, rotateVector, snapMove, topLevelSelection, worldRect, worldToLocal, worldTransform } from '../engine/geometry';
import { NodeRenderer } from '../renderer/NodeRenderer';
import { registry } from '../registry/components';
import { ContextMenu } from '../components/ContextMenu';

const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
type Guide = { axis: 'x' | 'y'; position: number };
export function Canvas() {
  const project = useEditor(s => s.project); const selection = useEditor(s => s.selection);
  const zoom = useEditor(s => s.zoom); const pan = useEditor(s => s.pan);
  const grid = useEditor(s => s.grid); const rulers = useEditor(s => s.rulers); const tool = useEditor(s => s.tool);
  const ready = useEditor(s => s.ready);
  const ref = useRef<HTMLDivElement>(null); const cleanup = useRef<(() => void) | null>(null);
  const [marquee, setMarquee] = useState<Rect | null>(null); const [smartGuides, setSmartGuides] = useState<Guide[]>([]);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    if (!ready || !ref.current) return;
    const observer = new ResizeObserver(entries => { const r = entries[0].contentRect; useEditor.getState().fit(r.width, r.height); });
    observer.observe(ref.current); return () => observer.disconnect();
  }, [project.id, ready]);
  useEffect(() => () => cleanup.current?.(), []);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault(); const s = useEditor.getState();
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect(); const point = { x: e.clientX - r.left, y: e.clientY - r.top };
        const next = Math.max(0.1, Math.min(8, s.zoom * Math.exp(-e.deltaY * 0.005)));
        useEditor.setState({ zoom: next, pan: { x: point.x - (point.x - s.pan.x) * next / s.zoom, y: point.y - (point.y - s.pan.y) * next / s.zoom } });
      } else useEditor.setState({ pan: { x: s.pan.x - e.deltaX, y: s.pan.y - e.deltaY } });
    };
    el.addEventListener('wheel', wheel, { passive: false }); return () => el.removeEventListener('wheel', wheel);
  }, []);
  const toWorld = (clientX: number, clientY: number) => {
    const r = ref.current!.getBoundingClientRect(); const s = useEditor.getState();
    return { x: (clientX - r.left - s.pan.x) / s.zoom, y: (clientY - r.top - s.pan.y) / s.zoom };
  };
  function track(e: ReactPointerEvent, onMove: (event: PointerEvent) => void, onEnd?: () => void) {
    cleanup.current?.(); let done = false; const pointerId = e.pointerId;
    const move = (event: PointerEvent) => { if (event.pointerId === pointerId) onMove(event); };
    const finish = () => {
      if (done) return; done = true;
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', finish); window.removeEventListener('pointercancel', cancel); window.removeEventListener('blur', cancel); window.removeEventListener('keydown', key);
      useEditor.getState().endGesture(); setSmartGuides([]); setMarquee(null); setDragging(false); onEnd?.(); cleanup.current = null;
    };
    const cancel = () => { useEditor.getState().cancelGesture(); finish(); };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') cancel(); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', finish); window.addEventListener('pointercancel', cancel); window.addEventListener('blur', cancel); window.addEventListener('keydown', key);
    cleanup.current = cancel;
  }
  function startNode(e: ReactPointerEvent, id: string) {
    if (e.button === 2) { e.stopPropagation(); if (!selection.includes(id)) useEditor.getState().select([id]); return; }
    if (tool === 'hand' || e.button === 1) return;
    if (e.button !== 0) return;
    e.stopPropagation(); e.preventDefault(); const s = useEditor.getState();
    if (e.shiftKey) { s.select([id], true); return; }
    const ids = s.selection.includes(id) ? s.selection : [id]; s.select(ids);
    const moving = topLevelSelection(s.project, ids).filter(i => !isUnavailable(s.project, i)); if (!moving.length) return;
    const original = clone(s.project); const start = { x: e.clientX, y: e.clientY }; let began = false;
    track(e, ev => {
      const raw = { x: (ev.clientX - start.x) / s.zoom, y: (ev.clientY - start.y) / s.zoom };
      if (!began && Math.hypot(raw.x, raw.y) * s.zoom < 3) return;
      if (!began) { useEditor.getState().beginGesture(); setDragging(true); began = true; }
      const snapped = snapMove(original, moving, raw, s.snap && !ev.altKey, s.smart && !ev.altKey, s.zoom); setSmartGuides(snapped.guides);
      const values: Record<string, Geometry> = {};
      for (const key of moving) {
        const n = original.nodes[key]; const rotation = n.parentId ? worldTransform(original, n.parentId).rotation : 0;
        const delta = rotateVector(snapped.delta, -rotation);
        values[key] = { ...n.geometry, x: n.geometry.x + delta.x, y: n.geometry.y + delta.y };
      }
      useEditor.getState().applyGeometry(values);
    });
  }
  function startHandle(e: ReactPointerEvent, id: string, handle: string) {
    e.stopPropagation(); e.preventDefault(); const s = useEditor.getState(); if (isUnavailable(s.project, id)) return;
    const n = clone(s.project.nodes[id]); const start = { x: e.clientX, y: e.clientY }; const t = worldTransform(s.project, id);
    const parentRotation = n.parentId ? worldTransform(s.project, n.parentId).rotation : 0;
    const startPoint = toWorld(e.clientX, e.clientY); const angle = Math.atan2(startPoint.y - t.center.y, startPoint.x - t.center.x);
    s.beginGesture();
    track(e, ev => {
      let g: Geometry;
      if (handle === 'rotate') {
        const point = toWorld(ev.clientX, ev.clientY); const a = Math.atan2(point.y - t.center.y, point.x - t.center.x);
        let rotation = n.geometry.rotation + (a - angle) * 180 / Math.PI;
        if (ev.shiftKey) rotation = Math.round(rotation / 15) * 15;
        g = { ...n.geometry, rotation };
      } else {
        const delta = rotateVector({ x: (ev.clientX - start.x) / s.zoom, y: (ev.clientY - start.y) / s.zoom }, -parentRotation);
        g = resizeGeometry(n.geometry, handle, delta.x, delta.y, ev.shiftKey);
      }
      useEditor.getState().applyGeometry({ [id]: g });
    });
  }
  function startBackground(e: ReactPointerEvent) {
    if (e.button === 2 || (e.target as HTMLElement).closest('.canvas-controls,.artboard-label')) return;
    const s = useEditor.getState();
    if (e.button === 1 || s.tool === 'hand') {
      e.preventDefault(); const start = { x: e.clientX, y: e.clientY };
      track(e, ev => useEditor.setState({ pan: { x: s.pan.x + ev.clientX - start.x, y: s.pan.y + ev.clientY - start.y } })); return;
    }
    if (e.button !== 0) return;
    e.preventDefault(); const start = toWorld(e.clientX, e.clientY); const original = e.shiftKey ? s.selection : [];
    s.select(original);
    track(e, ev => {
      const point = toWorld(ev.clientX, ev.clientY); const r = { x: Math.min(start.x, point.x), y: Math.min(start.y, point.y), width: Math.abs(point.x - start.x), height: Math.abs(point.y - start.y) };
      setMarquee(r); const candidates = ev.altKey ? Object.keys(s.project.nodes) : s.project.rootIds;
      s.select([...new Set([...original, ...candidates.filter(id => !isUnavailable(s.project, id) && intersects(r, worldRect(s.project, id)))])]);
    });
  }
  function startGuide(e: ReactPointerEvent, axis: 'x' | 'y', id?: string) {
    e.stopPropagation(); e.preventDefault(); const s = useEditor.getState(); s.beginGesture(); const guideId = id ?? uid();
    if (!id) s.mutate(p => { p.guides.push({ id: guideId, axis, position: toWorld(e.clientX, e.clientY)[axis] }); });
    track(e, ev => { const point = toWorld(ev.clientX, ev.clientY); useEditor.getState().mutate(p => { const g = p.guides.find(v => v.id === guideId); if (g) g.position = point[axis]; }); });
  }
  const visibleSelection = selection.filter(id => project.nodes[id] && !isHidden(project, id));
  const selectionBounds = bounds(visibleSelection.map(id => worldRect(project, id)));
  const width = ref.current?.clientWidth ?? 1000, height = ref.current?.clientHeight ?? 800;
  const step = zoom < 0.35 ? 200 : zoom < 0.8 ? 100 : zoom > 2 ? 20 : 50;
  const ticks = (axis: 'x' | 'y') => {
    const offset = pan[axis]; const length = axis === 'x' ? width : height;
    const first = Math.floor(-offset / zoom / step) * step; const count = Math.ceil(length / zoom / step) + 2;
    return Array.from({ length: Math.min(count, 300) }, (_, i) => {
      const value = first + i * step; const pos = offset + value * zoom;
      return axis === 'x' ? <g key={value}><line x1={pos} y1={16} x2={pos} y2={22} /><text x={pos + 4} y={12}>{value}</text></g> : <g key={value}><line x1={16} y1={pos} x2={22} y2={pos} /><text transform={`translate(12 ${pos + 4}) rotate(-90)`}>{value}</text></g>;
    });
  };
  return <main ref={ref} className={`canvas ${tool === 'hand' ? 'hand-tool' : ''} ${dragging ? 'is-dragging' : ''}`} aria-label="Холст редактора" data-testid="canvas"
    style={{ backgroundImage: grid ? `radial-gradient(#444650 0.8px, transparent 0.8px)` : 'radial-gradient(#33353e 0.7px, transparent 0.7px)', backgroundSize: `${(grid ? 8 : 24) * zoom}px ${(grid ? 8 : 24) * zoom}px`, backgroundPosition: `${pan.x}px ${pan.y}px` }}
    onPointerDown={startBackground} onContextMenu={e => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }); }}
    onDragOver={e => { if (e.dataTransfer.types.includes('application/forma-component')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } }}
    onDrop={e => { e.preventDefault(); const type = e.dataTransfer.getData('application/forma-component') as ComponentType; if (!registry.some(d => d.type === type)) return;
      const point = toWorld(e.clientX, e.clientY); const parentEl = (e.target as HTMLElement).closest('[data-node-id]'); const candidate = parentEl?.getAttribute('data-node-id');
      const parentId = candidate && registry.find(d => d.type === project.nodes[candidate]?.type)?.acceptsChildren ? candidate : null;
      useEditor.getState().add(type, worldToLocal(project, parentId, point), parentId);
    }}>
    <div className="canvas-world" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
      <div className="artboard-label" style={{ top: -30 / zoom, fontSize: 11 / zoom }}><span className="flex items-center gap-2"><span className="artboard-mark">⌗</span> Desktop <span className="muted">/ {project.canvas.width} × {project.canvas.height}</span></span></div>
      <div className="artboard" data-testid="artboard" style={{ width: project.canvas.width, height: project.canvas.height, background: project.canvas.background }}>
        {project.rootIds.map(id => <NodeRenderer key={id} id={id} project={project} onNodePointerDown={startNode} onNodeDoubleClick={id => { const n = project.nodes[id]; if (n.type === 'text' || n.type === 'button' || n.type === 'badge') { useEditor.getState().select([id]); document.getElementById('property-text')?.focus(); } }} />)}
      </div>
      {visibleSelection.map(id => {
        const n = project.nodes[id], t = worldTransform(project, id); const locked = isUnavailable(project, id);
        return <div key={id} className={`selection-box ${locked ? 'selection-locked' : ''}`} style={{ left: t.center.x - n.geometry.width / 2, top: t.center.y - n.geometry.height / 2, width: n.geometry.width, height: n.geometry.height, transform: `rotate(${t.rotation}deg)`, borderWidth: 1 / zoom }}>
          {visibleSelection.length === 1 && !locked && <>
            {handles.map(handle => <button key={handle} className={`resize-handle h-${handle}`} aria-label={`Изменить размер ${handle}`} data-testid={`handle-${handle}`} style={{ width: 7 / zoom, height: 7 / zoom, borderWidth: 1 / zoom }} onPointerDown={e => startHandle(e, id, handle)} />)}
            <div className="rotate-stem" style={{ height: 24 / zoom, top: -24 / zoom }} /><button className="rotate-handle" aria-label="Повернуть элемент" style={{ width: 8 / zoom, height: 8 / zoom, top: -28 / zoom }} onPointerDown={e => startHandle(e, id, 'rotate')} />
          </>}
        </div>;
      })}
      {!!visibleSelection.length && <span className="dimension-label" style={{ left: selectionBounds.x + selectionBounds.width / 2, top: selectionBounds.y + selectionBounds.height + 12 / zoom, fontSize: 10 / zoom, padding: `${3 / zoom}px ${7 / zoom}px`, borderRadius: 4 / zoom }}>{Math.round(selectionBounds.width)} × {Math.round(selectionBounds.height)}</span>}
      {marquee && <div className="marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.width, height: marquee.height, borderWidth: 1 / zoom }} />}
    </div>
    {project.guides.map(g => <div key={g.id} className={`user-guide guide-${g.axis}`} style={g.axis === 'x' ? { left: pan.x + g.position * zoom } : { top: pan.y + g.position * zoom }} onPointerDown={e => startGuide(e, g.axis, g.id)} onDoubleClick={e => { e.stopPropagation(); useEditor.getState().mutate(p => { p.guides = p.guides.filter(v => v.id !== g.id); }); }} title="Перетащить · двойной щелчок — удалить" />)}
    {smartGuides.map((g, i) => <div key={i} className={`smart-guide guide-${g.axis}`} style={g.axis === 'x' ? { left: pan.x + g.position * zoom } : { top: pan.y + g.position * zoom }} />)}
    {rulers && <><svg className="ruler ruler-top" onPointerDown={e => startGuide(e, 'y')}>{ticks('x')}</svg><svg className="ruler ruler-left" onPointerDown={e => startGuide(e, 'x')}>{ticks('y')}</svg><div className="ruler-corner"><Crosshair size={11} /></div></>}
    <div className="canvas-controls" onPointerDown={e => e.stopPropagation()}>
      <button aria-label="Выделение (V)" className={tool === 'select' ? 'active' : ''} onClick={() => useEditor.setState({ tool: 'select' })}><MousePointer2 size={16} /></button>
      <button aria-label="Рука (H)" className={tool === 'hand' ? 'active' : ''} onClick={() => useEditor.setState({ tool: 'hand' })}><Hand size={16} /></button>
      <span className="control-separator" />
      <button aria-label="Уменьшить" onClick={() => useEditor.getState().setZoom(zoom / 1.2)}><Minus size={14} /></button>
      <select aria-label="Масштаб холста" value={Math.round(zoom * 100)} onChange={e => useEditor.getState().setZoom(Number(e.target.value) / 100)}>{[...new Set([10, 25, 50, 75, 100, 150, 200, 400, 800, Math.round(zoom * 100)])].sort((a,b) => a-b).map(z => <option key={z} value={z}>{z}%</option>)}</select>
      <button aria-label="Увеличить" onClick={() => useEditor.getState().setZoom(zoom * 1.2)}><Plus size={14} /></button>
      <span className="control-separator" />
      <button aria-label="Вместить холст (Shift+1)" onClick={() => { const r = ref.current!.getBoundingClientRect(); useEditor.getState().fit(r.width, r.height); }}><Maximize size={15} /></button>
    </div>
    <div className="canvas-help">{tool === 'hand' ? 'Перетаскивайте холст для перемещения' : 'Space — рука  ·  Ctrl + колесо — масштаб'}</div>
    {menu && createPortal(<ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)} />, document.body)}
  </main>;
}
