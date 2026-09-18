import { useState } from 'react';
import { Chip, SegTabs, Stepper, ToggleRow, Eyebrow, PrimaryButton, GhostButton } from '../../components/primitives';
import { Sheet } from '../../components/MobileChrome';
import { PLACES, CONTACTS, FEED_TYPES, MOODS, FACTORS, NAMES } from '../../data/profiles';
import { toMin, fmt, dur } from '../../lib/time';

/**
 * Hoja de registro de sueño — el formulario más importante del producto.
 * Se abre desde cualquier celda de un bloque en Hoy, con esa bebé ya elegida.
 *
 * Dos decisiones de diseño que no se negocian:
 *  · La tira violeta de derivados (latencia / durmió / ventana previa) se
 *    recalcula EN VIVO mientras mueve las horas: le enseña qué significan los
 *    números que está anotando.
 *  · «Le tocaba esta toma» es el campo que separa hambre real de asociación de
 *    sueño. Sin ese dato, la analítica de tomas nocturnas no dice nada.
 */
export function SleepLogSheet({ open, title, baby, onClose, onSave, onSaveBoth, onBoth }) {
  const [b, setB] = useState(baby || 0);
  const [form, setForm] = useState({
    start: 750, asleep: 767, end: 860,
    place: 'Su cuna', contact: 'Palmaditas', mood: 'Tranquila',
    feedType: 'Pecho der.', feedAmount: 12, due: true, fedToSleep: false,
    factors: ['Teething'],
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleFactor = (x) => setForm(f => ({
    ...f, factors: f.factors.indexOf(x) >= 0 ? f.factors.filter(y => y !== x) : f.factors.concat([x]),
  }));

  const latency = Math.max(0, form.asleep - form.start);
  const duration = Math.max(0, form.end - form.asleep);
  const window_ = Math.max(0, form.start - toMin('6:20'));
  const showFeed = form.feedType !== 'Sin toma';

  return (
    <Sheet
      open={open}
      title={(title || '') + ' · ' + NAMES[b]}
      onClose={onClose}
      footer={
        <>
          <PrimaryButton className="flex-1" onClick={() => onSave && onSave(b, form, { latency, window_ })}>Guardar registro</PrimaryButton>
          <GhostButton onClick={onSaveBoth}>Aplicar<br />a ambas</GhostButton>
        </>
      }
    >
      <SegTabs
        items={[{ id: 0, label: NAMES[0] }, { id: 1, label: NAMES[1] }, { id: 'both', label: 'Las dos' }]}
        active={b}
        onSelect={(id) => id === 'both' ? onBoth && onBoth() : setB(id)}
      />

      <div className="flex flex-col gap-[8px]">
        <Stepper label="Empecé a dormirla" value={fmt(form.start)} onDec={() => set('start', form.start - 5)} onInc={() => set('start', form.start + 5)} />
        <Stepper label="Se durmió" value={fmt(form.asleep)} onDec={() => set('asleep', form.asleep - 5)} onInc={() => set('asleep', form.asleep + 5)} />
        <Stepper label="Se despertó" value={fmt(form.end)} onDec={() => set('end', form.end - 5)} onInc={() => set('end', form.end + 5)} />

        {/* Derivados en vivo. No es decoración: es la enseñanza del formulario. */}
        <div className="flex flex-wrap items-center gap-[9px] rounded-[11px] bg-[#F6F1FB] px-[12px] py-[9px]">
          <span className="font-mono text-[12.5px] text-[#6B5DD3]">latencia {dur(latency)}</span>
          <span className="h-[13px] w-px bg-[#C9C1D8]" />
          <span className="font-mono text-[12.5px] text-[#6B5DD3]">durmió {dur(duration)}</span>
          <span className="h-[13px] w-px bg-[#C9C1D8]" />
          <span className="font-mono text-[12.5px] text-[#6B5DD3]">ventana previa {dur(window_)}</span>
        </div>
      </div>

      <Field label="¿Dónde se durmió?">
        {PLACES.map(x => <Chip key={x} selected={form.place === x} onClick={() => set('place', x)}>{x}</Chip>)}
      </Field>

      <Field label="¿Necesitó contacto?">
        {CONTACTS.map(x => <Chip key={x} selected={form.contact === x} onClick={() => set('contact', x)}>{x}</Chip>)}
      </Field>

      <div className="flex flex-col gap-[8px]">
        <Eyebrow>Toma de leche antes de dormir</Eyebrow>
        <div className="flex flex-wrap gap-[7px]">
          {FEED_TYPES.map(x => <Chip key={x} selected={form.feedType === x} onClick={() => set('feedType', x)}>{x}</Chip>)}
        </div>
        {showFeed ? (
          <div className="flex flex-col gap-[9px] rounded-[12px] border border-[#E4DCD0] bg-[#FBF7F0] px-[13px] py-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[14.5px] text-[#4A4459]">{form.feedType === 'Biberón' ? 'Cantidad (ml)' : 'Duración (min)'}</span>
              <div className="flex items-center gap-[9px]">
                <span onClick={() => set('feedAmount', Math.max(1, form.feedAmount - 1))}
                  className="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-[9px] border border-[#DCD4C8] text-[15px] text-[#4A4459]">−</span>
                <span className="min-w-[62px] text-center font-mono text-[18px] text-[#16162B]">
                  {form.feedType === 'Biberón' ? form.feedAmount * 10 + ' ml' : form.feedAmount + ' min'}
                </span>
                <span onClick={() => set('feedAmount', form.feedAmount + 1)}
                  className="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-[9px] border border-[#DCD4C8] text-[15px] text-[#4A4459]">＋</span>
              </div>
            </div>
            <ToggleRow label="Le tocaba esta toma" hint="según la tabla de su edad" checked={form.due} onChange={() => set('due', !form.due)} />
            <ToggleRow label="Se durmió durante la toma" checked={form.fedToSleep} onChange={() => set('fedToSleep', !form.fedToSleep)} tone="coral" />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-[8px]">
        <Eyebrow>¿Cómo despertó?</Eyebrow>
        <div className="flex gap-[7px]">
          {MOODS.map(m => {
            const on = form.mood === m.label;
            return (
              <div key={m.label} onClick={() => set('mood', m.label)}
                style={{
                  flex: 1, padding: '9px 4px', borderRadius: 13, textAlign: 'center', fontSize: '12.5px',
                  background: on ? '#EEF6F2' : '#FBF7F0',
                  border: on ? '1.5px solid #7FB09A' : '1px solid #DCD4C8',
                  color: on ? '#16162B' : '#4A4459',
                }}
                className="cursor-pointer">
                <div className="mb-[2px] text-[19px]">{m.icon}</div>{m.label}
              </div>
            );
          })}
        </div>
      </div>

      <Field label="Factores del día">
        {FACTORS.map(x => <Chip key={x} selected={form.factors.indexOf(x) >= 0} onClick={() => toggleFactor(x)}>{x}</Chip>)}
      </Field>
    </Sheet>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <Eyebrow>{label}</Eyebrow>
      <div className="flex flex-wrap gap-[7px]">{children}</div>
    </div>
  );
}
export default SleepLogSheet;
