import { useState } from 'react';
import { Sheet } from '../../../../components/feedback/Sheet';
import { Button } from '../../../../components/core/Button';
import { Chip } from '../../../../components/core/Chip';
import { Stepper } from '../../../../components/forms/Stepper';
import { Toggle } from '../../../../components/forms/Toggle';
import { SegmentedControl } from '../../../../components/forms/SegmentedControl';
import { babies } from '../../data/mock';

/**
 * Hoja · Anotar toma / extracción.
 * Un solo componente con dos modos: la extracción no pide bebé, pide volumen y lado doble.
 */
export function FeedLogSheet({ open, mode = 'feed', onClose, onSave, twins = true, isNight = false }) {
  const [m, setM] = useState(mode);
  const [baby, setBaby] = useState('a');
  const [kind, setKind] = useState('Pecho');
  const [side, setSide] = useState('Izquierdo');
  const [minutes, setMinutes] = useState(15);
  const [volume, setVolume] = useState(90);
  const [wasDue, setWasDue] = useState(false);

  const feed = m === 'feed';
  return (
    <Sheet
      open={open} onClose={onClose}
      title={feed ? 'Anotar toma' : 'Anotar extracción'}
      footer={
        <>
          <Button size="lg" className="flex-1" onClick={() => onSave && onSave({ mode: m, baby, kind, minutes, volume })}>Guardar</Button>
          {feed && twins ? <Button variant="secondary" size="lg" onClick={() => onSave && onSave({ mode: m, baby: 'both' })}>A las dos</Button> : null}
        </>
      }
    >
      <SegmentedControl items={[{ id: 'feed', label: 'Toma' }, { id: 'pump', label: 'Extracción' }]} active={m} onSelect={setM} />

      {feed ? (
        <>
          {twins ? (
            <div className="flex gap-4">
              {babies.map((b) => <Chip key={b.id} selected={baby === b.id} onClick={() => setBaby(b.id)}>{b.name}</Chip>)}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-4">
            {['Pecho', 'Fórmula', 'Extraída'].map((k) => <Chip key={k} selected={kind === k} onClick={() => setKind(k)}>{k}</Chip>)}
          </div>
          {kind === 'Pecho' ? (
            <>
              <div className="flex flex-wrap gap-4">
                {['Izquierdo', 'Derecho', 'Los dos'].map((s) => <Chip key={s} selected={side === s} onClick={() => setSide(s)}>{s}</Chip>)}
              </div>
              <Stepper label="Minutos" value={minutes + ' min'} onDecrement={() => setMinutes(Math.max(1, minutes - 1))} onIncrement={() => setMinutes(minutes + 1)} />
            </>
          ) : (
            <Stepper label="Volumen" value={volume + ' ml'} onDecrement={() => setVolume(Math.max(10, volume - 10))} onIncrement={() => setVolume(volume + 10)} />
          )}
          {isNight ? <Toggle label="Le tocaba esta toma" hint="según la tabla de su edad" checked={wasDue} onChange={() => setWasDue(!wasDue)} /> : null}
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-4">
            {['Doble', 'Izquierdo', 'Derecho'].map((s) => <Chip key={s} selected={side === s} onClick={() => setSide(s)}>{s}</Chip>)}
          </div>
          <div className="grid grid-cols-2 gap-7">
            <Stepper label="Volumen" value={volume + ' ml'} onDecrement={() => setVolume(Math.max(10, volume - 10))} onIncrement={() => setVolume(volume + 10)} />
            <Stepper label="Duración" value={minutes + ' min'} onDecrement={() => setMinutes(Math.max(1, minutes - 1))} onIncrement={() => setMinutes(minutes + 1)} />
          </div>
          <Toggle label="Va a la reserva" hint="Suma al total del congelador" checked={wasDue} onChange={() => setWasDue(!wasDue)} />
        </>
      )}
    </Sheet>
  );
}
export default FeedLogSheet;
