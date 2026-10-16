import { uid } from '../model/types';
import type { FontAsset, Project } from '../model/types';

export const FONT_LIMIT = 4_000_000;
export const FONT_TOTAL_LIMIT = 16_000_000;
export const fontFamilyValue = (font: FontAsset) => `"${font.family}", system-ui, sans-serif`;
export function detectFontFormat(bytes: Uint8Array): FontAsset['format'] | null {
  if (bytes.length < 12) return null;
  const signature = String.fromCharCode(...bytes.slice(0, 4));
  if (signature === 'wOF2') return 'woff2'; if (signature === 'wOFF') return 'woff'; if (signature === 'OTTO') return 'opentype';
  if ((bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0) || signature === 'true') return 'truetype';
  return null;
}
const mime = { truetype: 'ttf', opentype: 'otf', woff: 'woff', woff2: 'woff2' } as const;
export async function prepareFontFile(file: File): Promise<FontAsset> {
  if (!/\.(ttf|otf|woff2?)$/i.test(file.name)) throw new Error('Поддерживаются TTF, OTF, WOFF и WOFF2.');
  if (file.size > FONT_LIMIT) throw new Error('Один шрифт должен быть не больше 4 МБ.');
  const bytes = new Uint8Array(await file.arrayBuffer()); const format = detectFontFormat(bytes);
  if (!format) throw new Error('Файл не содержит поддерживаемый шрифт.');
  let binary = ''; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  const id = uid();
  return { id, name: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').slice(0, 80), family: `FormaFont_${id.replace(/-/g, '')}`, format, dataUrl: `data:font/${mime[format]};base64,${btoa(binary)}`, weight: '400', style: 'normal' };
}
export function validFontWeight(weight: string) {
  if (!/^\d{3}( \d{3})?$/.test(weight)) return false;
  const [min, max = min] = weight.split(' ').map(Number); return min >= 100 && max <= 900 && min <= max;
}
export function validateFontAssets(fonts: FontAsset[]) {
  if (!Array.isArray(fonts) || fonts.length > 30) throw new Error('Максимум — 30 шрифтов в проекте.');
  let total = 0; const ids = new Set<string>(); const families = new Set<string>();
  for (const font of fonts) {
    if (!font || typeof font.id !== 'string' || !/^[\w-]{1,100}$/.test(font.id) || ids.has(font.id) || typeof font.name !== 'string' || typeof font.family !== 'string' || !/^FormaFont_[a-zA-Z0-9_]{1,100}$/.test(font.family) || families.has(font.family) || !Object.keys(mime).includes(font.format) || !['normal','italic'].includes(font.style) || typeof font.weight !== 'string' || !validFontWeight(font.weight) || typeof font.dataUrl !== 'string') throw new Error('Некорректные данные шрифта.');
    const match = /^data:font\/(ttf|otf|woff|woff2);base64,([A-Za-z0-9+/]+={0,2})$/.exec(font.dataUrl);
    if (!match || match[1] !== mime[font.format] || match[2].length % 4 !== 0 || match[2].length > Math.ceil(FONT_LIMIT / 3) * 4) throw new Error('Некорректный или слишком большой файл шрифта.');
    const header = Uint8Array.from(atob(match[2].slice(0, 24)), c => c.charCodeAt(0));
    if (detectFontFormat(header) !== font.format) throw new Error('Формат шрифта не совпадает с содержимым.');
    const bytes = match[2].length * 3 / 4 - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0);
    if (bytes > FONT_LIMIT || (font.license !== undefined && (typeof font.license !== 'string' || font.license.length > 20000))) throw new Error('Некорректный объём данных шрифта.');
    total += bytes; ids.add(font.id); families.add(font.family);
  }
  if (total > FONT_TOTAL_LIMIT) throw new Error('Общий объём шрифтов — не больше 16 МБ.');
}
export function mergeClipboardFonts(destination: Project, source: Project) {
  for (const font of source.fonts) {
    const same = destination.fonts.find(f => f.family === font.family && f.dataUrl === font.dataUrl && f.weight === font.weight && f.style === font.style);
    if (same) continue;
    const asset = structuredClone(font);
    if (destination.fonts.some(f => f.id === asset.id || f.family === asset.family)) {
      asset.id = uid(); asset.family = `FormaFont_${asset.id.replace(/-/g, '')}`;
      Object.values(source.nodes).forEach(n => { n.styles.fontFamily = n.styles.fontFamily.replaceAll(font.family, asset.family); });
    }
    destination.fonts.push(asset);
  }
  validateFontAssets(destination.fonts);
}
const fontCache = new Map<string, { asset: FontAsset; face: FontFace; promise: Promise<FontFace> }>();
export function loadFontAsset(font: FontAsset): Promise<FontFace> {
  const cached = fontCache.get(font.id);
  if (cached && cached.asset.dataUrl === font.dataUrl && cached.asset.family === font.family && cached.asset.weight === font.weight && cached.asset.style === font.style) return cached.promise;
  const face = new FontFace(font.family, `url("${font.dataUrl}") format("${font.format}")`, { weight: font.weight, style: font.style, display: 'swap' });
  const promise = face.load().catch(() => { fontCache.delete(font.id); throw new Error(`Шрифт «${font.name}» не удалось загрузить. Проверьте файл.`); });
  fontCache.set(font.id, { asset: { ...font }, face, promise });
  if (fontCache.size > 64) fontCache.delete(fontCache.keys().next().value!);
  return promise;
}
