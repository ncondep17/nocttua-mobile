import { useState } from 'react';
import { Sheet } from '../../../../components/feedback/Sheet';
import { Button } from '../../../../components/core/Button';
import { Chip } from '../../../../components/core/Chip';
import { Stepper } from '../../../../components/forms/Stepper';
import { Toggle } from '../../../../components/forms/Toggle';
import { TextArea } from '../../../../components/forms/TextArea';
import { babies } from '../../data/mock';

const PLACES = ['Cuna', 'Colecho', 'Brazos', 'Coche', 'Porteo'];

/**
 * Hoja · Anotar sueño.
 * Se abre con la hora actual ya puesta: en el 90% de los casos se guarda sin tocar nada.
 * "Anotar a las dos" solo aparece en cuentas de mellizos.
 */
export function SleepLogSheet({ open, onClose, onSave, twins = true }) {
  const [baby, setBaby] = useState('a');
  const [start, setStart] = useState(6 * 60 + 25);
  const [dur, setDur] = useState(45);
  const [place, setPlace] = useState('Cuna');
  const [fellAsleepFeeding, setFell] = useState(false);
  const [note, setNote] = useState('');

  const fmt = (m) => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
  const fmtDur = (m) => (m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : m + ' min');

  return (
    <Sheet
      open={open} onClose={onClose} title="Anotar sueño" subtitle="Se guarda con la hora actual si no cambiás nada"
      footer={
        <>
          <Button size="lg" className="flex-1" onClick={() => onSave && onSave({ baby, start, dur, place })}>Guardar</Button>
          {twins ? <Button variant="secondary" size="lg" onClick={() => onSave && onSave({ baby: 'both', start, dur, place })}>A las dos</Button> : null}
        </>
      }
    >
      {twins ? (
        <div className="flex gap-4">
          {babies.map((b) => <Chip key={b.id} selected={baby === b.id} onClick={() => setBaby(b.id)}>{b.name}</Chip>)}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-7">
        <Stepper label="Se durmió" value={fmt(start)} onDecrement={() => setStart(start - 5)} onIncrement={() => setStart(start + 5)} />
        <Stepper label="Duración" value={fmtDur(dur)} onDecrement={() => setDur(Math.max(5, dur - 5))} onIncrement={() => setDur(dur + 5)} />
      </div>

      <div className="flex flex-col gap-4">
        <span className="font-ui-app text-sm text-tinta-tenue">Dónde</span>
        <div className="flex flex-wrap gap-4">
          {PLACES.map((p) => <Chip key={p} selected={place === p} onClick={() => setPlace(p)}>{p}</Chip>)}
        </div>
      </div>

      <Toggle label="Se durmió durante la toma" checked={fellAsleepFeeding} onChange={() => setFell(!fellAsleepFeeding)} />
      <TextArea label="Nota (opcional)" value={note} onChange={setNote} placeholder="Se despertó por el ruido del pasillo" />
    </Sheet>
  );
}
export default SleepLogSheet;
