import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDemo, createProject } from '../model/document';
import { deleteProject, listProjects, loadLastProject, loadProject, saveProject } from './projects';
import { readFileSync } from 'node:fs';
import { prepareFontFile } from '../assets/fonts';
beforeEach(async () => { await new Promise<void>((resolve,reject) => { const r=indexedDB.deleteDatabase('forma-ui-builder'); r.onsuccess=()=>resolve(); r.onerror=()=>reject(r.error); }); });
describe('IndexedDB local persistence', () => {
  it('saves and restores the entire nested project', async () => { const p=createDemo(); await saveProject(p); expect(await loadProject(p.id)).toEqual(p); });
  it('keeps embedded font binaries and custom corner styles in IndexedDB', async () => {
    const p=createDemo();const bytes=Uint8Array.from(readFileSync(new URL('../../public/fonts/Manrope-Variable.ttf',import.meta.url)));
    p.fonts.push(await prepareFontFile(new File([bytes],'Manrope.ttf')));p.nodes[p.rootIds[0]].styles.cornerRadii={topLeft:4,topRight:20,bottomRight:8,bottomLeft:28};
    await saveProject(p);expect(await loadProject(p.id)).toEqual(p);
  });
  it('restores last opened project on editor restart', async () => { const a=createProject('A'),b=createProject('B'); await saveProject(a); await saveProject(b); expect(await loadLastProject()).toEqual(b); });
  it('updates existing records without duplicates', async () => { const p=createDemo(); await saveProject(p); p.name='Renamed'; await saveProject(p); expect(await listProjects()).toHaveLength(1); expect((await loadProject(p.id))?.name).toBe('Renamed'); });
  it('lists projects in recent order', async () => { const a=createProject('Old'),b=createProject('New'); a.updatedAt='2020-01-01T00:00:00.000Z'; b.updatedAt='2026-01-01T00:00:00.000Z'; await saveProject(a); await saveProject(b); expect((await listProjects()).map(p=>p.name)).toEqual(['New','Old']); });
  it('returns null for absent projects', async () => { expect(await loadProject('absent')).toBeNull(); expect(await loadLastProject()).toBeNull(); });
  it('deletes only the specified project', async () => { const a=createProject('A'),b=createProject('B'); await saveProject(a); await saveProject(b); await deleteProject(a.id); expect(await loadProject(a.id)).toBeNull(); expect(await loadProject(b.id)).toEqual(b); });
});
