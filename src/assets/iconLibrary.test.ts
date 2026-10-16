import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { findLibraryIcon, iconLibrary, searchIcons } from './iconLibrary';
import { createProject, parseProject, serializeProject } from '../model/document';
import { createNode } from '../registry/components';
import { insertNode } from '../engine/operations';
import { NodeRenderer } from '../renderer/NodeRenderer';
describe('Offline Lucide catalogue', () => {
  it('has 120 unique working vector icons in six categories', () => {
    expect(iconLibrary).toHaveLength(120);expect(new Set(iconLibrary.map(i=>i.id)).size).toBe(120);expect(new Set(iconLibrary.map(i=>i.category)).size).toBe(6);
    iconLibrary.forEach(icon=>expect(renderToStaticMarkup(createElement(icon.Component))).toContain('<svg'));
  });
  it('searches Russian and English labels and filters categories', () => {
    expect(searchIcons('сердце').map(i=>i.id)).toEqual(['heart']);expect(searchIcons('rocket').map(i=>i.id)).toEqual(['rocket']);
    expect(searchIcons('', 'Творчество')).toHaveLength(20);expect(searchIcons('nothing-found')).toEqual([]);
  });
  it('restores icon selection, stroke, color, and flips', () => {
    const p=createProject();const n=createNode('icon');Object.assign(n.properties,{iconName:'heart',iconStrokeWidth:2.5,iconFlipX:true});n.styles.color='#f5b5cf';insertNode(p,n);
    const result=parseProject(serializeProject(p));expect(result.nodes[n.id]).toEqual(n);
    const html=renderToStaticMarkup(createElement(NodeRenderer,{project:result,id:n.id,preview:true}));expect(html).toContain('lucide-heart');expect(html).toContain('stroke-width="2.5"');expect(html).toContain('scale(-1, 1)');
  });
  it('rejects unknown icons instead of rendering a fake component', () => {
    expect(findLibraryIcon('does-not-exist')).toBeUndefined();const p=createProject();const n=createNode('icon');n.properties.iconName='does-not-exist';insertNode(p,n);expect(()=>parseProject(serializeProject(p))).toThrow('иконка');
  });
});
