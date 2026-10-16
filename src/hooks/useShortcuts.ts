import { useEffect } from 'react';
import { useEditor } from '../store/editor';
import { isUnavailable } from '../engine/geometry';
export function useShortcuts(command: (name: string) => void) {
  useEffect(() => {
    let spaceTool: 'select' | 'hand' | null = null;
    const up = (e: KeyboardEvent) => { if (e.code === 'Space' && spaceTool) { useEditor.setState({ tool: spaceTool }); spaceTool = null; } };
    const blur = () => { if (spaceTool) { useEditor.setState({ tool: spaceTool }); spaceTool = null; } };
    const key = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]') || useEditor.getState().preview) return;
      const input = e.target as HTMLElement; const typing = input.closest('input,textarea,select,[contenteditable="true"]');
      const ctrl = e.ctrlKey || e.metaKey; const k = e.code.startsWith('Key') ? e.code.slice(3).toLowerCase() : e.key.toLowerCase();
      if (ctrl && k === 's') { e.preventDefault(); command(e.shiftKey ? 'saveAs' : 'save'); return; }
      if (typing) return;
      const s = useEditor.getState();
      if (ctrl && ['z','y','c','x','v','d','g','a','o','n','e'].includes(k)) {
        e.preventDefault();
        if (k === 'z') e.shiftKey ? s.redo() : s.undo();
        if (k === 'y') s.redo(); if (k === 'c') s.copy(); if (k === 'x') { s.copy(); s.remove(); } if (k === 'v') s.paste(); if (k === 'd') s.duplicate();
        if (k === 'g') e.shiftKey ? s.ungroup() : s.group(); if (k === 'a') s.select(Object.keys(s.project.nodes).filter(id => !isUnavailable(s.project, id)));
        if (k === 'o') command('open'); if (k === 'n') command('new'); if (k === 'e') command('export'); return;
      }
      if (k === 'delete' || k === 'backspace') { e.preventDefault(); s.remove(); }
      if (e.key.startsWith('Arrow')) { e.preventDefault(); const d = e.shiftKey ? 10 : 1; s.move(e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0, e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0); }
      if (k === 'v' && !ctrl) useEditor.setState({ tool: 'select' }); if (k === 'h' && !ctrl) useEditor.setState({ tool: 'hand' });
      if (e.code === 'Space' && !e.repeat) { e.preventDefault(); spaceTool = s.tool; useEditor.setState({ tool: 'hand' }); }
      if (k === 'escape') s.select([]); if (k === '?' || k === 'f1') { e.preventDefault(); command('help'); }
      if (e.shiftKey && e.code === 'Digit1') { e.preventDefault(); command('fit'); }
      if (ctrl && (k === '+' || k === '=' || k === '-')) { e.preventDefault(); s.setZoom(s.zoom * (k === '-' ? 1 / 1.2 : 1.2)); }
    };
    window.addEventListener('keydown', key); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, [command]);
}
