'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const FORM_OPTIONS = [
  { v: 'pill', l: 'Pille' },
  { v: 'tablet', l: 'Tablette' },
  { v: 'capsule', l: 'Kapsel' },
  { v: 'drops', l: 'Tropfen' },
  { v: 'powder', l: 'Pulver' },
  { v: 'liquid', l: 'Flüssigkeit' },
  { v: 'gummy', l: 'Gummi' },
  { v: 'spray', l: 'Spray' },
  { v: 'other', l: 'Andere' },
];

const DAYPART_OPTIONS = [
  { v: 'morning', l: 'Morgens (nüchtern)' },
  { v: 'breakfast', l: 'Frühstück' },
  { v: 'noon', l: 'Mittags' },
  { v: 'afternoon', l: 'Nachmittags' },
  { v: 'evening', l: 'Abends' },
  { v: 'night', l: 'Nacht' },
];

const UNIT_OPTIONS = [
  { v: 'day', l: 'Tag(e)' },
  { v: 'week', l: 'Woche(n)' },
  { v: 'month', l: 'Monat(e)' },
];

const COLOR_OPTIONS = ['peach','sage','mauve','butter'];
const EMOJI_OPTIONS = ['💊','🌿','🧡','☀️','🌙','🫧','🩷','💎','✨','🍊','🥛','🐟'];

const WARNING_OPTIONS = [
  { v: 'iron', l: 'Eisen' },
  { v: 'calcium', l: 'Calcium' },
  { v: 'zinc', l: 'Zink' },
  { v: 'magnesium', l: 'Magnesium' },
  { v: 'vitaminD', l: 'Vitamin D' },
  { v: 'vitaminC', l: 'Vitamin C' },
  { v: 'omega3', l: 'Omega-3' },
  { v: 'b12', l: 'B12' },
  { v: 'prenatal', l: 'Pränatal' },
  { v: 'coffee', l: 'Kaffee/Tee' },
  { v: 'dairy', l: 'Milch' },
];

type Vitamin = any;

const emptyForm = () => ({
  id: '' as string,
  name: '',
  dose: '',
  form: 'capsule',
  useExactTime: false,
  timeOfDay: 'breakfast',
  exactTime: '08:00',
  intervalEvery: 1,
  intervalUnit: 'day',
  leadTimeMin: 0,
  note: '',
  emoji: '💊',
  color: 'peach',
  warnings: [] as string[],
  active: true,
});

