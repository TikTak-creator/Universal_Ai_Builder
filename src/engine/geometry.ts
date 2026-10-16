import type { Geometry, Project, Rect } from '../model/types';
export type Point = { x: number; y: number };
export const rotateVector = (p: Point, degrees: number): Point => {
  const r = degrees * Math.PI / 180;
  return { x: p.x * Math.cos(r) - p.y * Math.sin(r), y: p.x * Math.sin(r) + p.y * Math.cos(r) };
};
export function worldTransform(p: Project, id: string): { center: Point; rotation: number } {
  const n = p.nodes[id];
  const center = { x: n.geometry.x + n.geometry.width / 2, y: n.geometry.y + n.geometry.height / 2 };
  if (!n.parentId) return { center, rotation: n.geometry.rotation };
  const parent = p.nodes[n.parentId]; const t = worldTransform(p, parent.id);
  const delta = rotateVector({ x: center.x - parent.geometry.width / 2, y: center.y - parent.geometry.height / 2 }, t.rotation);
  return { center: { x: t.center.x + delta.x, y: t.center.y + delta.y }, rotation: t.rotation + n.geometry.rotation };
}
export function worldToLocal(p: Project, parentId: string | null, point: Point): Point {
  if (!parentId) return point;
  const n = p.nodes[parentId]; const t = worldTransform(p, parentId);
  const v = rotateVector({ x: point.x - t.center.x, y: point.y - t.center.y }, -t.rotation);
  return { x: v.x + n.geometry.width / 2, y: v.y + n.geometry.height / 2 };
}
export function worldRect(p: Project, id: string): Rect {
  const { center, rotation } = worldTransform(p, id); const g = p.nodes[id].geometry;
  const r = rotation * Math.PI / 180;
  const width = Math.abs(g.width * Math.cos(r)) + Math.abs(g.height * Math.sin(r));
  const height = Math.abs(g.width * Math.sin(r)) + Math.abs(g.height * Math.cos(r));
  return { x: center.x - width / 2, y: center.y - height / 2, width, height };
}
export function bounds(rects: Rect[]): Rect {
  if (!rects.length) return { x: 0, y: 0, width: 0, height: 0 };
  const x = Math.min(...rects.map(r => r.x)); const y = Math.min(...rects.map(r => r.y));
  return { x, y, width: Math.max(...rects.map(r => r.x + r.width)) - x, height: Math.max(...rects.map(r => r.y + r.height)) - y };
}
export const intersects = (a: Rect, b: Rect) => a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y;
export function isUnavailable(p: Project, id: string): boolean {
  const n = p.nodes[id]; return !n || n.hidden || n.locked || (!!n.parentId && isUnavailable(p, n.parentId));
}
export function isHidden(p: Project, id: string): boolean {
  const n = p.nodes[id]; return !n || n.hidden || (!!n.parentId && isHidden(p, n.parentId));
}
export function topLevelSelection(p: Project, ids: string[]): string[] {
  const set = new Set(ids);
  return ids.filter(id => {
    let parentId = p.nodes[id]?.parentId;
    while (parentId) { if (set.has(parentId)) return false; parentId = p.nodes[parentId]?.parentId; }
    return !!p.nodes[id];
  });
}
export function resizeGeometry(g: Geometry, handle: string, dx: number, dy: number, aspect = false): Geometry {
  const local = rotateVector({ x: dx, y: dy }, -g.rotation);
  let w = g.width + (handle.includes('e') ? local.x : handle.includes('w') ? -local.x : 0);
  let h = g.height + (handle.includes('s') ? local.y : handle.includes('n') ? -local.y : 0);
  if (aspect) {
    const ratio = g.width / g.height;
    if (Math.abs(w - g.width) > Math.abs(h - g.height) * ratio) h = w / ratio; else w = h * ratio;
  }
  w = Math.max(4, w); h = Math.max(4, h);
  const shift = rotateVector({ x: (w - g.width) / 2 * (handle.includes('w') ? -1 : handle.includes('e') ? 1 : 0), y: (h - g.height) / 2 * (handle.includes('n') ? -1 : handle.includes('s') ? 1 : 0) }, g.rotation);
  return { ...g, x: g.x + (g.width - w) / 2 + shift.x, y: g.y + (g.height - h) / 2 + shift.y, width: w, height: h };
}
export function snapMove(p: Project, ids: string[], delta: Point, grid: boolean, smart: boolean, zoom: number): { delta: Point; guides: { axis: 'x' | 'y'; position: number }[] } {
  const b = bounds(ids.map(id => worldRect(p, id))); const guides: { axis: 'x' | 'y'; position: number }[] = [];
  const result = { x: grid ? Math.round((b.x + delta.x) / 8) * 8 - b.x : delta.x, y: grid ? Math.round((b.y + delta.y) / 8) * 8 - b.y : delta.y };
  if (!smart) return { delta: result, guides };
  const excluded = new Set<string>();
  const collect = (id: string) => { excluded.add(id); p.nodes[id].children.forEach(collect); }; ids.forEach(collect);
  const others = Object.keys(p.nodes).filter(id => !excluded.has(id) && !isUnavailable(p, id)).map(id => worldRect(p, id));
  for (const axis of ['x', 'y'] as const) {
    const size = axis === 'x' ? 'width' : 'height';
    const targets = [0, p.canvas[size] / 2, p.canvas[size], ...others.flatMap(r => [r[axis], r[axis] + r[size] / 2, r[axis] + r[size]]), ...p.guides.filter(g => g.axis === axis).map(g => g.position)];
    let best = 5 / zoom; let adjustment = 0; let line: number | undefined;
    for (const from of [b[axis], b[axis] + b[size] / 2, b[axis] + b[size]]) for (const to of targets) {
      const diff = to - (from + result[axis]); if (Math.abs(diff) < best) { best = Math.abs(diff); adjustment = diff; line = to; }
    }
    if (line !== undefined) { result[axis] += adjustment; guides.push({ axis, position: line }); }
  }
  return { delta: result, guides };
}
