export const SCHEMA_VERSION = 2 as const;
export type ComponentType = 'frame' | 'container' | 'text' | 'image' | 'icon' | 'shape' | 'line' | 'button' | 'input' | 'textarea' | 'checkbox' | 'select' | 'badge' | 'divider';
export type Corners = { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number };
export type Gradient = { type: 'linear' | 'radial' | 'conic'; from: string; to: string; angle: number };
export type Shadow = { id: string; x: number; y: number; blur: number; spread: number; color: string; opacity: number; inset: boolean };
export type NodeStyles = {
  background: string; color: string; borderColor: string; borderWidth: number;
  borderRadius: number; opacity: number; fontSize: number; fontWeight: number;
  fontFamily: string; textAlign: 'left' | 'center' | 'right'; lineHeight: number;
  padding: number; overflow: 'visible' | 'hidden' | 'auto';
  cornerRadii: Corners | null; gradient: Gradient | null; shadows: Shadow[];
  blur: number; backdropBlur: number; blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
  letterSpacing: number; fontStyle: 'normal' | 'italic'; textDecoration: 'none' | 'underline' | 'line-through';
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'; borderStyle: 'solid' | 'dashed' | 'dotted';
  objectFit: 'cover' | 'contain' | 'fill' | 'scale-down';
};
export type Geometry = { x: number; y: number; width: number; height: number; rotation: number };
export type NodeProperties = { text: string; src: string; placeholder: string; options: string[]; checked: boolean; alt: string; iconName: string; iconStrokeWidth: number; iconFlipX: boolean; iconFlipY: boolean };
export type FontAsset = { id: string; name: string; family: string; dataUrl: string; format: 'truetype' | 'opentype' | 'woff' | 'woff2'; weight: string; style: 'normal' | 'italic'; license?: string };
export type Layout = { mode: 'free' | 'flex' | 'grid'; direction: 'row' | 'column'; gap: number; columns: number; align: 'start' | 'center' | 'end' | 'stretch'; justify: 'start' | 'center' | 'end' | 'space-between' };
export type UINode = {
  id: string; type: ComponentType; name: string; parentId: string | null; children: string[];
  geometry: Geometry; properties: NodeProperties; styles: NodeStyles; layout: Layout;
  hidden: boolean; locked: boolean;
  responsiveOverrides: Record<string, Partial<Geometry>>;
  states: Record<string, Record<string, unknown>>;
  events: unknown[]; animations: unknown[]; dataBindings: Record<string, unknown>;
};
export type Project = {
  schemaVersion: typeof SCHEMA_VERSION; id: string; name: string; createdAt: string; updatedAt: string;
  rootIds: string[]; nodes: Record<string, UINode>;
  fonts: FontAsset[];
  canvas: { width: number; height: number; background: string };
  guides: { id: string; axis: 'x' | 'y'; position: number }[];
};
export type Rect = { x: number; y: number; width: number; height: number };
export type Alignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export const clone = <T>(value: T): T => structuredClone(value);
export const uid = () => crypto.randomUUID();
