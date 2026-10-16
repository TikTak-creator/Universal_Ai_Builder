import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { Project, UINode } from '../model/types';
import { cornerCSS, gradientCSS, shadowsCSS } from '../model/customization';
import { findLibraryIcon } from '../assets/iconLibrary';

export function nodeStyle(n: UINode): CSSProperties {
  const { geometry: g, styles: s } = n;
  return {
    position: 'absolute', left: g.x, top: g.y, width: g.width, height: g.height,
    transform: `rotate(${g.rotation}deg)`, transformOrigin: 'center', boxSizing: 'border-box',
    background: s.gradient ? gradientCSS(s.gradient) : s.background, color: s.color, boxShadow: shadowsCSS(s.shadows) || undefined,
    borderRadius: cornerCSS(s), opacity: s.opacity, fontSize: s.fontSize, fontWeight: s.fontWeight,
    fontFamily: s.fontFamily, textAlign: s.textAlign, lineHeight: s.lineHeight, padding: s.padding,
    overflow: s.overflow, whiteSpace: 'pre-wrap',
    letterSpacing: s.letterSpacing, fontStyle: s.fontStyle, textDecoration: s.textDecoration, textTransform: s.textTransform,
    filter: s.blur ? `blur(${s.blur}px)` : undefined, backdropFilter: s.backdropBlur ? `blur(${s.backdropBlur}px)` : undefined, mixBlendMode: s.blendMode,
  };
}
export function safeSource(src: string) { return /^(data:image\/(png|jpeg|jpg|gif|webp|avif|svg\+xml);|https?:\/\/|blob:)/i.test(src) ? src : ''; }
function Content({ node: n, preview }: { node: UINode; preview: boolean }): ReactNode {
  const p = n.properties;
  const common = { tabIndex: preview ? 0 : -1, style: { color: 'inherit', font: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', textDecoration: 'inherit', textAlign: n.styles.textAlign, width: '100%', height: '100%', background: 'transparent', border: 0, outline: 'none', padding: 0 } as CSSProperties };
  switch (n.type) {
    case 'text': return p.text;
    case 'image': return safeSource(p.src) ? <img src={safeSource(p.src)} alt={p.alt} draggable={false} style={{ width: '100%', height: '100%', objectFit: n.styles.objectFit, borderRadius: 'inherit', display: 'block' }} /> : <div className="image-placeholder"><ImageIcon size={32} /><span>Изображение</span></div>;
    case 'icon': { const Icon = findLibraryIcon(p.iconName)?.Component; return Icon ? <Icon role="img" aria-label={n.name} width="100%" height="100%" strokeWidth={p.iconStrokeWidth} style={{ display: 'block', transform: `scale(${p.iconFlipX ? -1 : 1}, ${p.iconFlipY ? -1 : 1})` }} /> : null; }
    case 'button': return <button {...common} type="button" style={{ ...common.style, textAlign: 'center', cursor: preview ? 'pointer' : 'inherit' }}>{p.text}</button>;
    case 'input': return <input {...common} aria-label={n.name} placeholder={p.placeholder} readOnly={!preview} />;
    case 'textarea': return <textarea {...common} aria-label={n.name} placeholder={p.placeholder} readOnly={!preview} style={{ ...common.style, resize: 'none' }} />;
    case 'checkbox': return <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: '100%' }}><input type="checkbox" tabIndex={preview ? 0 : -1} defaultChecked={p.checked} disabled={!preview} style={{ accentColor: '#a18cf4' }} />{p.text}</label>;
    case 'select': return <select {...common} aria-label={n.name} disabled={!preview}>{p.options.map((o, i) => <option key={i} style={{ background: '#20232e' }}>{o}</option>)}</select>;
    case 'badge': return <span style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>{p.text}</span>;
    default: return null;
  }
}
type Props = { project: Project; id: string; preview?: boolean; onNodePointerDown?: (e: PointerEvent, id: string) => void; onNodeDoubleClick?: (id: string) => void };
export function NodeRenderer({ project, id, preview = false, onNodePointerDown, onNodeDoubleClick }: Props) {
  const n = project.nodes[id]; if (!n || n.hidden) return null;
  return <div data-node-id={id} data-node-name={n.name} style={nodeStyle(n)} className={preview ? 'render-node' : 'render-node editing-node'}
    onPointerDown={e => onNodePointerDown?.(e, id)} onDoubleClick={e => { if (!preview) { e.stopPropagation(); onNodeDoubleClick?.(id); } }}>
    <div className="node-content" style={{ width: '100%', height: '100%', pointerEvents: preview ? 'auto' : 'none', textDecoration: 'inherit', borderRadius: 'inherit' }}><Content node={n} preview={preview} /></div>
    {n.children.map(child => <NodeRenderer key={child} project={project} id={child} preview={preview} onNodePointerDown={onNodePointerDown} onNodeDoubleClick={onNodeDoubleClick} />)}
    {n.styles.borderWidth > 0 && <div aria-hidden="true" className="node-border" style={{ position: 'absolute', inset: 0, border: `${n.styles.borderWidth}px ${n.styles.borderStyle} ${n.styles.borderColor}`, borderRadius: 'inherit', pointerEvents: 'none' }} />}
  </div>;
}
