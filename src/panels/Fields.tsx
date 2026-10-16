import { useEffect, useState } from 'react';
import { useEditor } from '../store/editor';
export function Field({ label, value, onChange, number, min, max, step = 1, suffix, id, disabled = false, ariaLabel }: { label: string; value: string | number; onChange: (v: string) => void; number?: boolean; min?: number; max?: number; step?: number; suffix?: string; id?: string; disabled?: boolean; ariaLabel?: string }) {
  const [draft, setDraft] = useState(String(value)); const [focused, setFocused] = useState(false);
  useEffect(() => { if (!focused) setDraft(typeof value === 'number' ? String(Math.round(value * 100) / 100) : value); }, [value, focused]);
  return <label className={`property-field ${disabled ? 'disabled' : ''}`}><span>{label}</span><input id={id} aria-label={ariaLabel ?? label} type={number ? 'number' : 'text'} value={draft} min={min} max={max} step={step} disabled={disabled}
    onFocus={() => { setFocused(true); useEditor.getState().beginGesture(); }} onBlur={() => { setFocused(false); useEditor.getState().endGesture(); }}
    onChange={e => { const v = e.target.value; setDraft(v); if (number) { const n = Number(v); if (!v.trim() || !Number.isFinite(n) || (min !== undefined && n < min) || (max !== undefined && n > max)) return; } onChange(v); }}
    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { useEditor.getState().cancelGesture(); e.currentTarget.blur(); } }} />{suffix && <small>{suffix}</small>}</label>;
}
export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div className="color-field"><label className="color-swatch" style={{ background: value }} title={label}><input type="color" aria-label={`Палитра: ${label}`} value={/^#[\da-f]{6}$/i.test(value) ? value : '#000000'} onFocus={() => useEditor.getState().beginGesture()} onBlur={() => useEditor.getState().endGesture()} onChange={e => onChange(e.target.value)} /></label><Field label={label} value={value} onChange={onChange} /></div>;
}
