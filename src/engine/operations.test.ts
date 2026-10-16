import { describe, expect, it } from 'vitest';
import { createProject } from '../model/document';
import { createNode } from '../registry/components';
import { alignNodes, distributeNodes, duplicateNodes, groupNodes, insertNode, removeNodes, reparent, translateNodes, ungroupNodes } from './operations';
import { bounds, intersects, isHidden, isUnavailable, resizeGeometry, snapMove, topLevelSelection, worldRect, worldTransform } from './geometry';
function fixture() {
  const p = createProject(); const frame = createNode('frame',100,100); const a = createNode('button',20,30,frame.id); const b = createNode('text',210,100,frame.id);
  insertNode(p,frame); insertNode(p,a); insertNode(p,b); return { p, frame, a, b };
}
describe('Tree editing', () => {
  it('inserts nested components with consistent references', () => { const {p,frame,a} = fixture(); expect(frame.children).toContain(a.id); expect(a.parentId).toBe(frame.id); expect(p.rootIds).toEqual([frame.id]); });
  it('prevents cycles and invalid container types', () => { const {p,frame,a} = fixture(); expect(reparent(p,frame.id,frame.id)).toBe(false); expect(reparent(p,frame.id,a.id)).toBe(false); });
  it('rejects adding children to a text node', () => { const {p,a} = fixture(); const n = createNode('text',0,0,a.id); expect(() => insertNode(p,n)).toThrow(); });
  it('reparents without changing world position or rotation', () => {
    const {p,frame,a} = fixture(); frame.geometry.rotation = 30; a.geometry.rotation = 20;
    const before = worldTransform(p,a.id); expect(reparent(p,a.id,null)).toBe(true); const after = worldTransform(p,a.id);
    expect(after.center.x).toBeCloseTo(before.center.x); expect(after.center.y).toBeCloseTo(before.center.y); expect(after.rotation).toBeCloseTo(before.rotation);
    expect(frame.children).not.toContain(a.id); expect(p.rootIds).toContain(a.id);
  });
  it('deeply duplicates a subtree with new IDs', () => {
    const {p,frame,a} = fixture(); const [id] = duplicateNodes(p,[frame.id]); const copy = p.nodes[id];
    expect(copy.id).not.toBe(frame.id); expect(copy.children).toHaveLength(2); expect(copy.children).not.toContain(a.id);
    expect(p.nodes[copy.children[0]].parentId).toBe(id); expect(copy.geometry.x).toBe(frame.geometry.x + 24);
    p.nodes[copy.children[0]].properties.text = 'Changed'; expect(a.properties.text).not.toBe('Changed');
  });
  it('removes a full subtree without orphaned records', () => { const {p,frame} = fixture(); removeNodes(p,[frame.id]); expect(p.nodes).toEqual({}); expect(p.rootIds).toEqual([]); });
  it('ignores child selections when their parent is selected', () => { const {p,frame,a} = fixture(); expect(topLevelSelection(p,[a.id,frame.id])).toEqual([frame.id]); });
  it('groups and ungroups rotated children preserving world geometry and order', () => {
    const {p,frame,a,b} = fixture(); frame.geometry.rotation = 17; a.geometry.rotation = -20;
    const before = [worldTransform(p,a.id),worldTransform(p,b.id)]; const group = groupNodes(p,[a.id,b.id])!;
    expect(p.nodes[group].children).toEqual([a.id,b.id]); expect(frame.children).toEqual([group]);
    ungroupNodes(p,[group]); expect(frame.children).toEqual([a.id,b.id]); expect(p.nodes[group]).toBeUndefined();
    [a,b].forEach((n,i) => { const after = worldTransform(p,n.id); expect(after.center.x).toBeCloseTo(before[i].center.x); expect(after.center.y).toBeCloseTo(before[i].center.y); expect(after.rotation).toBeCloseTo(before[i].rotation); });
  });
  it('declines grouping across different parents', () => { const {p,frame,a} = fixture(); expect(groupNodes(p,[frame.id,a.id])).toBeNull(); });
  it('enforces nesting depth on edits as well as import', () => {
    const p=createProject(); let parent: string | null=null;
    for(let i=0;i<100;i++){const n=createNode('frame',0,0,parent);insertNode(p,n);parent=n.id;}
    expect(()=>insertNode(p,createNode('frame',0,0,parent))).toThrow('глубина');
    const other=createNode('frame');insertNode(p,other);expect(reparent(p,other.id,parent)).toBe(false);
  });
});
describe('Transform and selection engines', () => {
  it('moves in world coordinates inside a rotated parent', () => {
    const {p,frame,a} = fixture(); frame.geometry.rotation = 90; const before = worldTransform(p,a.id); translateNodes(p,[a.id],40,0); const after = worldTransform(p,a.id);
    expect(after.center.x - before.center.x).toBeCloseTo(40); expect(after.center.y).toBeCloseTo(before.center.y);
  });
  it('does not move a child twice in a parent selection', () => { const {p,frame,a} = fixture(); const x = a.geometry.x; translateNodes(p,[frame.id,a.id],10,20); expect(a.geometry.x).toBe(x); expect(frame.geometry.x).toBe(110); });
  it('resizes from the east and keeps west edge fixed', () => { const g = { x:10,y:10,width:100,height:60,rotation:0 }; const r = resizeGeometry(g,'e',50,0); expect(r).toEqual({...g,width:150}); });
  it('resizes from northwest keeping opposite corner fixed', () => { const g = { x:10,y:20,width:100,height:80,rotation:0 }; const r = resizeGeometry(g,'nw',20,10); expect(r).toEqual({...g,x:30,y:30,width:80,height:70}); });
  it('constrains aspect ratio and minimum dimensions', () => { const g = { x:0,y:0,width:100,height:50,rotation:0 }; const r = resizeGeometry(g,'se',50,0,true); expect(r.width/r.height).toBe(2); expect(resizeGeometry(g,'e',-1000,0).width).toBe(4); });
  it('resizes in a rotated local axis', () => { const g = { x:0,y:0,width:100,height:50,rotation:90 }; const r = resizeGeometry(g,'e',0,40); expect(r.width).toBeCloseTo(140); expect(r.height).toBe(50); });
  it('calculates rotation-aware world bounds', () => { const {p,a} = fixture(); a.geometry.rotation = 90; const r = worldRect(p,a.id); expect(r.width).toBeCloseTo(a.geometry.height); expect(r.height).toBeCloseTo(a.geometry.width); });
  it('recognizes overlap and bounds', () => { expect(intersects({x:0,y:0,width:10,height:10},{x:8,y:8,width:2,height:2})).toBe(true); expect(bounds([{x:10,y:10,width:10,height:10},{x:-10,y:0,width:10,height:40}])).toEqual({x:-10,y:0,width:30,height:40}); });
  it('inherits lock and visibility from ancestors', () => { const {p,frame,a} = fixture(); frame.locked = true; expect(isUnavailable(p,a.id)).toBe(true); expect(isHidden(p,a.id)).toBe(false); frame.locked = false; frame.hidden = true; expect(isUnavailable(p,a.id)).toBe(true); expect(isHidden(p,a.id)).toBe(true); });
  it('snaps movement to an 8 pixel grid', () => { const {p,a} = fixture(); const r = snapMove(p,[a.id],{x:3,y:4},true,false,1); expect((worldRect(p,a.id).x+r.delta.x)%8).toBe(0); expect((worldRect(p,a.id).y+r.delta.y)%8).toBe(0); });
  it('snaps to manual guides', () => { const p=createProject(); const n=createNode('shape',40,30); insertNode(p,n); p.guides.push({id:'g',axis:'x',position:100}); const result=snapMove(p,[n.id],{x:59,y:10},false,true,1); expect(result.delta.x).toBe(60); expect(result.guides).toContainEqual({axis:'x',position:100}); });
  it('aligns a single object to canvas and multiple objects to selection', () => { const {p,a,b} = fixture(); alignNodes(p,[a.id],'left'); expect(worldRect(p,a.id).x).toBeCloseTo(0); alignNodes(p,[a.id,b.id],'top'); expect(worldRect(p,a.id).y).toBeCloseTo(worldRect(p,b.id).y); });
  it('distributes objects with equal gaps', () => { const p=createProject(); const nodes=[0,70,200].map(x=>createNode('shape',x,0)); nodes.forEach(n=>{n.geometry.width=20;insertNode(p,n);}); distributeNodes(p,nodes.map(n=>n.id),'x'); expect(nodes[1].geometry.x).toBe(100); });
});
