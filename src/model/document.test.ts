import { describe, expect, it } from 'vitest';
import { createDemo, createProject, parseProject, serializeProject } from './document';
import { registry, createNode } from '../registry/components';
import { insertNode } from '../engine/operations';
import { SCHEMA_VERSION } from './types';
import legacyProject from '../../examples/orbit.forma.json';
describe('Document schema and registry', () => {
  it('serializes and restores the complete nested demo', () => {
    const p = createDemo(); const restored = parseProject(serializeProject(p));
    expect(restored).toEqual(p); expect(Object.values(restored.nodes).some(n => n.children.length > 2)).toBe(true);
  });
  it('round trips every registered component', () => {
    const p = createProject(); registry.forEach(d => insertNode(p, createNode(d.type)));
    expect(parseProject(serializeProject(p))).toEqual(p); expect(registry).toHaveLength(14);
  });
  it('migrates legacy unversioned documents', () => {
    const p = JSON.parse(serializeProject(createDemo())); delete p.schemaVersion;
    expect(parseProject(JSON.stringify(p)).schemaVersion).toBe(SCHEMA_VERSION);
  });
  it('upgrades the real v1 example without changing its geometry', () => {
    const p = parseProject(JSON.stringify(legacyProject));
    expect(p.schemaVersion).toBe(2); expect(p.fonts).toEqual([]);
    for (const original of Object.values(legacyProject.nodes)) {
      const n = p.nodes[original.id]; expect(n.geometry).toEqual(original.geometry); expect(n.styles.borderRadius).toBe(original.styles.borderRadius);
      expect(n.styles.cornerRadii).toBeNull(); expect(n.styles.shadows).toEqual([]); expect(n.styles.fontStyle).toBe('normal');
    }
  });
  it('rejects future schemas without losing them silently', () => { const p = { ...createProject(), schemaVersion: 99 }; expect(() => parseProject(JSON.stringify(p))).toThrow('Версия'); });
  it('rejects malformed data', () => { for (const text of ['null','{}','[]','not json']) expect(() => parseProject(text)).toThrow(); });
  it('rejects missing and orphaned children', () => {
    const p = createProject(); insertNode(p, createNode('frame')); p.nodes[p.rootIds[0]].children.push('missing');
    expect(() => parseProject(serializeProject(p))).toThrow(); p.nodes[p.rootIds[0]].children = []; p.rootIds = [];
    expect(() => parseProject(serializeProject(p))).toThrow('без родителя');
  });
  it('rejects cycles and duplicate roots', () => {
    const p = createProject(); const n = createNode('frame'); insertNode(p, n); n.children.push(n.id);
    expect(() => parseProject(serializeProject(p))).toThrow(); n.children = []; p.rootIds.push(n.id);
    expect(() => parseProject(serializeProject(p))).toThrow('повтор');
  });
  it('rejects invalid geometry, styles, and unsupported layouts', () => {
    const p = createProject(); const n = createNode('text'); insertNode(p,n);
    n.geometry.width = -1; expect(() => parseProject(serializeProject(p))).toThrow('геометрия'); n.geometry.width = 100;
    n.styles.opacity = 2; expect(() => parseProject(serializeProject(p))).toThrow('стилей'); n.styles.opacity = 1;
    n.layout.mode = 'flex'; expect(() => parseProject(serializeProject(p))).toThrow('Free Design');
  });
  it('rejects prototype property IDs', () => {
    const p = createProject(); p.rootIds = ['__proto__']; expect(() => parseProject(serializeProject(p))).toThrow('ID');
  });
  it('preserves embedded image data and unicode', () => {
    const p = createProject('Мой интерфейс ✦'); const n = createNode('image'); n.properties.src = 'data:image/png;base64,AAAA'; insertNode(p,n);
    expect(parseProject(serializeProject(p)).nodes[n.id].properties.src).toBe(n.properties.src);
  });
});
