import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { Chip, StepperBox, UnitToggle, ToggleRow, GroupLabel, PrimaryButton, GhostButton, CategoryIcon } from '../../../components/v2/primitives';
import { SheetV2 } from '../../../components/v2/MobileChrome';
import { TimeField } from '../../../components/forms/TimeField';
import { DayPicker } from '../../../components/forms/DayPicker';
import { FEED_SOURCES, FEED_CONTEXTS, PUMP_SIDES, PUMP_DESTS } from '../../../data/profiles';
import { agree, genderLabel } from '../../../lib/grammar';
import { stepVolume, fmtVolume } from '../../../lib/volume';
import { addDays, daysBetween, startOfDay } from '../../../lib/dates';
import { useFeedSession } from '../../../lib/useFeedSession';

const MIN_PRESETS = [5, 10, 15, 20];
const ML_PRESETS = [60, 90, 120, 150, 180];

function QuickChip({ active, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ minHeight: 46, paddingHorizontal: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? '#16162B' : '#EFE9DF' }}
    >
      <Text style={{ fontSize: 14, fontWeight: active ? '600' : '400', color: active ? '#FBF7F0' : '#4A4459' }}>{label}</Text>
    </Pressable>
  );
}

/**
 * Hoja de toma / extracción — rediseñada para cargar rápido a las 3am: solo
 * los campos que hacen falta para guardar algo útil (cómo, cuánto, cuándo
 * "ahora") a la vista; el resto (día/hora distinta, contexto, "le tocaba
 * esta toma", "se durmió durante la toma", a dónde va la extracción) vive
 * detrás de "Agregar más detalles" — quedan en su valor por defecto si
 * nunca se abre esa sección, no se pierden, solo no estorban.
 */
