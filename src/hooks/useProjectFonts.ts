import { useEffect, useRef, useState } from 'react';
import type { FontAsset } from '../model/types';
import { loadFontAsset } from '../assets/fonts';

export function useProjectFonts(fonts: FontAsset[]) {
  const active = useRef(new Map<string, FontFace>()); const [error, setError] = useState('');
  useEffect(() => {
    let current = true;
    const ids = new Set(fonts.map(f => f.id));
    for (const [id, face] of active.current) if (!ids.has(id)) { document.fonts.delete(face); active.current.delete(id); }
    void Promise.allSettled(fonts.map(loadFontAsset)).then(results => {
      if (!current) return; const failures: string[] = [];
      results.forEach((result, index) => {
        const id = fonts[index].id;
        if (result.status === 'fulfilled') {
          const old = active.current.get(id); if (old && old !== result.value) document.fonts.delete(old);
          document.fonts.add(result.value); active.current.set(id, result.value);
        } else {
          const old = active.current.get(id); if (old) { document.fonts.delete(old); active.current.delete(id); }
          failures.push(result.reason instanceof Error ? result.reason.message : 'Ошибка загрузки шрифта.');
        }
      });
      setError(failures.join(' '));
    });
    return () => { current = false; };
  }, [fonts]);
  useEffect(() => { const faces = active.current; return () => { faces.forEach(face => document.fonts.delete(face)); faces.clear(); }; }, []);
  return error;
}
