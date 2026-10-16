import { useEffect } from 'react';
import { useEditor } from '../store/editor';
import { loadLastProject, saveProject } from '../storage/projects';
let queue = Promise.resolve();
export function persistNow() {
  const { project, revision } = useEditor.getState();
  useEditor.setState({ saving: true });
  const operation = queue.catch(() => {}).then(() => saveProject(project)).then(() => {
    if (useEditor.getState().project.id === project.id) useEditor.setState({ savedRevision: revision, saveError: '' });
  }).catch((e: unknown) => { useEditor.setState({ saveError: e instanceof Error ? e.message : 'Не удалось сохранить проект.' }); throw e; }).finally(() => useEditor.setState({ saving: false }));
  queue = operation.catch(() => {}); return operation;
}
export function usePersistence() {
  const revision = useEditor(s => s.revision); const ready = useEditor(s => s.ready); const gesture = useEditor(s => !!s.gesture);
  useEffect(() => {
    if (useEditor.getState().ready) return;
    let active = true;
    void loadLastProject().then(p => {
      if (!active) return;
      if (p) { useEditor.getState().setProject(p); useEditor.setState({ savedRevision: useEditor.getState().revision }); }
    }).catch((e: unknown) => { if (active) useEditor.setState({ saveError: e instanceof Error ? e.message : 'Хранилище недоступно.' }); }).finally(() => { if (active) useEditor.setState({ ready: true }); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!ready || gesture || revision === useEditor.getState().savedRevision) return;
    const timer = window.setTimeout(() => { void persistNow().catch(() => {}); }, 700);
    return () => clearTimeout(timer);
  }, [revision, ready, gesture]);
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => { const s = useEditor.getState(); if (s.revision !== s.savedRevision) { e.preventDefault(); } };
    window.addEventListener('beforeunload', beforeUnload); return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);
}
