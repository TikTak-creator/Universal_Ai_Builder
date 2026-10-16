import { useEffect, useRef } from 'react';
import { Link, Unlink } from 'lucide-react';
import type { Corners, UINode } from '../model/types';
import { cornerCSS, uniformCorners } from '../model/customization';
import { useEditor } from '../store/editor';
import { Field } from './Fields';

const corners = [
  { key: 'topLeft', label: 'Верхний левый угол', short: '↖', signX: 1, signY: 1 },
  { key: 'topRight', label: 'Верхний правый угол', short: '↗', signX: -1, signY: 1 },
  { key: 'bottomLeft', label: 'Нижний левый угол', short: '↙', signX: 1, signY: -1 },
  { key: 'bottomRight', label: 'Нижний правый угол', short: '↘', signX: -1, signY: -1 },
] as const;
export function CornerEditor({ node }: { node: UINode }) {
  const s = node.styles; const values = s.cornerRadii ?? uniformCorners(s.borderRadius); const linked = s.cornerRadii === null;
  const drag = useRef<{ x: number; y: number; value: number; key: keyof Corners; linked: boolean; values: Corners; signX: number; signY: number } | null>(null);
  const update = (key: keyof Corners, value: number) => useEditor.getState().updateNode(node.id, {}, 'styles', linked ? { borderRadius: value } : { cornerRadii: { ...values, [key]: value } });
  useEffect(() => {
    const cancel = (e: KeyboardEvent) => { if (e.key === 'Escape' && drag.current) { useEditor.getState().cancelGesture(); drag.current = null; } };
    window.addEventListener('keydown', cancel);
    return () => { window.removeEventListener('keydown', cancel); if (drag.current) useEditor.getState().cancelGesture(); };
  }, []);
  const scaled = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Math.min(32, value * 0.6)])) as Corners;
  return <section className="inspector-section corner-section"><h3>Углы <button className={`corner-link ${linked ? 'active' : ''}`} aria-label={linked ? 'Развязать углы' : 'Связать углы'} aria-pressed={linked} onClick={() => useEditor.getState().updateNode(node.id, {}, 'styles', linked ? { cornerRadii: uniformCorners(s.borderRadius) } : { borderRadius: values.topLeft, cornerRadii: null })}>{linked ? <Link size={13} /> : <Unlink size={13} />}<span>{linked ? 'Связаны' : 'Независимые'}</span></button></h3>
    <div className="corner-visual"><div className="corner-sample" style={{ borderRadius: cornerCSS({ borderRadius: s.borderRadius * 0.6, cornerRadii: scaled }) }}><span>{linked ? <Link size={15} /> : <Unlink size={15} />}</span></div>
      {corners.map(corner => <button key={corner.key} className={`corner-drag corner-${corner.key}`} aria-label={`Потянуть: ${corner.label}`} title={`${corner.label}: потяните внутрь или наружу`} onPointerDown={e => {
        if (e.button !== 0) return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); useEditor.getState().beginGesture();
        drag.current = { x: e.clientX, y: e.clientY, value: values[corner.key], key: corner.key, linked, values, signX: corner.signX, signY: corner.signY };
      }} onPointerMove={e => {
        const d = drag.current; if (!d) return;
        const value = Math.max(0, Math.min(10000, Math.round(d.value + ((e.clientX - d.x) * d.signX + (e.clientY - d.y) * d.signY) / 2)));
        useEditor.getState().updateNode(node.id, {}, 'styles', d.linked ? { borderRadius: value } : { cornerRadii: { ...d.values, [d.key]: value } });
      }} onPointerUp={e => { if (!drag.current) return; drag.current = null; useEditor.getState().endGesture(); e.currentTarget.releasePointerCapture(e.pointerId); }} onPointerCancel={() => { if (drag.current) useEditor.getState().cancelGesture(); drag.current = null; }} onLostPointerCapture={() => { if (drag.current) useEditor.getState().endGesture(); drag.current = null; }}>{corner.short}</button>)}
    </div>
    <div className="field-grid">{corners.map(c => <Field key={c.key} label={c.short} ariaLabel={c.label} value={values[c.key]} number min={0} max={10000} suffix="px" onChange={v => update(c.key, Number(v))} />)}</div><p className="property-hint">Потяните маркеры или задайте каждый угол числом.</p>
  </section>;
}
