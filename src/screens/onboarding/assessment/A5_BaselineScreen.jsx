import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@nocttua/theme/native';
import { NightCanvas, StepHeader, StepFooter, Headline, ChipRow, BACKGROUNDS } from '../chrome/OnboardingChrome';
import { TimeField } from '../../../components/forms/TimeField';

const WAKINGS_OPTIONS = [
  { label: 'Nunca', value: 0 }, { label: '1 vez', value: 1 }, { label: '2 o 3', value: 2.5 }, { label: 'Más', value: 4 },
];
const METHOD_OPTIONS = [
  { label: 'Solas en la cuna', value: 'alone' }, { label: 'Con palmaditas', value: 'patted' },
  { label: 'Cargadas', value: 'held' }, { label: 'Con la toma', value: 'fed' },
];
const LATENCY_OPTIONS = [
  { label: '<5 m', value: 5 }, { label: '10 m', value: 10 }, { label: '20 m', value: 20 }, { label: '30 m+', value: 30 },
];
const FEED_COUNT_OPTIONS = [{ label: '0', value: 0 }, { label: '1', value: 1 }, { label: '2', value: 2 }, { label: '3+', value: 3 }];

function defaultFeedTimes(n) {
  // Repartidas a lo largo de la noche — punto de partida editable, no una medición.
  const spots = ['23:30', '2:30', '5:00'];
  return Array.from({ length: n }, (_, i) => ({ atApprox: spots[i] ?? '4:00' }));
}

/** A5 · ¿Cómo son las noches ahora? — línea base de diagnóstico, NO forma parte del Plan (ver README §4). */
export function A5_BaselineScreen({ draft, update, onNext, onBack }) {
  const insets = useSafeAreaInsets();
  const b = draft.baseline;
  const [feedTimePicker, setFeedTimePicker] = useState(null);

  const updateBaseline = (patch) => update((d) => ({ baseline: { ...d.baseline, ...patch } }));

  const setFeedCount = (n) => updateBaseline({ nightFeeds: defaultFeedTimes(n) });
  const updateFeedTime = (i, atApprox) => updateBaseline({ nightFeeds: b.nightFeeds.map((f, idx) => (idx === i ? { atApprox } : f)) });

  const canContinue = b.wakingsPerNight != null && !!b.fallAsleepMethod && b.latencyMin != null;

  return (
    <NightCanvas variant={BACKGROUNDS.noche}>
      <StepHeader label="PASO 5 DE 6" onSkip={onBack} skipLabel="Atrás" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 26, paddingTop: 20, paddingBottom: 20 }}>
        <Headline
          title="¿Cómo son las noches ahora?"
          body="Es tu punto de partida. Contra esto vas a comparar el progreso, y de aquí sale el puntaje de cada mañana."
        />
        <View style={{ height: 22 }} />
        <View style={{ gap: 16 }}>
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, color: '#B9B2C9' }}>Se despiertan de noche</Text>
            <ChipRow options={WAKINGS_OPTIONS} value={b.wakingsPerNight} onChange={(v) => updateBaseline({ wakingsPerNight: v })} />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, color: '#B9B2C9' }}>Se duermen casi siempre</Text>
            <ChipRow options={METHOD_OPTIONS} value={b.fallAsleepMethod} onChange={(v) => updateBaseline({ fallAsleepMethod: v })} columns={2} />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, color: '#B9B2C9' }}>Tardan en dormirse</Text>
            <ChipRow options={LATENCY_OPTIONS} value={b.latencyMin} onChange={(v) => updateBaseline({ latencyMin: v })} />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, color: '#B9B2C9' }}>¿Comen de noche?</Text>
            <ChipRow options={FEED_COUNT_OPTIONS} value={b.nightFeeds.length > 3 ? 3 : b.nightFeeds.length} onChange={setFeedCount} />
            {b.nightFeeds.map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 12.5, color: '#8E87B5', width: 70 }}>Toma {i + 1}</Text>
                <View style={{ flex: 1 }}>
                  {feedTimePicker === i ? (
                    <TimeField
                      value={(() => { const [h, m] = f.atApprox.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d; })()}
                      dark minuteInterval={15}
                      onChange={(d) => { updateFeedTime(i, d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0')); setFeedTimePicker(null); }}
                    />
                  ) : (
                    <Text
                      onPress={() => setFeedTimePicker(i)}
                      style={{ fontFamily: theme.fontFamily.mono, fontSize: 14, color: '#FBF7F0', borderWidth: 1, borderColor: '#2C2C52', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, alignSelf: 'flex-start' }}
                    >
                      {f.atApprox}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 26, paddingBottom: 20 + insets.bottom }}>
        <StepFooter active={4} total={6} onNext={onNext} disabled={!canContinue} />
      </View>
    </NightCanvas>
  );
}
export default A5_BaselineScreen;
