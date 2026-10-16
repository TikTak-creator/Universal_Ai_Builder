import { describe, expect, it } from 'vitest';
import { createNode } from '../registry/components';
import { createProject, parseProject, serializeProject } from './document';
import { insertNode } from '../engine/operations';
import { cornerCSS, gradientCSS, shadowsCSS } from './customization';
import { useEditor } from '../store/editor';
describe('Visual customization persistence and history', () => {
  it('preserves independent corner order through JSON', () => {
    const p=createProject();const n=createNode('shape');n.styles.cornerRadii={topLeft:4,topRight:18,bottomRight:36,bottomLeft:2};insertNode(p,n);
    expect(cornerCSS(parseProject(serializeProject(p)).nodes[n.id].styles)).toBe('4px 18px 36px 2px');
  });
  it('keeps the original uniform radius when independent corners are disabled', () => {
    const n=createNode('shape');n.styles.borderRadius=25;expect(cornerCSS(n.styles)).toBe('25px');
  });
  it('serializes all gradient variants explicitly', () => {
    for(const type of ['linear','radial','conic'] as const){const p=createProject();const n=createNode('shape');n.styles.gradient={type,from:'#a18af2',to:'#f4b8ba',angle:135};insertNode(p,n);expect(gradientCSS(parseProject(serializeProject(p)).nodes[n.id].styles.gradient!)).toContain(`${type}-gradient`);}
  });
  it('preserves multiple outer and inner shadows', () => {
    const p=createProject();const n=createNode('frame');n.styles.shadows=[{id:'a',x:2,y:8,blur:20,spread:-2,color:'#000000',opacity:.4,inset:false},{id:'b',x:0,y:0,blur:8,spread:0,color:'#a18af2',opacity:.7,inset:true}];insertNode(p,n);
    const result=shadowsCSS(parseProject(serializeProject(p)).nodes[n.id].styles.shadows);expect(result).toContain('2px 8px 20px -2px');expect(result).toContain('inset 0px 0px 8px');expect(result).toContain('70%');
  });
  it('undoes and redoes one corner change without resetting other corners', () => {
    useEditor.setState({project:createProject(),past:[],future:[],selection:[],gesture:null});const s=useEditor.getState();s.add('shape');const id=useEditor.getState().selection[0];
    s.updateNode(id,{},'styles',{cornerRadii:{topLeft:10,topRight:20,bottomRight:30,bottomLeft:40}});
    s.beginGesture();s.updateNode(id,{},'styles',{cornerRadii:{topLeft:50,topRight:20,bottomRight:30,bottomLeft:40}});s.endGesture();
    s.undo();expect(useEditor.getState().project.nodes[id].styles.cornerRadii?.topLeft).toBe(10);s.redo();expect(useEditor.getState().project.nodes[id].styles.cornerRadii?.bottomRight).toBe(30);
  });
  it('rejects invalid corners and unbounded filters on import', () => {
    const p=createProject();const n=createNode('shape');insertNode(p,n);n.styles.cornerRadii={topLeft:-1,topRight:0,bottomRight:0,bottomLeft:0};expect(()=>parseProject(serializeProject(p))).toThrow('углов');
    n.styles.cornerRadii=null;n.styles.blur=101;expect(()=>parseProject(serializeProject(p))).toThrow('эффекты');
  });
  it('rejects unsupported gradient and shadow data', () => {
    const p=createProject();const n=createNode('shape');insertNode(p,n);n.styles.gradient={type:'linear',from:'#fff',to:'#000',angle:999999};expect(()=>parseProject(serializeProject(p))).toThrow('градиент');n.styles.gradient=null;
    n.styles.shadows=[{id:'a',x:0,y:0,blur:-10,spread:0,color:'#000',opacity:1,inset:false}];expect(()=>parseProject(serializeProject(p))).toThrow('тени');
  });
  it('retains typography, blend, border, and image sizing settings', () => {
    const p=createProject();const n=createNode('image');Object.assign(n.styles,{fontStyle:'italic',textDecoration:'underline',textTransform:'uppercase',letterSpacing:2.5,blendMode:'screen',borderStyle:'dashed',objectFit:'contain',backdropBlur:12});insertNode(p,n);expect(parseProject(serializeProject(p)).nodes[n.id].styles).toEqual(n.styles);
  });
});