export default function SettingsPage() {
  const [vitamins, setVitamins] = useState<Vitamin[]>([]);
  const [editing, setEditing] = useState<ReturnType<typeof emptyForm> | null>(null);

  async function load() {
    const r = await fetch('/api/vitamins');
    setVitamins(await r.json());
  }
  useEffect(() => { load(); }, []);

  function startNew() { setEditing(emptyForm()); }
  function startEdit(v: Vitamin) {
    setEditing({
      id: v.id,
      name: v.name,
      dose: v.dose || '',
      form: v.form || 'capsule',
      useExactTime: !!v.exactTime,
      timeOfDay: v.timeOfDay || 'breakfast',
      exactTime: v.exactTime || '08:00',
      intervalEvery: v.intervalEvery || 1,
      intervalUnit: v.intervalUnit || 'day',
      leadTimeMin: v.leadTimeMin || 0,
      note: v.note || '',
      emoji: v.emoji || '💊',
      color: v.color || 'peach',
      warnings: v.warnings || [],
      active: v.active !== false,
    });
  }

  async function save() {
    if (!editing) return;
    const body: any = {
      name: editing.name,
      dose: editing.dose,
      form: editing.form,
      timeOfDay: editing.useExactTime ? null : editing.timeOfDay,
      exactTime: editing.useExactTime ? editing.exactTime : null,
      intervalEvery: Math.max(1, Number(editing.intervalEvery) || 1),
      intervalUnit: editing.intervalUnit,
      leadTimeMin: editing.leadTimeMin,
      note: editing.note,
      emoji: editing.emoji,
      color: editing.color,
      warnings: editing.warnings,
      active: editing.active,
    };
    if (editing.id) {
      await fetch(`/api/vitamins/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/vitamins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Wirklich löschen?')) return;
    await fetch(`/api/vitamins/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <main className="px-4 pt-3 pb-6">
      <header className="flex items-center justify-between mb-4 animate-fade-up">
        <Link href="/" className="w-9 h-9 rounded-full bg-white/70 border border-peach-100 flex items-center justify-center">←</Link>
        <h1 className="font-display text-xl">Vitamine</h1>
        <button
          onClick={startNew}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-peach-200 to-peach-300 text-white font-bold shadow-bubble"
        >+</button>
      </header>

      {vitamins.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-5xl mb-2">🌱</div>
          <div className="font-display text-lg">Noch keine Vitamine</div>
          <button onClick={startNew} className="mt-4 bg-gradient-to-r from-peach-200 to-peach-300 px-5 py-3 rounded-full font-semibold shadow-bubble">
            + Erstes Vitamin hinzufügen
          </button>
        </div>
      ) : (
        <div className="space-y-2 animate-fade-up">
          {vitamins.map((v) => (
            <div key={v.id} className="bg-white rounded-bubble p-3 shadow-soft flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-peach-50 flex items-center justify-center text-lg">{v.emoji || '💊'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[15px] truncate">{v.name}</span>
                  {!v.active && <span className="text-[10px] bg-ink/10 text-ink-soft px-2 py-0.5 rounded-full">pausiert</span>}
                </div>
                <div className="text-xs text-ink-soft truncate">
                  {[v.dose, v.exactTime || DAYPART_OPTIONS.find(d=>d.v===v.timeOfDay)?.l].filter(Boolean).join(' · ')}
                  {v.intervalEvery && v.intervalEvery > 1 ? ` · alle ${v.intervalEvery} ${UNIT_OPTIONS.find(u=>u.v===v.intervalUnit)?.l}` : ''}
                </div>
              </div>
              <button onClick={() => startEdit(v)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-peach-50 text-peach-500">Bearbeiten</button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditSheet
          value={editing}
          onChange={setEditing as any}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={editing.id ? () => { remove(editing.id); setEditing(null); } : undefined}
        />
      )}
    </main>
  );
}

function EditSheet({ value, onChange, onClose, onSave, onDelete }: any) {
  const v = value;
  function set(k: string, val: any) { onChange({ ...v, [k]: val }); }
  function toggleWarning(tag: string) {
    const has = v.warnings.includes(tag);
    set('warnings', has ? v.warnings.filter((x:string)=>x!==tag) : [...v.warnings, tag]);
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end" onClick={onClose}>
      <div className="w-full max-w-[480px] mx-auto bg-cream rounded-t-[32px] max-h-[90dvh] overflow-y-auto safe-bottom animate-fade-up" onClick={(e)=>e.stopPropagation()}>
        <div className="sticky top-0 bg-cream/95 backdrop-blur px-4 pt-3 pb-2 flex items-center justify-between border-b border-peach-100">
          <button onClick={onClose} className="text-ink-soft text-sm">Abbrechen</button>
          <div className="font-display text-lg">{v.id ? 'Bearbeiten' : 'Neues Vitamin'}</div>
          <button onClick={onSave} disabled={!v.name} className="text-peach-500 font-semibold text-sm disabled:opacity-40">Speichern</button>
        </div>
        <div className="p-4 space-y-4">
          {/* Name + emoji */}
          <div>
            <label className="text-xs font-semibold text-ink-soft">Name</label>
            <input className="input-bubble w-full mt-1" value={v.name} onChange={(e)=>set('name', e.target.value)} placeholder="z.B. Magnesium" />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-soft">Emoji</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map(e => (
                <button key={e} onClick={()=>set('emoji', e)} className={`w-10 h-10 rounded-2xl text-lg ${v.emoji===e ? 'bg-peach-200' : 'bg-white/70'}`}>{e}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-soft">Farbe</label>
            <div className="mt-1 flex gap-2">
              {COLOR_OPTIONS.map(c => (
                <button key={c} onClick={()=>set('color', c)}
                  className={`flex-1 h-10 rounded-2xl border-2 ${v.color===c ? 'border-ink' : 'border-transparent'} ${c==='peach'?'bg-peach-100':c==='sage'?'bg-sage-100':c==='mauve'?'bg-mauve-100':'bg-butter-100'}`}/>
              ))}
            </div>
          </div>

          {/* Dose + Form */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink-soft">Menge</label>
              <input className="input-bubble w-full mt-1" value={v.dose} onChange={(e)=>set('dose', e.target.value)} placeholder="z.B. 500 mg" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft">Form</label>
              <select className="input-bubble w-full mt-1" value={v.form} onChange={(e)=>set('form', e.target.value)}>
                {FORM_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          </div>

          {/* Time */}
          <div className="bg-white rounded-2xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink">Uhrzeit genau festlegen</span>
              <button
                onClick={()=>set('useExactTime', !v.useExactTime)}
                className={`w-11 h-6 rounded-full transition-colors ${v.useExactTime ? 'bg-peach-400' : 'bg-ink/15'}`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${v.useExactTime ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {v.useExactTime ? (
              <input type="time" className="input-bubble w-full" value={v.exactTime} onChange={(e)=>set('exactTime', e.target.value)} />
            ) : (
              <select className="input-bubble w-full" value={v.timeOfDay} onChange={(e)=>set('timeOfDay', e.target.value)}>
                {DAYPART_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            )}
          </div>

          {/* Interval */}
          <div className="bg-white rounded-2xl p-3">
            <div className="text-[13px] font-semibold text-ink mb-2">Wiederholung</div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-soft">alle</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                className="input-bubble w-20 text-center"
                value={v.intervalEvery === '' ? '' : String(v.intervalEvery)}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  if (cleaned === '') {
                    set('intervalEvery', '' as any);
                  } else {
                    const n = parseInt(cleaned, 10);
                    if (n <= 90) set('intervalEvery', n);
                  }
                }}
                onBlur={() => {
                  if (!v.intervalEvery || (v.intervalEvery as any) < 1) {
                    set('intervalEvery', 1);
                  }
                }}
              />
              <select className="input-bubble flex-1" value={v.intervalUnit} onChange={(e)=>set('intervalUnit', e.target.value)}>
                {UNIT_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          </div>

          {/* Lead time */}
          <div className="bg-white rounded-2xl p-3">
            <div className="text-[13px] font-semibold text-ink mb-2">Vorwarnzeit für Push (Minuten)</div>
            <div className="flex gap-2">
              {[0,5,10,15,30].map(n => (
                <button key={n} onClick={()=>set('leadTimeMin', n)}
                  className={`flex-1 py-2 rounded-full text-sm font-semibold ${v.leadTimeMin===n ? 'bg-peach-300 text-white' : 'bg-peach-50 text-ink-soft'}`}>
                  {n === 0 ? 'pünktlich' : `${n} Min`}
                </button>
              ))}
            </div>
          </div>

          {/* Warnings */}
          <div>
            <label className="text-xs font-semibold text-ink-soft">Konflikt-Tags (für Abstands-Hinweise)</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {WARNING_OPTIONS.map(o => (
                <button key={o.v} onClick={()=>toggleWarning(o.v)}
                  className={`text-xs px-3 py-1.5 rounded-full border ${v.warnings.includes(o.v) ? 'bg-peach-200 border-peach-300 text-ink' : 'bg-white border-peach-100 text-ink-soft'}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-ink-soft">Notiz</label>
            <textarea className="input-bubble w-full mt-1 h-20 resize-none" value={v.note} onChange={(e)=>set('note', e.target.value)} placeholder="z.B. zu Obst / nicht mit Calcium" />
          </div>

          {v.id && (
            <div className="flex items-center justify-between bg-white rounded-2xl p-3">
              <span className="text-[13px] font-semibold">Aktiv</span>
              <button
                onClick={()=>set('active', !v.active)}
                className={`w-11 h-6 rounded-full transition-colors ${v.active ? 'bg-sage-300' : 'bg-ink/15'}`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${v.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          )}

          {onDelete && (
            <button onClick={onDelete} className="w-full text-center py-3 text-sm text-mauve-400 font-semibold">
              🗑 Vitamin löschen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
