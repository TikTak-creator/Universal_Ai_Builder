import { beforeEach, describe, expect, it } from 'vitest';
import { useEditor } from './editor';
import { createProject, parseProject, serializeProject } from '../model/document';
import { worldTransform } from '../engine/geometry';
beforeEach(() => { useEditor.setState({ project:createProject(), selection:[], past:[], future:[], gesture:null, clipboard:null, revision:0, savedRevision:0 }); });
describe('History and editor commands', () => {
  it('undoes and redoes insert and geometry updates', () => {
    const s=useEditor.getState(); s.add('button'); const id=useEditor.getState().selection[0];
    useEditor.getState().updateNode(id,{},'geometry',{x:200}); expect(useEditor.getState().project.nodes[id].geometry.x).toBe(200);
    s.undo(); expect(useEditor.getState().project.nodes[id].geometry.x).toBe(40); s.undo(); expect(useEditor.getState().project.nodes[id]).toBeUndefined();
    s.redo(); s.redo(); expect(useEditor.getState().project.nodes[id].geometry.x).toBe(200);
  });
  it('coalesces a whole drag into one undo step', () => {
    const s=useEditor.getState(); s.add('shape'); const id=useEditor.getState().selection[0]; s.beginGesture();
    for(let x=50;x<150;x+=10) useEditor.getState().updateNode(id,{},'geometry',{x});
    s.endGesture(); expect(useEditor.getState().past).toHaveLength(2); s.undo(); expect(useEditor.getState().project.nodes[id].geometry.x).toBe(40);
  });
  it('cancels a gesture without creating history', () => {
    const s=useEditor.getState(); s.add('shape'); const id=useEditor.getState().selection[0]; s.beginGesture(); s.updateNode(id,{},'geometry',{width:900}); s.cancelGesture();
    expect(useEditor.getState().project.nodes[id].geometry.width).toBe(120); expect(useEditor.getState().past).toHaveLength(1);
  });
  it('does not record an empty gesture or no-op edit', () => { const s=useEditor.getState(); s.beginGesture(); s.endGesture(); s.mutate(()=>{}); expect(useEditor.getState().past).toHaveLength(0); });
  it('invalidates the redo branch on a new edit', () => { const s=useEditor.getState(); s.add('text'); s.undo(); s.add('button'); expect(useEditor.getState().future).toHaveLength(0); });
  it('keeps history snapshots independent', () => {
    const s=useEditor.getState(); s.add('text'); const id=useEditor.getState().selection[0]; s.updateNode(id,{},'properties',{text:'Different'}); s.undo(); expect(useEditor.getState().project.nodes[id].properties.text).not.toBe('Different');
  });
  it('blocks transforms and deletion for locked descendants', () => {
    const s=useEditor.getState(); s.add('frame'); const frame=useEditor.getState().selection[0]; s.add('button'); const id=useEditor.getState().selection[0];
    s.updateNode(frame,{locked:true}); s.move(50,0); s.updateNode(id,{},'geometry',{width:900}); s.remove();
    expect(useEditor.getState().project.nodes[id].geometry.x).toBe(40); expect(useEditor.getState().project.nodes[id].geometry.width).toBe(156);
  });
  it('copies nested nodes and pastes at world coordinates with unique IDs', () => {
    const s=useEditor.getState(); s.add('frame',{x:100,y:100}); s.add('button'); const id=useEditor.getState().selection[0];
    const before=worldTransform(useEditor.getState().project,id); s.copy(); s.paste(); const copy=useEditor.getState().project.nodes[useEditor.getState().selection[0]];
    expect(copy.id).not.toBe(id); expect(copy.parentId).toBeNull(); expect(copy.geometry.x+copy.geometry.width/2).toBe(before.center.x+24);
    expect(parseProject(serializeProject(useEditor.getState().project))).toEqual(useEditor.getState().project);
  });
  it('toggles additive selection', () => { const s=useEditor.getState(); s.add('text'); const id=useEditor.getState().selection[0]; s.select([id],true); expect(useEditor.getState().selection).toEqual([]); });
  it('clamps zoom to 10–800 percent', () => { const s=useEditor.getState(); s.setZoom(.001); expect(useEditor.getState().zoom).toBe(.1); s.setZoom(100); expect(useEditor.getState().zoom).toBe(8); });
  it('caps undo history at 100 snapshots', () => { const s=useEditor.getState(); s.add('text'); const id=useEditor.getState().selection[0]; for(let x=0;x<110;x++) s.updateNode(id,{},'geometry',{x}); expect(useEditor.getState().past).toHaveLength(100); });
  it('clears history and selection on document replacement', () => { const s=useEditor.getState(); s.add('text'); s.setProject(createProject('Other')); expect(useEditor.getState().past).toEqual([]); expect(useEditor.getState().selection).toEqual([]); expect(useEditor.getState().project.name).toBe('Other'); });
});
