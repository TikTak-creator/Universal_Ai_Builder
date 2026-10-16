import type { Corners, Gradient, NodeStyles, Shadow } from './types';

export const extraStyleDefaults = () => ({
  cornerRadii: null, gradient: null, shadows: [], blur: 0, backdropBlur: 0,
  blendMode: 'normal', letterSpacing: 0, fontStyle: 'normal', textDecoration: 'none',
  textTransform: 'none', borderStyle: 'solid', objectFit: 'cover',
} satisfies Pick<NodeStyles, 'cornerRadii' | 'gradient' | 'shadows' | 'blur' | 'backdropBlur' | 'blendMode' | 'letterSpacing' | 'fontStyle' | 'textDecoration' | 'textTransform' | 'borderStyle' | 'objectFit'>);
export const uniformCorners = (r: number): Corners => ({ topLeft: r, topRight: r, bottomRight: r, bottomLeft: r });
export function cornerCSS(s: Pick<NodeStyles, 'borderRadius' | 'cornerRadii'>) {
  const c = s.cornerRadii;
  return c ? `${c.topLeft}px ${c.topRight}px ${c.bottomRight}px ${c.bottomLeft}px` : `${s.borderRadius}px`;
}
export function gradientCSS(g: Gradient) {
  if (g.type === 'radial') return `radial-gradient(circle at center, ${g.from}, ${g.to})`;
  if (g.type === 'conic') return `conic-gradient(from ${g.angle}deg, ${g.from}, ${g.to}, ${g.from})`;
  return `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})`;
}
export function shadowsCSS(shadows: Shadow[]) {
  return shadows.map(s => `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px color-mix(in srgb, ${s.color} ${Math.round(s.opacity * 100)}%, transparent)`).join(', ');
}
export function validateCustomization(s: NodeStyles) {
  const finite = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
  if (s.cornerRadii !== null && (!s.cornerRadii || !['topLeft','topRight','bottomRight','bottomLeft'].every(k => finite(s.cornerRadii![k as keyof Corners], 0, 10000)))) throw new Error('Некорректные радиусы углов.');
  const g = s.gradient;
  if (g !== null && (!g || !['linear','radial','conic'].includes(g.type) || typeof g.from !== 'string' || typeof g.to !== 'string' || !finite(g.angle, -3600, 3600))) throw new Error('Некорректный градиент.');
  if (!Array.isArray(s.shadows) || s.shadows.length > 8 || s.shadows.some(v => !v || typeof v.id !== 'string' || typeof v.color !== 'string' || typeof v.inset !== 'boolean' || !finite(v.x, -1000, 1000) || !finite(v.y, -1000, 1000) || !finite(v.blur, 0, 1000) || !finite(v.spread, -1000, 1000) || !finite(v.opacity, 0, 1))) throw new Error('Некорректные тени.');
  if (!finite(s.blur, 0, 100) || !finite(s.backdropBlur, 0, 100) || !finite(s.letterSpacing, -100, 100)) throw new Error('Некорректные эффекты или межбуквенный интервал.');
  if (!['normal','multiply','screen','overlay','darken','lighten'].includes(s.blendMode) || !['normal','italic'].includes(s.fontStyle) || !['none','underline','line-through'].includes(s.textDecoration) || !['none','uppercase','lowercase','capitalize'].includes(s.textTransform) || !['solid','dashed','dotted'].includes(s.borderStyle) || !['cover','contain','fill','scale-down'].includes(s.objectFit)) throw new Error('Некорректные настройки оформления.');
}
