import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
export function Modal({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null); const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const el = ref.current!; (el.querySelector<HTMLElement>('input:not([type="file"]),textarea,select') ?? el.querySelector<HTMLElement>('button'))?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopImmediatePropagation(); closeRef.current(); }
      if (e.key === 'Tab') {
        const items = [...el.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled):not([type="file"]):not([type="hidden"]), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]')].filter(item => item.getClientRects().length > 0);
        if (!items.length) return;
        if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items.at(-1)!.focus(); }
        else if (!e.shiftKey && document.activeElement === items.at(-1)) { e.preventDefault(); items[0].focus(); }
      }
    };
    window.addEventListener('keydown', key, true); return () => { window.removeEventListener('keydown', key, true); previous?.focus(); };
  }, []);
  return createPortal(<div className="modal-backdrop" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}><div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={`modal ${wide ? 'modal-wide' : ''}`}><header><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" aria-label="Закрыть окно" onClick={onClose}><X size={18} /></button></header>{children}</div></div>, document.body);
}
