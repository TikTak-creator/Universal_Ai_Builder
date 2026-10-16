import { SCHEMA_VERSION, uid } from './types';
import type { Project, ComponentType } from './types';
import { createNode, registry, isContainer } from '../registry/components';
import { extraStyleDefaults, validateCustomization } from './customization';
import { validateFontAssets } from '../assets/fonts';
import { findLibraryIcon } from '../assets/iconLibrary';

export function createProject(name = 'Новый проект'): Project {
  const date = new Date().toISOString();
  return { schemaVersion: SCHEMA_VERSION, id: uid(), name, createdAt: date, updatedAt: date, rootIds: [], nodes: {}, fonts: [], canvas: { width: 1120, height: 780, background: '#13151c' }, guides: [] };
}
export function createDemo(): Project {
  const p = createProject('Orbit · Creative workspace');
  p.canvas.height = 780;
  function add(type: ComponentType, name: string, x: number, y: number, width: number, height: number, text = '', parentId: string | null = null, style = {}) {
    const n = createNode(type, x, y, parentId); n.name = name; n.geometry.width = width; n.geometry.height = height;
    n.properties.text = text; Object.assign(n.styles, style); p.nodes[n.id] = n;
    (parentId ? p.nodes[parentId].children : p.rootIds).push(n.id); return n.id;
  }
  add('text', 'Логотип Orbit', 42, 32, 160, 40, '◈  orbit', null, { fontSize: 27, fontWeight: 700 });
  add('text', 'Навигация', 590, 40, 350, 30, 'Продукт       Возможности       Ресурсы', null, { fontSize: 13, color: '#9d9fac' });
  add('button', 'Войти', 966, 32, 112, 38, 'Войти ↗', null, { background: '#242731', borderWidth: 1 });
  add('divider', 'Линия навигации', 42, 94, 1036, 1);
  add('badge', 'Метка релиза', 42, 142, 207, 30, '✦  МЕСТО ДЛЯ ВАШИХ ИДЕЙ', null, { color: '#bbacf8', background: '#29223d', fontSize: 10, padding: 8 });
  add('text', 'Заголовок', 42, 191, 660, 150, 'Большие идеи.\nБезграничный холст.', null, { fontSize: 56, fontWeight: 650, lineHeight: 1.15 });
  add('text', 'Описание', 44, 355, 565, 64, 'Соберите мысли, найдите свой ритм и создайте\nчто-то особенное. Всё начинается с одного фрейма.', null, { fontSize: 17, color: '#9396a6', lineHeight: 1.7 });
  add('button', 'Основная кнопка', 44, 448, 194, 48, 'Создать пространство  ↗', null, { fontSize: 13 });
  add('text', 'Подпись к кнопке', 257, 460, 260, 26, 'Бесплатно. В вашем темпе.', null, { fontSize: 12, color: '#737889' });
  const art = add('frame', 'Композиция', 756, 155, 315, 340, '', null, { background: '#1c1c2c', borderRadius: 24, borderWidth: 1, borderColor: '#333043', overflow: 'hidden' });
  add('shape', 'Круг / лавандовый', 68, 48, 192, 192, '', art, { background: '#b7a1f4', borderRadius: 100 });
  const tile = add('shape', 'Квадрат / персиковый', 26, 152, 140, 140, '', art, { background: '#f2ba9b', borderRadius: 24 });
  p.nodes[tile].geometry.rotation = -14;
  const top = add('shape', 'Квадрат / лаймовый', 194, 28, 90, 90, '', art, { background: '#d4df98', borderRadius: 20 });
  p.nodes[top].geometry.rotation = 14;
  add('text', 'Символ композиции', 170, 193, 120, 108, '✳', art, { color: '#ece5ff', fontSize: 92, lineHeight: 1 });
  const cards = [
    { x: 42, title: '01   Поймайте идею', body: 'От первого наброска\nдо следующего большого шага.', symbol: '✧', color: '#b7a1f4' },
    { x: 396, title: '02   Найдите свой ритм', body: 'Инструменты, которые\nподстраиваются под вас.', symbol: '⌘', color: '#f2ba9b' },
    { x: 750, title: '03   Создавайте вместе', body: 'Одно пространство.\nБесконечные возможности.', symbol: '↗', color: '#d4df98' },
  ];
  for (const c of cards) {
    const card = add('container', c.title.slice(5), c.x, 552, 328, 181, '', null, { background: '#1b1e27', borderRadius: 14, borderColor: '#30333e' });
    add('text', 'Символ', 22, 16, 60, 40, c.symbol, card, { color: c.color, fontSize: 30 });
    add('text', 'Название карточки', 22, 70, 284, 30, c.title, card, { fontSize: 16, fontWeight: 600 });
    add('text', 'Текст карточки', 22, 111, 284, 50, c.body, card, { fontSize: 13, color: '#8a8f9f', lineHeight: 1.6 });
  }
  return p;
}

