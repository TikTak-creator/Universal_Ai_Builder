import { useEffect, useState } from 'react';
import { ArrowLeft, Monitor, RefreshCw } from 'lucide-react';
import { useEditor } from '../store/editor';
import { NodeRenderer } from '../renderer/NodeRenderer';
export function Preview() {
  const project = useEditor(s => s.project); const [key, setKey] = useState(0); const [fit, setFit] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const resize = () => setWindowWidth(window.innerWidth); const key = (e: KeyboardEvent) => { if (e.key === 'Escape') useEditor.setState({ preview: false }); };
    window.addEventListener('resize', resize); window.addEventListener('keydown', key); return () => { window.removeEventListener('resize', resize); window.removeEventListener('keydown', key); };
  }, []);
  const scale = fit ? Math.min(1, (windowWidth - 100) / project.canvas.width) : 1;
  return <div className="preview-overlay"><header><button className="soft-button" onClick={() => useEditor.setState({ preview: false })}><ArrowLeft size={15} />В редактор</button><div className="preview-title"><Monitor size={15} /><span>{project.name}</span><span className="tiny-tag">ПРЕДПРОСМОТР МАКЕТА</span></div><button className="icon-button" aria-label="Перезапустить предпросмотр" onClick={() => setKey(k => k + 1)}><RefreshCw size={15} /></button><button className="soft-button" onClick={() => setFit(v => !v)}>{fit ? 'Масштаб 100%' : 'По ширине'}</button></header><div className="preview-scroll"><div className="preview-surface" style={{ width: project.canvas.width * scale, height: project.canvas.height * scale }}><div key={key} style={{ position: 'relative', width: project.canvas.width, height: project.canvas.height, background: project.canvas.background, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{project.rootIds.map(id => <NodeRenderer key={id} project={project} id={id} preview />)}</div></div><p className="preview-caption">Фиксированный холст · {project.canvas.width} × {project.canvas.height} px · формы поддерживают ввод. Логика событий появится на Phase 3.</p></div></div>;
}
