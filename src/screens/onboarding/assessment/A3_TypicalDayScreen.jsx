import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NightCanvas, StepHeader, StepFooter, Headline, ChipRow, ValueCard, BACKGROUNDS } from '../chrome/OnboardingChrome';
import { TimeField } from '../../../components/forms/TimeField';
import { fmt, dur } from '../../../lib/time';
import { plural, agree } from '../../../lib/grammar';
import { correctedAgeMonths, profileForAgeMonths } from '../../../lib/assessment';

const WAKE_OPTIONS = ['6:00', '6:30', '7:00', '7:30'].map((t) => ({ label: t, value: t }));
const BEDTIME_OPTIONS = ['18:30', '19:00', '19:30', '20:00'].map((t) => ({ label: t, value: t }));

function timeToDate(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Antes esto era un rango fijo (3h–6h) para cualquier edad — una recién
 * nacida que aguanta 1h–1h30 no tenía ninguna opción cercana, solo "No sé".
 * Ahora sale de PROFILES (data/profiles.js) según la edad corregida real.
 */
function windowOptionsFor(profile) {
  const lo = profile.winLow;
  const hiExtended = profile.winHigh + Math.round((profile.winHigh - profile.winLow) * 0.6);
  const step = Math.max(5, Math.round((hiExtended - lo) / 3 / 5) * 5);
  return [0, 1, 2, 3].map((i) => Math.round((lo + step * i) / 5) * 5).map((m) => ({ label: dur(m), value: m }));
}

/** A3 · ¿Cómo es un día normal? — "No sé aún" en la cabecera salta la pantalla completa (los 3 campos quedan null). */
export function A3_TypicalDayScreen({ draft, update, onNext, onBack, stepLabel = 'PASO 3 DE 6', stepIndex = 2, stepTotal = 6 }) {
  const insets = useSafeAreaInsets();
  const [pickerFor, setPickerFor] = useState(null); // 'wake' | 'bedtime' | null

  const skipAll = () => {
    update({ wakeTime: null, bedtime: null, wakeWindowMin: null, skippedSteps: draft.skippedSteps.includes('A3') ? draft.skippedSteps : draft.skippedSteps.concat('A3') });
    onNext();
  };

  const babies = draft.babies;
  const ageMonths = draft.birthDate ? correctedAgeMonths(draft.birthDate, draft.premature === 'si' ? draft.gestationWeeks : null) : 6;
  const profile = profileForAgeMonths(ageMonths);
  const windowValue = draft.wakeWindowMin != null ? dur(draft.wakeWindowMin) : '—';

  return (
    <NightCanvas variant={BACKGROUNDS.noche}>
      <StepHeader label={stepLabel} onBack={onBack} onSkip={skipAll} skipLabel="No sé aún" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 26, paddingTop: 20, paddingBottom: 20 }}>
        <Headline
          title="¿Cómo es un día normal?"
          body="Esto es lo que la app va a asumir cada mañana, para que en la madrugada no tengas que escribir nada."
        />
        <View style={{ height: 22 }} />
        <View style={{ gap: 14 }}>
          <ValueCard icon="despertar" label={plural(babies, 'Se despierta', 'Se despiertan') + ' a las'} value={draft.wakeTime ?? '—'}>
            <ChipRow
              options={WAKE_OPTIONS}
              value={draft.wakeTime}
              onChange={(v) => { setPickerFor(null); update({ wakeTime: v }); }}
              otraLabel="Otra"
              onOtra={() => setPickerFor(pickerFor === 'wake' ? null : 'wake')}
            />
            {pickerFor === 'wake' ? (
              <TimeField value={timeToDate(draft.wakeTime ?? '7:00')} minuteInterval={5} dark onChange={(d) => update({ wakeTime: fmt(d.getHours() * 60 + d.getMinutes()) })} />
            ) : null}
          </ValueCard>

          <ValueCard icon="sueno" label={plural(babies, 'Se acuesta', 'Se acuestan') + ' a las'} value={draft.bedtime ?? '—'}>
            <ChipRow
              options={BEDTIME_OPTIONS}
              value={draft.bedtime}
              onChange={(v) => { setPickerFor(null); update({ bedtime: v }); }}
              otraLabel="Otra"
              onOtra={() => setPickerFor(pickerFor === 'bedtime' ? null : 'bedtime')}
            />
            {pickerFor === 'bedtime' ? (
              <TimeField value={timeToDate(draft.bedtime ?? '19:30')} minuteInterval={5} dark onChange={(d) => update({ bedtime: fmt(d.getHours() * 60 + d.getMinutes()) })} />
            ) : null}
          </ValueCard>

          <ValueCard icon="ventana" label={plural(babies, 'Aguanta', 'Aguantan') + ' ' + agree(babies, 'despierto', 'despierta')} value={windowValue}>
            <ChipRow
              options={windowOptionsFor(profile).concat([{ label: 'No sé', value: null }])}
              value={draft.wakeWindowMin}
              onChange={(v) => update({ wakeWindowMin: v })}
            />
            <Text style={{ fontSize: 11.5, lineHeight: 11.5 * 1.5, color: '#6E6890' }}>
              Si eliges «No sé», la calculamos con tus primeros tres días de registro.
            </Text>
          </ValueCard>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 26, paddingBottom: 20 + insets.bottom }}>
        <StepFooter active={stepIndex} total={stepTotal} onNext={onNext} />
      </View>
    </NightCanvas>
  );
}
export default A3_TypicalDayScreen;
