import { parseProject, serializeProject } from '../model/document';
import type { Project } from '../model/types';
const DB_NAME = 'forma-ui-builder';
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { request.result.createObjectStore('projects', { keyPath: 'id' }); request.result.createObjectStore('settings'); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB недоступна.'));
  });
}
async function transaction<T>(stores: string[], mode: IDBTransactionMode, work: (tx: IDBTransaction) => IDBRequest<T>): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, mode); let result: T;
    const request = work(tx); request.onsuccess = () => { result = request.result; };
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error('Ошибка локального хранилища.')); };
    tx.onabort = () => { db.close(); reject(tx.error ?? new Error('Запись отменена.')); };
  });
}
export async function saveProject(p: Project) {
  await transaction(['projects', 'settings'], 'readwrite', tx => {
    tx.objectStore('settings').put(p.id, 'lastProject');
    return tx.objectStore('projects').put({ id: p.id, name: p.name, updatedAt: p.updatedAt, document: serializeProject(p) });
  });
}
export async function loadProject(id: string): Promise<Project | null> {
  const record = await transaction(['projects'], 'readonly', tx => tx.objectStore('projects').get(id));
  return record ? parseProject(record.document) : null;
}
export async function loadLastProject() {
  const id = await transaction(['settings'], 'readonly', tx => tx.objectStore('settings').get('lastProject'));
  return id ? loadProject(id) : null;
}
export async function listProjects(): Promise<{ id: string; name: string; updatedAt: string }[]> {
  const records = await transaction(['projects'], 'readonly', tx => tx.objectStore('projects').getAll());
  return records.map(({ id, name, updatedAt }) => ({ id, name, updatedAt })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function deleteProject(id: string) { await transaction(['projects'], 'readwrite', tx => tx.objectStore('projects').delete(id)); }
