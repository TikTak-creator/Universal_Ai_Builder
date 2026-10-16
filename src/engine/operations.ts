import { clone, uid } from '../model/types';
import type { Alignment, Project, UINode } from '../model/types';
import { createNode, isContainer } from '../registry/components';
import { bounds, rotateVector, topLevelSelection, worldRect, worldToLocal, worldTransform } from './geometry';

export function parentDepth(p: Project, id: string | null): number { return id ? 1 + parentDepth(p, p.nodes[id].parentId) : 0; }
export function subtreeDepth(p: Project, id: string): number { return 1 + Math.max(0, ...p.nodes[id].children.map(child => subtreeDepth(p, child))); }
export function subtreeCount(p: Project, ids: string[]): number { return topLevelSelection(p, ids).reduce((sum, id) => sum + 1 + subtreeCount(p, p.nodes[id].children), 0); }
export function insertNode(p: Project, node: UINode) {
  if (node.parentId && !isContainer(p.nodes[node.parentId])) throw new Error('Родитель должен быть контейнером.');
  if (parentDepth(p, node.parentId) >= 100) throw new Error('Максимальная глубина вложенности — 100.');
  p.nodes[node.id] = node;
  (node.parentId ? p.nodes[node.parentId].children : p.rootIds).push(node.id);
}
export function removeNodes(p: Project, ids: string[]) {
  function remove(id: string) { p.nodes[id].children.forEach(remove); delete p.nodes[id]; }
  topLevelSelection(p, ids).forEach(id => {
    const n = p.nodes[id]; const siblings = n.parentId ? p.nodes[n.parentId].children : p.rootIds;
    siblings.splice(siblings.indexOf(id), 1); remove(id);
  });
}
export function reparent(p: Project, id: string, parentId: string | null, index?: number) {
  if (!p.nodes[id] || (parentId && !isContainer(p.nodes[parentId]))) return false;
  let ancestor = parentId;
  while (ancestor) { if (ancestor === id) return false; ancestor = p.nodes[ancestor].parentId; }
  if (parentDepth(p, parentId) + subtreeDepth(p, id) > 100) return false;
  const n = p.nodes[id]; const t = worldTransform(p, id);
  const siblings = n.parentId ? p.nodes[n.parentId].children : p.rootIds;
  siblings.splice(siblings.indexOf(id), 1);
  n.parentId = parentId;
  const target = parentId ? p.nodes[parentId].children : p.rootIds;
  target.splice(index === undefined ? target.length : Math.max(0, Math.min(index, target.length)), 0, id);
  const center = worldToLocal(p, parentId, t.center);
  n.geometry.x = center.x - n.geometry.width / 2; n.geometry.y = center.y - n.geometry.height / 2;
  n.geometry.rotation = t.rotation - (parentId ? worldTransform(p, parentId).rotation : 0);
  return true;
}
export function duplicateNodes(p: Project, ids: string[], offset = 24): string[] {
  const copy = (id: string, parentId: string | null): string => {
    const n = clone(p.nodes[id]); n.id = uid(); n.parentId = parentId; n.name += ' копия';
    const children = [...n.children]; n.children = []; p.nodes[n.id] = n;
    n.children = children.map(child => copy(child, n.id)); return n.id;
  };
  return topLevelSelection(p, ids).map(id => {
    const original = p.nodes[id]; const newId = copy(id, original.parentId); const n = p.nodes[newId];
    n.geometry.x += offset; n.geometry.y += offset;
    const siblings = n.parentId ? p.nodes[n.parentId].children : p.rootIds;
    siblings.splice(siblings.indexOf(id) + 1, 0, newId); return newId;
  });
}
export function groupNodes(p: Project, ids: string[]): string | null {
  const selected = topLevelSelection(p, ids);
  if (selected.length < 2) return null;
  const parentId = p.nodes[selected[0]].parentId;
  if (!selected.every(id => p.nodes[id].parentId === parentId)) return null;
  if (parentDepth(p, parentId) + 1 + Math.max(...selected.map(id => subtreeDepth(p, id))) > 100) return null;
  // Temporarily measure in the shared parent's coordinate system, including rotations.
  const rects = selected.map(id => {
    const n = p.nodes[id]; const r = n.geometry.rotation * Math.PI / 180;
    const width = Math.abs(n.geometry.width * Math.cos(r)) + Math.abs(n.geometry.height * Math.sin(r));
    const height = Math.abs(n.geometry.width * Math.sin(r)) + Math.abs(n.geometry.height * Math.cos(r));
    return { x: n.geometry.x + (n.geometry.width - width) / 2, y: n.geometry.y + (n.geometry.height - height) / 2, width, height };
  });
  const b = bounds(rects); const group = createNode('frame', b.x, b.y, parentId);
  group.name = 'Группа'; Object.assign(group.geometry, b); group.styles.background = 'transparent'; group.styles.borderRadius = 0;
  const siblings = parentId ? p.nodes[parentId].children : p.rootIds;
  const position = Math.min(...selected.map(id => siblings.indexOf(id)));
  const ordered = siblings.filter(id => selected.includes(id)); insertNode(p, group);
  ordered.forEach(id => reparent(p, id, group.id));
  const i = siblings.indexOf(group.id); siblings.splice(i, 1); siblings.splice(position, 0, group.id);
  return group.id;
}
export function ungroupNodes(p: Project, ids: string[]): string[] {
  const children: string[] = [];
  topLevelSelection(p, ids).forEach(id => {
    const n = p.nodes[id]; if (!isContainer(n)) return;
    const siblings = n.parentId ? p.nodes[n.parentId].children : p.rootIds;
    let i = siblings.indexOf(id);
    [...n.children].forEach(child => { reparent(p, child, n.parentId, i++); children.push(child); });
    removeNodes(p, [id]);
  }); return children;
}
export function translateNodes(p: Project, ids: string[], dx: number, dy: number) {
  topLevelSelection(p, ids).forEach(id => {
    const n = p.nodes[id]; const rotation = n.parentId ? worldTransform(p, n.parentId).rotation : 0;
    const delta = rotateVector({ x: dx, y: dy }, -rotation); n.geometry.x += delta.x; n.geometry.y += delta.y;
  });
}
export function alignNodes(p: Project, ids: string[], alignment: Alignment) {
  const selected = topLevelSelection(p, ids); if (!selected.length) return;
  const b = selected.length === 1 ? { x: 0, y: 0, ...p.canvas } : bounds(selected.map(id => worldRect(p, id)));
  selected.forEach(id => {
    const r = worldRect(p, id); let dx = 0, dy = 0;
    if (alignment === 'left') dx = b.x - r.x;
    if (alignment === 'center') dx = b.x + b.width / 2 - r.x - r.width / 2;
    if (alignment === 'right') dx = b.x + b.width - r.x - r.width;
    if (alignment === 'top') dy = b.y - r.y;
    if (alignment === 'middle') dy = b.y + b.height / 2 - r.y - r.height / 2;
    if (alignment === 'bottom') dy = b.y + b.height - r.y - r.height;
    translateNodes(p, [id], dx, dy);
  });
}
export function distributeNodes(p: Project, ids: string[], axis: 'x' | 'y') {
  const selected = topLevelSelection(p, ids).sort((a, b) => worldRect(p, a)[axis] - worldRect(p, b)[axis]);
  if (selected.length < 3) return;
  const rects = selected.map(id => worldRect(p, id)); const size = axis === 'x' ? 'width' : 'height';
  const start = rects[0][axis], end = rects.at(-1)![axis] + rects.at(-1)![size];
  const gap = (end - start - rects.reduce((sum, r) => sum + r[size], 0)) / (rects.length - 1);
  let cursor = start;
  selected.forEach((id, i) => { translateNodes(p, [id], axis === 'x' ? cursor - rects[i].x : 0, axis === 'y' ? cursor - rects[i].y : 0); cursor += rects[i][size] + gap; });
}
