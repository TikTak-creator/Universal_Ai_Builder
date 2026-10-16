import { useEffect, useRef } from 'react';
import { Copy, CopyPlus, Group, Layers, Scissors, Trash2, Ungroup } from 'lucide-react';
import { useEditor } from '../store/editor';
export function ContextMenu({ x, y, onClose }: { x: number; y: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null); const s = useEditor();
  useEffect(() => {
    const close = (e: Event) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('pointerdown', close); window.addEventListener('keydown', key);
    return () => { window.removeEventListener('pointerdown', close); window.removeEventListener('keydown', key); };
  }, [onClose]);
  const run = (action: () => void) => { action(); onClose(); };
  const has = !!s.selection.length;
  return <div ref={ref} className="context-menu" style={{ left: Math.min(x, window.innerWidth - 245), top: Math.min(y, window.innerHeight - 355) }} onPointerDown={e => e.stopPropagation()}>
    <button disabled={!has} onClick={() => run(s.copy)}><Copy size={14} />Копировать<kbd>Ctrl C</kbd></button>
    <button disabled={!has} onClick={() => run(() => { s.copy(); s.remove(); })}><Scissors size={14} />Вырезать<kbd>Ctrl X</kbd></button>
    <button disabled={!s.clipboard} onClick={() => run(s.paste)}><CopyPlus size={14} />Вставить<kbd>Ctrl V</kbd></button>
    <button disabled={!has} onClick={() => run(s.duplicate)}><CopyPlus size={14} />Дублировать<kbd>Ctrl D</kbd></button>
    <hr /><button disabled={s.selection.length < 2} onClick={() => run(s.group)}><Group size={14} />Сгруппировать<kbd>Ctrl G</kbd></button>
    <button disabled={!has} onClick={() => run(s.ungroup)}><Ungroup size={14} />Разгруппировать</button>
    <button disabled={!has} onClick={() => run(() => s.selection.forEach(id => s.reorder(id, 99999)))}><Layers size={14} />На передний план</button>
    <hr /><button disabled={!has} className="danger" onClick={() => run(s.remove)}><Trash2 size={14} />Удалить<kbd>Del</kbd></button>
  </div>;
}
