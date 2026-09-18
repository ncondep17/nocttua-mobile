import { useState } from 'react';
import { Chip, SegTabs, Stepper, StepperBox, ToggleRow, Eyebrow, PrimaryButton, GhostButton } from '../../components/primitives';
import { Sheet } from '../../components/MobileChrome';
import { FEED_SOURCES, FEED_CONTEXTS, PUMP_SIDES, PUMP_DESTS, NAMES, ACCENT, SOFT } from '../../data/profiles';
import { fmt } from '../../lib/time';

/**
 * Hoja de toma / extracción — un solo componente con dos modos.
 * La extracción no pide bebé: pide lado, ml, minutos y destino, y muestra el
 * rendimiento (ml/min) en vivo. El destino cambia la explicación de abajo,
 * porque "al banco" y "uso inmediato" no significan lo mismo para la reserva.
 */
export function FeedLogSheet({ open, mode = 'feed', onClose, onSave, onSaveBoth }) {
  const [m, setM] = useState(mode);
  const [feed, setFeed] = useState({ time: 580, who: 0, source: 'Ambos pechos', qty: 12, ctx: 'Despierta', due: false });
  const [pump, setPump] = useState({ time: 495, side: 'Ambos', ml: 140, min: 18, dest: 'Al banco', toBank: true });
  const isFeed = m === 'feed';
  const isBottle = feed.source.indexOf('Biberón') === 0;
  const setF = (k, v) => setFeed(f => ({ ...f, [k]: v }));
  const setP = (k, v) => setPump(f => ({ ...f, [k]: v }));

  const hint = pump.dest === 'Al banco'
    ? 'Suma al banco de leche y queda disponible para los turnos de noche.'
    : pump.dest === 'A la nevera'
      ? 'Se usa en las próximas 48 h, no entra al conteo del banco congelado.'
      : 'Va directo al biberón de la próxima toma.';

  return (
    <Sheet
      open={open}
      title={isFeed ? 'Registrar toma' : 'Registrar extracción'}
      onClose={onClose}
      maxH="92%"
      footer={
        <>
          <PrimaryButton className="flex-1" onClick={() => onSave && onSave(m, isFeed ? feed : pump)}>
            {isFeed ? 'Guardar toma' : 'Guardar extracción'}
          </PrimaryButton>
          {isFeed ? <GhostButton onClick={onSaveBoth}>Aplicar<br />a ambas</GhostButton> : null}
        </>
      }
    >
      <SegTabs items={[{ id: 'feed', label: 'Toma' }, { id: 'pump', label: 'Extracción' }]} active={m} onSelect={setM} />

      <Stepper
        label="Hora"
        value={fmt(isFeed ? feed.time : pump.time)}
        onDec={() => isFeed ? setF('time', feed.time - 5) : setP('time', pump.time - 5)}
        onInc={() => isFeed ? setF('time', feed.time + 5) : setP('time', pump.time + 5)}
      />

      {isFeed ? (
        <div className="flex flex-col gap-[13px]">
          <div className="flex flex-col gap-[8px]">
            <Eyebrow>¿Para quién?</Eyebrow>
            <div className="flex gap-[7px]">
              {[0, 1].map(i => {
                const on = feed.who === i;
                return (
                  <div key={i} onClick={() => setF('who', i)}
                    style={{
                      flex: 1, padding: 10, textAlign: 'center', borderRadius: 12, fontSize: '14.5px',
                      background: on ? SOFT[i] : '#FBF7F0',
                      border: on ? '1.5px solid ' + ACCENT[i] : '1px solid #DCD4C8',
                      color: on ? '#16162B' : '#4A4459',
                    }}
                    className="cursor-pointer">{NAMES[i]}</div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-[8px]">
            <Eyebrow>Tipo de toma</Eyebrow>
            <div className="flex flex-wrap gap-[7px]">
              {FEED_SOURCES.map(x => <Chip key={x} selected={feed.source === x} onClick={() => setF('source', x)}>{x}</Chip>)}
            </div>
          </div>

          <Stepper
            label={isBottle ? 'Cantidad (ml)' : 'Duración (min)'}
            value={isBottle ? feed.qty * 10 + ' ml' : feed.qty + ' min'}
            minW={78}
            onDec={() => setF('qty', Math.max(1, feed.qty - 1))}
            onInc={() => setF('qty', feed.qty + 1)}
          />

          <div className="flex flex-col gap-[8px]">
            <Eyebrow>Contexto</Eyebrow>
            <div className="flex flex-wrap gap-[7px]">
              {FEED_CONTEXTS.map(x => <Chip key={x} selected={feed.ctx === x} onClick={() => setF('ctx', x)}>{x}</Chip>)}
            </div>
          </div>

          {/* Solo aparece si la toma fue de madrugada: es ahí donde la pregunta importa. */}
          {feed.ctx === 'Despertar nocturno' ? (
            <ToggleRow boxed label="Le tocaba esta toma" hint="según la tabla de su edad" checked={feed.due} onChange={() => setF('due', !feed.due)} />
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-[13px]">
          <div className="flex flex-col gap-[8px]">
            <Eyebrow>¿De qué lado?</Eyebrow>
            <div className="flex flex-wrap gap-[7px]">
              {PUMP_SIDES.map(x => <Chip key={x} selected={pump.side === x} onClick={() => setP('side', x)}>{x}</Chip>)}
            </div>
          </div>

          <div className="flex gap-[9px]">
            <StepperBox label="Cantidad" value={pump.ml + ' ml'} onDec={() => setP('ml', Math.max(0, pump.ml - 10))} onInc={() => setP('ml', pump.ml + 10)} />
            <StepperBox label="Duración" value={pump.min + ' min'} onDec={() => setP('min', Math.max(1, pump.min - 1))} onInc={() => setP('min', pump.min + 1)} />
          </div>

          <div className="flex flex-col gap-[8px]">
            <Eyebrow>¿A dónde va?</Eyebrow>
            <div className="flex flex-wrap gap-[7px]">
              {PUMP_DESTS.map(x => <Chip key={x} selected={pump.dest === x} onClick={() => setP('dest', x)}>{x}</Chip>)}
            </div>
          </div>

          <div className="flex flex-col gap-[4px] rounded-[12px] bg-[#F6F1FB] px-[12px] py-[11px]">
            <span className="font-mono text-[12.5px] text-[#6B5DD3]">
              {pump.ml} ml en {pump.min} min · {Math.round(pump.ml / Math.max(1, pump.min))} ml/min
            </span>
            <span className="text-[12px] leading-[1.45] text-[#8A8299]">{hint}</span>
          </div>
        </div>
      )}
    </Sheet>
  );
}
export default FeedLogSheet;
