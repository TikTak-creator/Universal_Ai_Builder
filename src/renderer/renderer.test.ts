import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createProject } from '../model/document';
import { createNode, registry } from '../registry/components';
import { insertNode } from '../engine/operations';
import { NodeRenderer, nodeStyle, safeSource } from './NodeRenderer';
describe('Shared canvas and preview renderer', () => {
  it('renders every supported component', () => {
    registry.forEach(d=>{const p=createProject(); const n=createNode(d.type); insertNode(p,n); expect(renderToStaticMarkup(createElement(NodeRenderer,{project:p,id:n.id,preview:true}))).toContain(`data-node-id="${n.id}"`);});
  });
  it('escapes user text rather than interpreting HTML', () => {
    const p=createProject(); const n=createNode('text'); n.properties.text='<script>alert(1)</script>'; insertNode(p,n);
    expect(renderToStaticMarkup(createElement(NodeRenderer,{project:p,id:n.id}))).toContain('&lt;script&gt;');
  });
  it('excludes hidden nodes and their descendants', () => {const p=createProject();const n=createNode('frame');n.hidden=true;insertNode(p,n);expect(renderToStaticMarkup(createElement(NodeRenderer,{project:p,id:n.id}))).toBe('');});
  it('blocks executable image source schemes', () => { expect(safeSource('javascript:alert(1)')).toBe(''); expect(safeSource('data:text/html,<script>')).toBe(''); expect(safeSource('data:image/png;base64,AAAA')).not.toBe(''); });
  it('applies corners, gradients, shadows, and typography to the actual renderer', () => {
    const n=createNode('shape');n.styles.cornerRadii={topLeft:4,topRight:20,bottomRight:8,bottomLeft:28};n.styles.gradient={type:'radial',from:'#fff',to:'#000',angle:0};n.styles.fontStyle='italic';n.styles.blur=2;
    n.styles.shadows=[{id:'s',x:0,y:10,blur:30,spread:0,color:'#000000',opacity:.5,inset:false}];
    const style=nodeStyle(n);expect(style.borderRadius).toBe('4px 20px 8px 28px');expect(style.background).toContain('radial-gradient');expect(style.boxShadow).toContain('0px 10px 30px');expect(style.fontStyle).toBe('italic');expect(style.filter).toBe('blur(2px)');
  });
});