export function FeedLogSheet({ open, mode = 'feed', babies, initialBaby = 0, editing = null, onClose, onSave, onSaveBoth }) {
  const [m, setM] = useState(mode);
  const [day, setDay] = useState(startOfDay(new Date()));
  const [time, setTime] = useState(new Date());
  const [who, setWho] = useState(0);
  const [source, setSource] = useState('Ambos pechos');
  const [qtyMl, setQtyMl] = useState(120);
  const [qtyMin, setQtyMin] = useState(12);
  const [customQty, setCustomQty] = useState(false);
  const [unit, setUnit] = useState('ml');
  const [ctx, setCtx] = useState('Despierta');
  const [due, setDue] = useState(false);
  const [fellAsleep, setFellAsleep] = useState(false);
  const [side, setSide] = useState('Ambos');
  const [ml, setMl] = useState(140);
  const [min, setMin] = useState(18);
  const [dest, setDest] = useState('Al banco');
  const [showDetails, setShowDetails] = useState(false);

  const { start: startTimer } = useFeedSession();

  // FamilyShell mantiene esta hoja montada y solo alterna `open`, así que sin
  // este efecto el formulario queda pegado a lo último que se abrió — mismo
  // bug que se encontró en SleepLogSheet (bebé equivocado / edición pisando
  // otro registro con datos por defecto).
  useEffect(() => {
    if (!open) return;
    setM(editing ? (editing.type === 'pump' ? 'pump' : 'feed') : mode);
    setDay(startOfDay(editing ? new Date(editing.started_at) : new Date()));
    setTime(editing ? new Date(editing.started_at) : new Date());
    setWho(editing ? Math.max(0, babies.findIndex((b) => b.id === editing.baby_id)) : initialBaby);
    setSource(editing?.kind ?? 'Ambos pechos');
    setQtyMl(editing?.volume_ml ?? 120);
    setQtyMin(editing?.feed_minutes ?? 12);
    setCustomQty(false);
    setCtx(editing?.feed_context ?? 'Despierta');
    setDue(editing?.was_due ?? false);
    setFellAsleep(editing?.fell_asleep_feeding ?? false);
    setSide(editing?.side ?? 'Ambos');
    setMl(editing?.type === 'pump' ? editing?.volume_ml ?? 140 : 140);
    setMin(editing?.type === 'pump' && editing.started_at && editing.ended_at
      ? Math.max(1, Math.round((new Date(editing.ended_at) - new Date(editing.started_at)) / 60000))
      : 18);
    setDest(editing?.pump_dest ?? 'Al banco');
    // Editar un registro ya cargado necesita ver todo lo que tiene guardado
    // de entrada; uno nuevo arranca compacto.
    setShowDetails(!!editing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, mode]);

  const handleDayChange = (newDay) => {
    const delta = daysBetween(newDay, day);
    if (delta === 0) return;
    setDay(newDay);
    setTime((t) => addDays(t, delta));
  };

  const isFeed = m === 'feed';
  const isBottle = source.indexOf('Biberón') === 0;
  const isToday = daysBetween(day, startOfDay(new Date())) === 0;
  const timeLabel = time.getHours() + ':' + String(time.getMinutes()).padStart(2, '0');

  const hint = dest === 'Al banco'
    ? 'Suma al banco de leche y queda disponible para los turnos de noche.'
    : dest === 'A la nevera'
      ? 'Se usa en las próximas 48 h, no entra al conteo del banco congelado.'
      : 'Va directo al biberón de la próxima toma.';

  const feedPayload = (babyId) => ({
    babyId, type: 'feed', startedAt: time.toISOString(),
    kind: source, volumeMl: isBottle ? qtyMl : undefined, feedMinutes: isBottle ? undefined : qtyMin,
    feedContext: ctx, wasDue: ctx === 'Despertar nocturno' ? due : undefined,
    fellAsleepFeeding: fellAsleep,
  });
  const pumpPayload = () => ({
    babyId: null, type: 'pump', startedAt: time.toISOString(),
    endedAt: new Date(time.getTime() + min * 60000).toISOString(),
    side, volumeMl: ml, pumpDest: dest, toReserve: dest === 'Al banco',
  });

  const summary = isFeed
    ? source + ' · ' + (isBottle ? fmtVolume(qtyMl, unit) : qtyMin + ' min') + ' · ' + (babies[who]?.name ?? '')
    : 'Extracción · ' + side.toLowerCase() + ' · ' + fmtVolume(ml, unit) + ' · mamá';

  // El cronómetro es el mismo que ya usa Leche (useFeedSession) — tiene que
  // arrancar con los mismos valores de `kind`/`side` que espera esa
  // pantalla al pararlo ('pecho'/'extraccion', y el lado en femenino para
  // extracción: 'Izquierda'/'Derecha'/'Las dos'), si no, al parar el
  // cronómetro Leche no sabe de qué lado fue.
  const handleTimer = () => {
    if (isFeed) {
      const timerSide = source === 'Pecho izq.' ? 'Izquierdo' : source === 'Pecho der.' ? 'Derecho' : null;
      startTimer('pecho', babies[who]?.id, timerSide);
    } else {
      const timerSide = side === 'Izquierdo' ? 'Izquierda' : side === 'Derecho' ? 'Derecha' : 'Las dos';
      startTimer('extraccion', null, timerSide);
    }
    onClose && onClose();
  };

  return (
    <SheetV2 open={open} onClose={onClose} maxH="92%" footer={
      <>
        <PrimaryButton style={{ flex: 1 }} onPress={() => onSave && onSave(isFeed ? feedPayload(babies[who]?.id) : pumpPayload())}>
          {isFeed ? 'Guardar la toma' : 'Guardar la extracción'}
        </PrimaryButton>
        {isFeed && !editing && babies.length > 1 ? <GhostButton onPress={() => onSaveBoth && onSaveBoth(feedPayload(null))}>Aplicar{'\n'}a ambas</GhostButton> : null}
      </>
    }>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
        <CategoryIcon category={isFeed ? 'toma' : 'extraccion'} size={40} />
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 23, lineHeight: 23 * 1.05, color: '#16162B' }}>
            {isFeed ? (editing ? 'Editar toma' : 'Registrar toma') : (editing ? 'Editar extracción' : 'Registrar extracción')}
          </Text>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: '#8A8299' }}>
            {(isFeed ? babies[who]?.name ?? '' : 'Mamá').toUpperCase() + ' · ' + (isToday ? 'HOY' : 'OTRO DÍA') + ' ' + timeLabel}
          </Text>
        </View>
        <Text onPress={onClose} style={{ fontSize: 13, color: '#6B5DD3' }}>Cerrar</Text>
      </View>

      {isFeed && babies.length > 1 ? (
        <View style={{ flexDirection: 'row', gap: 7 }}>
          {babies.map((baby, i) => <Chip key={baby.id} selected={who === i} onPress={() => setWho(i)}>{baby.name}</Chip>)}
        </View>
      ) : null}

      {isFeed ? (
        <View style={{ gap: 13 }}>
          <View style={{ gap: 8 }}>
            <GroupLabel>Cómo comió</GroupLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {FEED_SOURCES.map((x) => <Chip key={x} selected={source === x} onPress={() => { setSource(x); setCustomQty(false); }}>{x}</Chip>)}
            </View>
          </View>

          {isBottle ? (
            <View style={{ gap: 8 }}>
              <GroupLabel>Unidad</GroupLabel>
              <UnitToggle unit={unit} onChange={setUnit} />
            </View>
          ) : null}

          <View style={{ gap: 8 }}>
            <GroupLabel>{isBottle ? 'Cuánto tomó' : 'Cuánto duró'}</GroupLabel>
            {customQty ? (
              <StepperBox
                label={isBottle ? 'Cantidad' : 'Duración'}
                value={isBottle ? fmtVolume(qtyMl, unit) : qtyMin + ' min'}
                onDec={() => (isBottle ? setQtyMl((v) => stepVolume(v, unit, -1)) : setQtyMin((v) => Math.max(1, v - 1)))}
                onInc={() => (isBottle ? setQtyMl((v) => stepVolume(v, unit, 1)) : setQtyMin((v) => v + 1))}
              />
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                {(isBottle ? ML_PRESETS : MIN_PRESETS).map((v) => (
                  <QuickChip
                    key={v}
                    active={!customQty && (isBottle ? qtyMl === v : qtyMin === v)}
                    label={isBottle ? v + ' ml' : v + ' min'}
                    onPress={() => (isBottle ? setQtyMl(v) : setQtyMin(v))}
                  />
                ))}
                <QuickChip active={false} label="Otra" onPress={() => setCustomQty(true)} />
              </View>
            )}
          </View>

          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12, color: '#8A8299' }}>{summary}</Text>

          {/* El cronómetro es para pecho (cambia de lado en vivo) — un
              biberón se carga por cantidad, no tiene sentido cronometrarlo
              con este mecanismo. */}
          {!isBottle ? (
            <Pressable
              onPress={handleTimer}
              style={{ minHeight: 54, borderRadius: 14, backgroundColor: '#EAF4F8', borderWidth: 1, borderColor: '#B9D8E4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }}
            >
              <Text style={{ fontSize: 15.5, fontWeight: '600', color: '#2E6E88' }}>Cronometrar la toma →</Text>
            </Pressable>
          ) : null}

          <Pressable onPress={() => setShowDetails((v) => !v)} style={{ paddingVertical: 4 }}>
            <Text style={{ fontSize: 13, color: '#6B5DD3' }}>{showDetails ? 'Ocultar detalles' : '+ Agregar más detalles'}</Text>
          </Pressable>

          {showDetails ? (
            <View style={{ gap: 13, borderTopWidth: 1, borderTopColor: '#F0EAE0', paddingTop: 13 }}>
              <DayPicker day={day} onChange={handleDayChange} />
              <TimeField label="Hora" value={time} onChange={setTime} />

              <View style={{ gap: 8 }}>
                <GroupLabel>Contexto</GroupLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                  {FEED_CONTEXTS.map((x) => <Chip key={x} selected={ctx === x} onPress={() => setCtx(x)}>{genderLabel(x, babies[who])}</Chip>)}
                </View>
              </View>

              {ctx === 'Despertar nocturno' ? (
                <ToggleRow boxed label="Le tocaba esta toma" hint="según la tabla de su edad" checked={due} onChange={() => setDue((v) => !v)} />
              ) : null}

              <ToggleRow boxed label={'Se quedó ' + agree(babies[who], 'dormido', 'dormida') + ' durante la toma'} checked={fellAsleep} onChange={() => setFellAsleep((v) => !v)} tone="coral" />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={{ gap: 13 }}>
          <View style={{ gap: 8 }}>
            <GroupLabel>De qué lado</GroupLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {PUMP_SIDES.map((x) => <Chip key={x} selected={side === x} onPress={() => setSide(x)}>{x}</Chip>)}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <GroupLabel>Unidad</GroupLabel>
            <UnitToggle unit={unit} onChange={setUnit} />
          </View>

          <View style={{ gap: 8 }}>
            <GroupLabel>Cuánto sacó</GroupLabel>
            {customQty ? (
              <StepperBox label="Cantidad" value={fmtVolume(ml, unit)} onDec={() => setMl((v) => stepVolume(v, unit, -1))} onInc={() => setMl((v) => stepVolume(v, unit, 1))} />
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                {ML_PRESETS.map((v) => (
                  <QuickChip key={v} active={!customQty && ml === v} label={v + ' ml'} onPress={() => setMl(v)} />
                ))}
                <QuickChip active={false} label="Otra" onPress={() => setCustomQty(true)} />
              </View>
            )}
          </View>

          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12, color: '#8A8299' }}>{summary}</Text>

          <Pressable
            onPress={handleTimer}
            style={{ minHeight: 54, borderRadius: 14, backgroundColor: '#F1ECFA', borderWidth: 1, borderColor: '#DCD0F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }}
          >
            <Text style={{ fontSize: 15.5, fontWeight: '600', color: '#6B5DD3' }}>Cronometrar la extracción →</Text>
          </Pressable>

          <Pressable onPress={() => setShowDetails((v) => !v)} style={{ paddingVertical: 4 }}>
            <Text style={{ fontSize: 13, color: '#6B5DD3' }}>{showDetails ? 'Ocultar detalles' : '+ Agregar más detalles'}</Text>
          </Pressable>

          {showDetails ? (
            <View style={{ gap: 13, borderTopWidth: 1, borderTopColor: '#F0EAE0', paddingTop: 13 }}>
              <DayPicker day={day} onChange={handleDayChange} />
              <TimeField label="Hora" value={time} onChange={setTime} />
              <StepperBox label="Duración" value={min + ' min'} onDec={() => setMin((v) => Math.max(1, v - 1))} onInc={() => setMin((v) => v + 1)} />

              <View style={{ gap: 8 }}>
                <GroupLabel>A dónde va</GroupLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                  {PUMP_DESTS.map((x) => <Chip key={x} selected={dest === x} onPress={() => setDest(x)}>{x}</Chip>)}
                </View>
              </View>

              <View style={{ gap: 4, borderRadius: 12, backgroundColor: '#F6F1FB', paddingHorizontal: 12, paddingVertical: 11 }}>
                <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 12.5, color: '#6B5DD3' }}>
                  {fmtVolume(ml, unit)} en {min} min · {fmtVolume(Math.round(ml / Math.max(1, min)), unit)}/min
                </Text>
                <Text style={{ fontSize: 12, lineHeight: 12 * 1.45, color: '#8A8299' }}>{hint}</Text>
              </View>
            </View>
          ) : null}
        </View>
      )}
    </SheetV2>
  );
}
export default FeedLogSheet;