// Upgrade v1 documents before validation; untouched geometry and original styles are preserved.
export function parseProject(input: string): Project {
  if (input.length > 25_000_000) throw new Error('Файл слишком большой. Максимум — 25 МБ.');
  const raw: unknown = JSON.parse(input);
  if (!raw || typeof raw !== 'object') throw new Error('Некорректный файл проекта.');
  const p = raw as Project;
  const sourceVersion = (raw as { schemaVersion?: unknown }).schemaVersion ?? 1;
  if (sourceVersion !== 1 && sourceVersion !== SCHEMA_VERSION) throw new Error('Версия проекта не поддерживается этим редактором.');
  if (typeof p.id !== 'string' || typeof p.name !== 'string' || !p.nodes || typeof p.nodes !== 'object' || Array.isArray(p.nodes) || !Array.isArray(p.rootIds) || !p.canvas) throw new Error('В файле отсутствуют обязательные поля.');
  if (!Number.isFinite(p.canvas.width) || !Number.isFinite(p.canvas.height) || p.canvas.width < 1 || p.canvas.height < 1 || p.canvas.width > 10000 || p.canvas.height > 10000 || typeof p.canvas.background !== 'string') throw new Error('Некорректный размер холста.');
  if (Object.keys(p.nodes).length > 5000) throw new Error('Максимум — 5000 компонентов.');
  if (sourceVersion === 1) {
    p.fonts ??= [];
    for (const n of Object.values(p.nodes)) {
      if (!n || typeof n !== 'object') continue;
      if (n.styles && typeof n.styles === 'object') n.styles = { ...extraStyleDefaults(), ...n.styles };
      if (n.properties && typeof n.properties === 'object') n.properties = Object.assign({ iconName: 'sparkles', iconStrokeWidth: 1.75, iconFlipX: false, iconFlipY: false }, n.properties);
    }
  }
  p.schemaVersion = SCHEMA_VERSION;
  validateFontAssets(p.fonts);
  p.guides ??= [];
  if (!Array.isArray(p.guides) || p.guides.some(g => !g || !['x', 'y'].includes(g.axis) || !Number.isFinite(g.position))) throw new Error('Некорректные направляющие.');
  const seen = new Set<string>();
  function visit(id: string, parent: string | null, depth: number) {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(id) || ['__proto__','constructor','prototype'].includes(id)) throw new Error('Некорректный ID компонента.');
    if (depth >= 100 || seen.has(id)) throw new Error('Превышена глубина вложенности, обнаружен цикл или повтор компонента.');
    const n = p.nodes[id];
    if (!n || n.id !== id || n.parentId !== parent || !registry.some(d => d.type === n.type)) throw new Error('Нарушена структура компонентов.');
    if (!Array.isArray(n.children) || !n.geometry || !n.styles || !n.properties || !n.layout || typeof n.name !== 'string') throw new Error('Неполные данные компонента.');
    if (n.children.length && !isContainer(n)) throw new Error('Компонент не поддерживает вложенность.');
    if (Object.values(n.geometry).some(v => typeof v !== 'number' || !Number.isFinite(v)) || n.geometry.width < 1 || n.geometry.height < 1 || !['x','y','width','height','rotation'].every(k => k in n.geometry)) throw new Error('Некорректная геометрия компонента.');
    if (!['text','src','placeholder','alt'].every(k => typeof n.properties[k as keyof typeof n.properties] === 'string') || !Array.isArray(n.properties.options) || n.properties.options.some(v => typeof v !== 'string') || !['free','flex','grid'].includes(n.layout.mode)) throw new Error('Некорректные свойства компонента.');
    if (n.layout.mode !== 'free') throw new Error('Phase 1 поддерживает только Free Design. Flexbox и Grid появятся на Phase 2.');
    if (!['background','color','borderColor','fontFamily'].every(k => typeof n.styles[k as keyof typeof n.styles] === 'string') || !['borderWidth','borderRadius','opacity','fontSize','fontWeight','lineHeight','padding'].every(k => typeof n.styles[k as keyof typeof n.styles] === 'number' && Number.isFinite(n.styles[k as keyof typeof n.styles]))) throw new Error('Некорректные стили компонента.');
    if (n.styles.opacity < 0 || n.styles.opacity > 1 || n.styles.fontSize < 1 || n.styles.padding < 0 || n.styles.borderWidth < 0 || n.styles.borderRadius < 0 || !['left','center','right'].includes(n.styles.textAlign) || !['visible','hidden','auto'].includes(n.styles.overflow)) throw new Error('Некорректные значения стилей.');
    validateCustomization(n.styles);
    if (n.type === 'icon' && (!findLibraryIcon(n.properties.iconName) || typeof n.properties.iconStrokeWidth !== 'number' || !Number.isFinite(n.properties.iconStrokeWidth) || n.properties.iconStrokeWidth < 0.5 || n.properties.iconStrokeWidth > 4 || typeof n.properties.iconFlipX !== 'boolean' || typeof n.properties.iconFlipY !== 'boolean')) throw new Error('Некорректная иконка.');
    n.responsiveOverrides ??= {}; n.states ??= {}; n.events ??= []; n.animations ??= []; n.dataBindings ??= {};
    if (!Array.isArray(n.events) || !Array.isArray(n.animations)) throw new Error('Некорректные события или анимации.');
    n.hidden = !!n.hidden; n.locked = !!n.locked;
    seen.add(id); n.children.forEach(child => visit(child, id, depth + 1));
  }
  p.rootIds.forEach(id => visit(id, null, 0));
  if (seen.size !== Object.keys(p.nodes).length) throw new Error('В проекте есть компоненты без родителя.');
  return p;
}
export const serializeProject = (p: Project) => JSON.stringify(p, null, 2);
