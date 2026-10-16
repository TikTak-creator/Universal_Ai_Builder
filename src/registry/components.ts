import { uid } from '../model/types';
import type { ComponentType, UINode } from '../model/types';
import { extraStyleDefaults } from '../model/customization';

export type Definition = { type: ComponentType; label: string; category: string; icon: string; width: number; height: number; acceptsChildren?: boolean; text?: string };
export const registry: Definition[] = [
  { type: 'frame', label: 'Фрейм', category: 'Структура', icon: 'frame', width: 360, height: 260, acceptsChildren: true },
  { type: 'container', label: 'Контейнер', category: 'Структура', icon: 'layout', width: 280, height: 180, acceptsChildren: true },
  { type: 'text', label: 'Текст', category: 'Базовые', icon: 'text', width: 240, height: 48, text: 'Новая идея начинается здесь' },
  { type: 'image', label: 'Изображение', category: 'Базовые', icon: 'image', width: 260, height: 180 },
  { type: 'icon', label: 'Иконка', category: 'Базовые', icon: 'sparkles', width: 48, height: 48 },
  { type: 'shape', label: 'Фигура', category: 'Базовые', icon: 'square', width: 120, height: 120 },
  { type: 'line', label: 'Линия', category: 'Базовые', icon: 'minus', width: 220, height: 2 },
  { type: 'divider', label: 'Разделитель', category: 'Базовые', icon: 'minus', width: 280, height: 1 },
  { type: 'button', label: 'Кнопка', category: 'Формы', icon: 'button', width: 156, height: 44, text: 'Продолжить →' },
  { type: 'input', label: 'Поле ввода', category: 'Формы', icon: 'input', width: 260, height: 44 },
  { type: 'textarea', label: 'Текстовая область', category: 'Формы', icon: 'text', width: 280, height: 100 },
  { type: 'checkbox', label: 'Чекбокс', category: 'Формы', icon: 'check', width: 220, height: 30, text: 'Я согласен с условиями' },
  { type: 'select', label: 'Список', category: 'Формы', icon: 'list', width: 240, height: 44 },
  { type: 'badge', label: 'Бейдж', category: 'Данные', icon: 'badge', width: 100, height: 28, text: 'НОВОЕ' },
];
export const definition = (type: ComponentType) => registry.find(d => d.type === type)!;
export const isContainer = (node?: UINode) => !!node && !!definition(node.type).acceptsChildren;
export function createNode(type: ComponentType, x = 40, y = 40, parentId: string | null = null): UINode {
  const d = definition(type);
  const transparent = ['text', 'checkbox', 'icon'].includes(type);
  return {
    id: uid(), type, name: d.label, parentId, children: [], hidden: false, locked: false,
    geometry: { x, y, width: d.width, height: d.height, rotation: 0 },
    properties: { text: d.text ?? '', src: '', alt: 'Изображение', placeholder: 'Введите значение…', checked: false, options: ['Первый вариант', 'Второй вариант', 'Третий вариант'], iconName: 'sparkles', iconStrokeWidth: 1.75, iconFlipX: false, iconFlipY: false },
    styles: {
      ...extraStyleDefaults(),
      background: transparent ? 'transparent' : ['line', 'divider'].includes(type) ? '#343743' : type === 'button' ? '#8b78f0' : type === 'shape' ? '#b4a6fb' : '#20232e',
      color: '#f5f4fb', borderColor: '#353945', borderWidth: ['input', 'textarea', 'select', 'container'].includes(type) ? 1 : 0,
      borderRadius: ['line', 'divider', 'text'].includes(type) ? 0 : type === 'badge' ? 24 : 10,
      opacity: 1, fontSize: type === 'text' ? 20 : 14, fontWeight: ['button', 'badge'].includes(type) ? 600 : 400,
      fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'left', lineHeight: 1.5,
      padding: ['button', 'input', 'textarea', 'select', 'badge'].includes(type) ? 12 : 0, overflow: 'visible',
    },
    layout: { mode: 'free', direction: 'column', gap: 16, columns: 2, align: 'stretch', justify: 'start' },
    responsiveOverrides: {}, states: {}, events: [], animations: [], dataBindings: {},
  };
}
