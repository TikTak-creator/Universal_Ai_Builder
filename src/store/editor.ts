import { create } from 'zustand';
import { clone, uid } from '../model/types';
import type { Alignment, ComponentType, Geometry, Project, UINode } from '../model/types';
import { createDemo, createProject } from '../model/document';
import { createNode, isContainer } from '../registry/components';
import { alignNodes, distributeNodes, duplicateNodes, groupNodes, insertNode, removeNodes, reparent, subtreeCount, translateNodes, ungroupNodes } from '../engine/operations';
import { isUnavailable, topLevelSelection, worldTransform } from '../engine/geometry';
import { mergeClipboardFonts } from '../assets/fonts';

type EditorState = {
  project: Project; selection: string[]; past: Project[]; future: Project[]; gesture: Project | null;
  clipboard: Project | null; revision: number; savedRevision: number; ready: boolean;
  zoom: number; pan: { x: number; y: number }; grid: boolean; snap: boolean; smart: boolean; rulers: boolean;
  tool: 'select' | 'hand'; preview: boolean; leftTab: 'layers' | 'library';
  toast: string; saveError: string; saving: boolean;
  mutate: (recipe: (p: Project) => void) => void;
  setProject: (p: Project) => void; select: (ids: string[], additive?: boolean) => void;
  add: (type: ComponentType, point?: { x: number; y: number }, parentId?: string | null) => void;
  updateNode: (id: string, patch: Partial<Pick<UINode, 'name' | 'hidden' | 'locked'>>, section?: 'geometry' | 'styles' | 'properties', values?: Record<string, unknown>) => void;
  beginGesture: () => void; endGesture: () => void; cancelGesture: () => void;
  applyGeometry: (values: Record<string, Geometry>) => void;
  undo: () => void; redo: () => void; remove: () => void; duplicate: () => void;
  copy: () => void; paste: () => void; group: () => void; ungroup: () => void;
  move: (dx: number, dy: number) => void; align: (alignment: Alignment) => void;
  distribute: (axis: 'x' | 'y') => void; reparent: (id: string, parentId: string | null, index?: number) => void;
  reorder: (id: string, direction: number) => void;
  setZoom: (zoom: number) => void; fit: (width: number, height: number) => void;
  notify: (message: string) => void;
};
const history = (past: Project[], p: Project) => [...past, p].slice(-100);
export const useEditor = create<EditorState>((set, get) => ({
  project: createDemo(), selection: [], past: [], future: [], gesture: null, clipboard: null,
  revision: 0, savedRevision: -1, ready: false, zoom: 0.65, pan: { x: 80, y: 65 },
  grid: false, snap: true, smart: true, rulers: true, tool: 'select', preview: false, leftTab: 'layers',
  toast: '', saveError: '', saving: false,
  notify: message => set({ toast: message }),
  mutate: recipe => {
    const s = get(); const next = clone(s.project); recipe(next);
    if (JSON.stringify(next) === JSON.stringify(s.project)) return;
    next.updatedAt = new Date().toISOString();
    set({ project: next, past: s.gesture ? s.past : history(s.past, s.project), future: [], revision: s.revision + 1, saveError: '' });
  },
  setProject: p => set({ project: clone(p), selection: [], past: [], future: [], gesture: null, revision: get().revision + 1, savedRevision: -1, saveError: '', preview: false }),
  select: (ids, additive = false) => set(s => ({ selection: additive ? [...new Set([...s.selection.filter(id => !ids.includes(id)), ...ids.filter(id => !s.selection.includes(id))])] : [...new Set(ids.filter(id => !!s.project.nodes[id]))] })),
  add: (type, point, target) => {
    const s = get(); if (Object.keys(s.project.nodes).length >= 5000) { s.notify('Лимит — 5000 компонентов.'); return; }
    const selected = s.project.nodes[s.selection[0]];
    const parentId = target === undefined ? isContainer(selected) && !isUnavailable(s.project, selected.id) ? selected.id : null : target;
    if (parentId && isUnavailable(s.project, parentId)) { s.notify('Родитель скрыт или заблокирован.'); return; }
    const n = createNode(type, point?.x ?? 40, point?.y ?? 40, parentId);
    try { s.mutate(p => insertNode(p, n)); set({ selection: [n.id], tool: 'select' }); }
    catch (error) { s.notify(error instanceof Error ? error.message : 'Не удалось добавить компонент.'); }
  },
  updateNode: (id, patch, section, values) => get().mutate(p => {
    const n = p.nodes[id]; if (!n) return;
    if (isUnavailable(p, id) && !('locked' in patch) && !('hidden' in patch)) return;
    Object.assign(n, patch); if (section) Object.assign(n[section], values);
    n.geometry.width = Math.max(1, n.geometry.width); n.geometry.height = Math.max(1, n.geometry.height);
  }),
  beginGesture: () => { if (!get().gesture) set({ gesture: clone(get().project) }); },
  endGesture: () => {
    const s = get(); if (!s.gesture) return;
    const changed = JSON.stringify(s.gesture) !== JSON.stringify(s.project);
    set({ gesture: null, past: changed ? history(s.past, s.gesture) : s.past });
  },
  cancelGesture: () => { const s = get(); if (s.gesture) set({ project: s.gesture, gesture: null, revision: s.revision + 1 }); },
  applyGeometry: values => get().mutate(p => { for (const [id, g] of Object.entries(values)) if (p.nodes[id] && !isUnavailable(p, id)) p.nodes[id].geometry = clone(g); }),
  undo: () => {
    const s = get(); if (s.gesture) { s.cancelGesture(); return; } const previous = s.past.at(-1); if (!previous) return;
    set({ project: previous, past: s.past.slice(0, -1), future: [s.project, ...s.future], selection: s.selection.filter(id => previous.nodes[id]), revision: s.revision + 1 });
  },
  redo: () => { const s = get(); const next = s.future[0]; if (!next || s.gesture) return; set({ project: next, past: history(s.past, s.project), future: s.future.slice(1), selection: s.selection.filter(id => next.nodes[id]), revision: s.revision + 1 }); },
  remove: () => { const s = get(); const ids = s.selection.filter(id => !isUnavailable(s.project, id)); s.mutate(p => removeNodes(p, ids)); set({ selection: s.selection.filter(id => !!get().project.nodes[id]) }); },
  duplicate: () => { const s = get(); if (Object.keys(s.project.nodes).length + subtreeCount(s.project, s.selection) > 5000) return s.notify('Лимит — 5000 компонентов.'); let ids: string[] = []; s.mutate(p => { ids = duplicateNodes(p, s.selection.filter(id => !isUnavailable(p, id))); }); set({ selection: ids }); },
  copy: () => {
    const s = get(); const p = createProject('Буфер');
    const copyTree = (id: string) => { p.nodes[id] = clone(s.project.nodes[id]); p.nodes[id].children.forEach(copyTree); };
    p.rootIds = topLevelSelection(s.project, s.selection); p.rootIds.forEach(id => {
      copyTree(id); const n = p.nodes[id]; const t = worldTransform(s.project, id);
      n.parentId = null; n.geometry.x = t.center.x - n.geometry.width / 2; n.geometry.y = t.center.y - n.geometry.height / 2; n.geometry.rotation = t.rotation;
    });
    p.fonts = clone(s.project.fonts.filter(font => Object.values(p.nodes).some(n => n.styles.fontFamily.includes(font.family))));
    if (p.rootIds.length) { set({ clipboard: p }); s.notify('Скопировано в буфер редактора'); }
  },
  paste: () => {
    const s = get(); if (!s.clipboard) return;
    if (Object.keys(s.project.nodes).length + Object.keys(s.clipboard.nodes).length > 5000) return s.notify('Лимит — 5000 компонентов.');
    const temp = clone(s.clipboard); const newIds = duplicateNodes(temp, temp.rootIds);
    const collect = (id: string, p: Project) => { p.nodes[id] = temp.nodes[id]; temp.nodes[id].children.forEach(child => collect(child, p)); };
    try { s.mutate(p => { mergeClipboardFonts(p, temp); newIds.forEach(id => { collect(id, p); p.rootIds.push(id); }); }); set({ selection: newIds }); }
    catch (error) { s.notify(error instanceof Error ? error.message : 'Не удалось вставить элементы.'); }
  },
  group: () => { const s = get(); if (Object.keys(s.project.nodes).length >= 5000) return s.notify('Лимит — 5000 компонентов.'); let id: string | null = null; s.mutate(p => { id = groupNodes(p, s.selection.filter(i => !isUnavailable(p, i))); }); if (id) set({ selection: [id] }); else s.notify('Нужны два элемента с общим родителем и глубиной до 100.'); },
  ungroup: () => { const s = get(); let ids: string[] = []; s.mutate(p => { ids = ungroupNodes(p, s.selection.filter(id => !isUnavailable(p, id))); }); set({ selection: ids }); },
  move: (dx, dy) => { const s = get(); s.mutate(p => translateNodes(p, s.selection.filter(id => !isUnavailable(p, id)), dx, dy)); },
  align: alignment => { const s = get(); s.mutate(p => alignNodes(p, s.selection.filter(id => !isUnavailable(p, id)), alignment)); },
  distribute: axis => { const s = get(); s.mutate(p => distributeNodes(p, s.selection.filter(id => !isUnavailable(p, id)), axis)); },
  reparent: (id, parentId, index) => { const s = get(); if (isUnavailable(s.project, id) || (parentId && isUnavailable(s.project, parentId))) return s.notify('Элемент или родитель заблокирован.'); s.mutate(p => { reparent(p, id, parentId, index); }); },
  reorder: (id, direction) => get().mutate(p => { if (isUnavailable(p, id)) return; const n = p.nodes[id]; const ids = n.parentId ? p.nodes[n.parentId].children : p.rootIds; const i = ids.indexOf(id); ids.splice(i, 1); ids.splice(Math.min(ids.length, Math.max(0, i + direction)), 0, id); }),
  setZoom: zoom => set({ zoom: Math.max(0.1, Math.min(8, zoom)) }),
  fit: (width, height) => { const p = get().project; const zoom = Math.max(0.1, Math.min(1, (width - 120) / p.canvas.width, (height - 130) / p.canvas.height)); set({ zoom, pan: { x: (width - p.canvas.width * zoom) / 2, y: (height - p.canvas.height * zoom) / 2 + 12 } }); },
}));

export function saveAsCopy() { const s = useEditor.getState(); const p = clone(s.project); p.id = uid(); p.name += ' — копия'; p.createdAt = new Date().toISOString(); s.setProject(p); }
