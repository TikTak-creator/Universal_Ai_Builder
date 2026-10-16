import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createProject, parseProject, serializeProject } from '../model/document';
import { createNode } from '../registry/components';
import { insertNode } from '../engine/operations';
import { useEditor } from '../store/editor';
import { detectFontFormat, fontFamilyValue, loadFontAsset, mergeClipboardFonts, prepareFontFile, validateFontAssets, validFontWeight } from './fonts';

const fontBytes=Uint8Array.from(readFileSync(new URL('../../public/fonts/Manrope-Variable.ttf',import.meta.url)));
const fontFile=()=>new File([fontBytes],'Manrope.ttf',{type:'font/ttf'});
afterEach(()=>vi.unstubAllGlobals());
describe('Embedded font assets', () => {
  it('detects real font data and ignores unsupported binaries', () => {expect(detectFontFormat(fontBytes)).toBe('truetype');expect(detectFontFormat(new Uint8Array(20))).toBeNull();expect(detectFontFormat(new Uint8Array([1,2]))).toBeNull();});
  it('prepares a portable font with an isolated CSS family', async () => {
    const font=await prepareFontFile(fontFile());expect(font.dataUrl).toMatch(/^data:font\/ttf;base64,/);expect(font.family).toMatch(/^FormaFont_/);expect(fontFamilyValue(font)).toContain(font.family);expect(()=>validateFontAssets([font])).not.toThrow();
  });
  it('rejects files disguised as fonts and unsupported extensions', async () => {
    await expect(prepareFontFile(new File(['<script>bad</script>'],'bad.ttf'))).rejects.toThrow('не содержит');
    await expect(prepareFontFile(new File([fontBytes],'font.exe'))).rejects.toThrow('Поддерживаются');
  });
  it('enforces the individual file limit before reading', async () => {await expect(prepareFontFile(new File([new Uint8Array(4_000_001)],'big.ttf'))).rejects.toThrow('4 МБ');});
  it('preserves binary data and license through project JSON', async () => {
    const p=createProject();const font=await prepareFontFile(fontFile());font.license='SIL Open Font License';p.fonts.push(font);
    expect(parseProject(serializeProject(p)).fonts).toEqual(p.fonts);
  });
  it('blocks remote CSS font sources, duplicate families, and invalid weights', async () => {
    const font=await prepareFontFile(fontFile());expect(()=>validateFontAssets([{...font,dataUrl:'https://example.com/font.woff2'}])).toThrow();
    expect(()=>validateFontAssets([font,{...font,id:'other'}])).toThrow();expect(()=>validateFontAssets([{...font,weight:'999 100'}])).toThrow();
  });
  it('validates static and variable weight ranges', () => {expect(validFontWeight('400')).toBe(true);expect(validFontWeight('200 800')).toBe(true);expect(validFontWeight('900 100')).toBe(false);expect(validFontWeight('url(x)')).toBe(false);});
  it('merges a copied font once and resolves family collisions without changing existing nodes', async () => {
    const a=createProject();const font=await prepareFontFile(fontFile());a.fonts.push(font);const n=createNode('text');n.styles.fontFamily=fontFamilyValue(font);insertNode(a,n);
    const b=createProject();mergeClipboardFonts(b,a);mergeClipboardFonts(b,a);expect(b.fonts).toHaveLength(1);
    b.fonts[0].weight='700';mergeClipboardFonts(b,a);expect(b.fonts).toHaveLength(2);expect(a.nodes[n.id].styles.fontFamily).not.toBe(fontFamilyValue(font));expect(b.fonts[0].family).toBe(font.family);
  });
  it('carries embedded fonts through clipboard to a different project and supports undo', async () => {
    const font=await prepareFontFile(fontFile());const p=createProject();p.fonts.push(font);const n=createNode('text');n.styles.fontFamily=fontFamilyValue(font);insertNode(p,n);
    useEditor.setState({project:p,selection:[n.id],past:[],future:[],gesture:null,clipboard:null});useEditor.getState().copy();useEditor.getState().setProject(createProject('Other'));useEditor.getState().paste();
    expect(useEditor.getState().project.fonts).toEqual([font]);const id=useEditor.getState().selection[0];expect(useEditor.getState().project.nodes[id].styles.fontFamily).toBe(fontFamilyValue(font));useEditor.getState().undo();expect(useEditor.getState().project.fonts).toEqual([]);
  });
  it('caches decoded fonts and reports browser decoding failures', async () => {
    const load=vi.fn(function(this: unknown){return Promise.resolve(this);});
    vi.stubGlobal('FontFace',class {load=load;constructor(public family:string){}});const font=await prepareFontFile(fontFile());
    await loadFontAsset(font);await loadFontAsset({...font});expect(load).toHaveBeenCalledTimes(1);
    vi.stubGlobal('FontFace',class {load(){return Promise.reject(new Error('OTS'));}});const invalid={...font,id:'invalid'};await expect(loadFontAsset(invalid)).rejects.toThrow('не удалось загрузить');
  });
});
