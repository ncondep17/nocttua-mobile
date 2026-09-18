import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { theme } from '@nocttua/theme/native';
import { Chip, SegTabs, TimeStepper, GroupLabel, PrimaryButton, CategoryIcon } from '../../../components/v2/primitives';
import { SheetV2 } from '../../../components/v2/MobileChrome';
import { fmt, minutesOfDay } from '../../../lib/time';
import { plural } from '../../../lib/grammar';

const WAKE_BUCKETS = [
  { id: 'none', label: 'Ninguno', count: 0 },
  { id: 'one', label: '1', count: 1 },
  { id: 'two', label: '2', count: 2 },
  { id: 'threePlus', label: '3 o más', count: 3 },
  { id: 'unknown', label: 'No sé', count: null },
];

function bucketForCount(n) {
  if (n == null) return 'unknown';
  if (n <= 0) return 'none';
  if (n === 1) return 'one';
  if (n === 2) return 'two';
  return 'threePlus';
}

/**
 * "Cerrar la noche" — atajo rápido desde el héroe de Hoy y desde una fila
 * abierta en "Lo que ya pasó hoy" (PROMPT-hoy-v3.md §3). A propósito NO
 * reusa SleepLogSheet en modo completeOnly: esa hoja sigue viva para
 * editar/corregir un despertar ya cargado desde Mañana, pero acá los campos
 * son otros (selector con copy de consecuencia, stepper de 5 min, chips de
 * cantidad con salida "No sé").
 *
 * `openNights` es un array paralelo a `babies` — la fila cruda de `events`
 * de la noche todavía abierta de cada bebé, o null si esa ya se cerró
 * (ver getOpenNightEvent en data/dayRecords.js).
 */
export function CloseNightSheet({ open, babies, openNights, initialWho = 'both', planWakeMin, onClose, onSave }) {
  const [who, setWho] = useState(initialWho);
  const [wakeMin, setWakeMin] = useState(0);
  const [bucket, setBucket] = useState('none');

  const openIdx = babies.map((_, i) => i).filter((i) => openNights[i]);
  const singleBaby = babies.length <= 1;

  useEffect(() => {
    if (!open) return;
    const startWho = singleBaby ? 0 : (openIdx.includes(initialWho) || initialWho === 'both' ? initialWho : openIdx[0] ?? 'both');
    setWho(startWho);
    const refIdx = startWho === 'both' ? openIdx[0] : startWho;
    const suggested = (planWakeMin && planWakeMin[refIdx] != null) ? planWakeMin[refIdx] : minutesOfDay(new Date());
    setWakeMin(suggested);
    const existingCount = (refIdx != null ? openNights[refIdx]?.wake_count : 0) ?? 0;
    setBucket(bucketForCount(existingCount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const closingIdx = who === 'both' ? openIdx : [who].filter((i) => openNights[i]);
  const closingBabies = closingIdx.map((i) => babies[i]);
  const otherIdx = who === 'both' ? [] : openIdx.filter((i) => i !== who);
  const otherNames = otherIdx.map((i) => babies[i]?.name).filter(Boolean);

  const wakeCount = WAKE_BUCKETS.find((b) => b.id === bucket)?.count ?? null;

  const handleSave = () => {
    const closures = closingIdx.map((i) => ({ night: openNights[i], endedAt: (() => {
      const d = new Date();
      d.setHours(Math.floor(wakeMin / 60), wakeMin % 60, 0, 0);
      return d.toISOString();
    })(), wakeCount }));
    onSave && onSave(closures, who);
  };

  const ctaLabel = who === 'both' || singleBaby
    ? 'Guardar y ver el reporte'
    : 'Guardar el despertar de ' + (babies[who]?.name ?? '');

  return (
    <SheetV2
      open={open}
      onClose={onClose}
      footer={<PrimaryButton style={{ flex: 1 }} onPress={handleSave} disabled={closingIdx.length === 0}>{ctaLabel}</PrimaryButton>}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
        <CategoryIcon category="despertar" size={40} />
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={{ fontFamily: theme.fontFamily.displayApp, fontSize: 23, lineHeight: 23 * 1.05, color: '#16162B' }}>Cerrar la noche</Text>
          <Text style={{ fontFamily: theme.fontFamily.mono, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: '#8A8299' }}>
            {(who === 'both' ? 'Las dos' : (babies[who]?.name ?? '')).toUpperCase()}
          </Text>
        </View>
        <Text onPress={onClose} style={{ fontSize: 13, color: '#6B5DD3' }}>Cerrar</Text>
      </View>

      {!singleBaby ? (
        <View style={{ gap: 8 }}>
          <GroupLabel>¿Quién despertó?</GroupLabel>
          <SegTabs
            items={[{ id: 'both', label: 'Las dos' }, ...openIdx.map((i) => ({ id: i, label: babies[i].name }))]}
            active={who}
            onSelect={setWho}
          />
          <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.4, color: '#8A8299' }}>
            Por defecto se aplica a las dos. Si una despertó antes, elige solo a esa: la otra sigue con su noche abierta.
          </Text>
        </View>
      ) : null}

      <View style={{ gap: 8, alignItems: 'center' }}>
        <GroupLabel>{'¿A qué hora ' + plural(closingBabies, 'despertó', 'despertaron') + '?'}</GroupLabel>
        <TimeStepper
          value={fmt(wakeMin)}
          onDec={() => setWakeMin((m) => ((m - 5) + 1440) % 1440)}
          onInc={() => setWakeMin((m) => (m + 5) % 1440)}
        />
      </View>

      <View style={{ gap: 8 }}>
        <GroupLabel>¿Cuántos despertares?</GroupLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {WAKE_BUCKETS.map((b) => (
            <Chip key={b.id} selected={bucket === b.id} onPress={() => setBucket(b.id)}>{b.label}</Chip>
          ))}
        </View>
        {bucket === 'unknown' ? (
          <Text style={{ fontSize: 12, color: '#8A8299' }}>El puntaje de esta noche va a mostrar — en vez de inventar un número.</Text>
        ) : null}
      </View>

      {otherNames.length > 0 ? (
        <Text style={{ fontSize: 12.5, lineHeight: 12.5 * 1.4, color: '#8A8299' }}>
          La noche de {otherNames.join(' y ')} queda abierta. El reporte se abre cuando las dos despierten.
        </Text>
      ) : null}
    </SheetV2>
  );
}
export default CloseNightSheet;
